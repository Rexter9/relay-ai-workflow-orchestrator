import axios from "axios";

// Backend base URL — persisted in localStorage so it survives page reloads.
const getApiBase = () => localStorage.getItem("relay_api_base") || "http://localhost:5000";

export const setApiBase = (url) => {
  localStorage.setItem("relay_api_base", url);
};

const client = () =>
  axios.create({
    baseURL: getApiBase(),
    headers: { "Content-Type": "application/json" },
  });

// ---- Workflows ----
export const listWorkflows = () => client().get("/workflows").then((res) => res.data);
export const createWorkflow = (payload) => client().post("/workflows", payload).then((res) => res.data);
export const publishWorkflow = (id) => client().post(`/workflows/${id}/publish`).then((res) => res.data);
export const deleteWorkflow = (id) => client().delete(`/workflows/${id}`).then((res) => res.data);

// ---- Triggers ----
export const triggerManual = (workflowId, payload) =>
  client().post(`/trigger/manual/${workflowId}`, payload).then((res) => res.data);

// Webhook trigger — this is the path an EXTERNAL system (a payment
// gateway, an e-commerce platform, a cron job elsewhere) would call,
// authenticated with the workflow's own secret rather than by being
// logged into this console. The secret goes in the x-relay-secret header.
export const triggerWebhook = (workflowId, secret, payload) =>
  client()
    .post(`/webhook/${workflowId}`, payload, { headers: { "x-relay-secret": secret } })
    .then((res) => res.data);

// ---- Runs ----
export const listRuns = (workflowId) =>
  client()
    .get("/runs", { params: workflowId ? { workflowId } : {} })
    .then((res) => res.data);

export const getRun = (runId) => client().get(`/runs/${runId}`).then((res) => res.data);
export const deleteRun = (runId) => client().delete(`/runs/${runId}`).then((res) => res.data);

// ---- Approvals ----
export const listApprovals = () => client().get("/approvals").then((res) => res.data);
export const decideApproval = (approvalId, decision, decidedBy, notes) =>
  client()
    .post(`/approvals/${approvalId}/decide`, { decision, decidedBy, notes })
    .then((res) => res.data);

export { getApiBase };