const Run = require("../db/models/run");
const Step = require("../db/models/Step");
const nodeRegistry = require("./nodes");

const MAX_STEPS = 50; // step-cap guardrail — stops a run if it executes more steps than this

// Find the DAG's start node — the one with no incoming edge
const findStartNode = (nodes, edges) => {
  const targetIds = new Set(edges.map((e) => e.to));
  const start = nodes.find((n) => !targetIds.has(n.id));
  return start ? start.id : nodes[0]?.id;
};

// Decide the next node based on the current node's output
const getNextNodeId = (currentNodeId, edges, output) => {
  const outgoing = edges.filter((e) => e.from === currentNodeId);
  if (outgoing.length === 0) return null; // end of the graph

  // If this was a condition node, output.result (true/false) decides the branch
  if (typeof output?.result === "boolean") {
    const branch = outgoing.find((e) => e.condition === String(output.result));
    if (branch) return branch.to;
  }

  return outgoing[0].to; // otherwise just follow the next edge
};

const executeRun = async (runId) => {
  const run = await Run.findById(runId);
  if (!run) throw new Error(`Run ${runId} not found`);

  const { nodes, edges } = run.workflowSnapshot;

  // Context — input + each node's output accumulates here, so later nodes
  // can use earlier results (e.g. a condition node checking a field)
  const context = { input: run.input, nodes: {} };

  // CRASH-RESUME: reload outputs of already-completed steps back into context
  const previousSteps = await Step.find({ runId: run._id, status: "completed" });
  previousSteps.forEach((s) => { context.nodes[s.nodeId] = s.output; });

  run.status = "running";
  await run.save();

  // Resume point: if currentNodeId was already set (crash happened earlier), continue from there
  let currentNodeId = run.currentNodeId || findStartNode(nodes, edges);

  while (currentNodeId) {
    // STEP CAP GUARDRAIL
    if (run.totalStepsExecuted >= MAX_STEPS) {
      run.status = "failed";
      run.error = `Step cap of ${MAX_STEPS} exceeded`;
      await run.save();
      console.error(`🛑 Run ${runId} stopped — step cap exceeded`);
      return;
    }

    // This node already completed before (post-crash resume) — skip it
    if (run.completedNodeIds.includes(currentNodeId)) {
      currentNodeId = getNextNodeId(currentNodeId, edges, context.nodes[currentNodeId]);
      continue;
    }

    const node = nodes.find((n) => n.id === currentNodeId);
    if (!node) {
      run.status = "failed";
      run.error = `Node ${currentNodeId} not found in workflow snapshot`;
      await run.save();
      return;
    }

    const executor = nodeRegistry[node.type];
    if (!executor) {
      run.status = "failed";
      run.error = `No executor registered for node type: ${node.type}`;
      await run.save();
      console.error(`❌ ${run.error}`);
      return;
    }

    run.currentNodeId = currentNodeId;
    await run.save();

    // Create the step record — this is what builds the trace
    const step = new Step({
      runId: run._id,
      nodeId: node.id,
      nodeType: node.type,
      status: "running",
      input: node.config,
      startedAt: new Date(),
    });
    await step.save();

    try {
      // Pass runId and nodeId as extra context so nodes like "approval" can
      // create records tied to this specific run/node
      const output = await executor(node.config, context, { runId: run._id, nodeId: node.id });

      // SPECIAL CASE: approval node signals the engine to pause here.
      // We do NOT mark this step completed and do NOT advance — the run
      // stays exactly here until a human approves/rejects via the API.
      if (output?.__pauseForApproval) {
        step.status = "pending";
        await step.save();

        run.status = "waiting_approval";
        await run.save();

        console.log(`⏸️ Run ${runId} is now waiting for approval at node ${node.id}`);
        return; // stop the loop — this is intentional, not a failure
      }

      step.status = "completed";
      step.output = output;
      step.completedAt = new Date();
      step.durationMs = step.completedAt - step.startedAt;

      // Save the idempotency key if this node generated one
      // (http_request node returns one — see httpRequest.node.js)
      // This is what lets us prove a side-effect call was never duplicated on crash-resume
      if (output?.idempotencyKey) {
        step.idempotencyKey = output.idempotencyKey;
      }

      // Save AI token usage into the trace, if this node produced any
      // (the ai node returns this — see ai.node.js)
      if (output?._tokenUsage) {
        step.tokenUsage = output._tokenUsage;
      }

      await step.save();

      context.nodes[node.id] = output;

      // 👇 THIS IS THE MOST IMPORTANT LINE — crash-resume depends on this
      run.completedNodeIds.push(node.id);
      run.totalStepsExecuted += 1;
      await run.save();

      currentNodeId = getNextNodeId(currentNodeId, edges, output);
    } catch (error) {
      step.status = "failed";
      step.error = error.message;
      step.completedAt = new Date();
      await step.save();

      run.status = "failed";
      run.error = `Node ${node.id} failed: ${error.message}`;
      await run.save();
      console.error(`❌ Run ${runId} failed at node ${node.id}:`, error.message);
      return;
    }
  }

  // Loop finished — no more nodes, so the run is complete
  run.status = "completed";
  run.output = context.nodes;
  await run.save();
  console.log(`✅ Run ${runId} completed successfully`);
};

module.exports = { executeRun, findStartNode, getNextNodeId };