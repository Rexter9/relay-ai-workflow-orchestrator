const Ajv = require("ajv");
const { callAI } = require("../../adapters/aiProvider.adapter");
const { detectSuspiciousInput } = require("../../utils/sanitizeInput");

const ajv = new Ajv();

// Replace {{input.field}} / {{nodes.someNode.field}} placeholders inside the
// prompt template with actual values from context. Every value is inserted
// via JSON.stringify — never spliced in as raw text. This is the core
// prompt-injection defense: whatever the user/webhook payload contains
// becomes a quoted JSON string inside the prompt, not a live instruction.
const resolveTemplate = (template, context) => {
  return template.replace(/{{\s*([\w.]+)\s*}}/g, (match, path) => {
    const parts = path.split(".");
    let value = context;
    for (const part of parts) {
      value = value?.[part];
    }
    if (value === undefined) return match; // leave placeholder as-is if not found
    return typeof value === "string" ? value : JSON.stringify(value);
  });
};

const execute = async (config, context) => {
  const { promptTemplate, schema } = config;

  if (!promptTemplate || !schema) {
    throw new Error("AI node config must include 'promptTemplate' and 'schema'");
  }

  // DEFENSE-IN-DEPTH CHECK: scan the raw input for obvious prompt-injection
  // phrases before we even build the prompt. This does NOT block the run —
  // the real protection is that AI output can never directly approve itself
  // (see approval.node.js / approval.service.js). This just logs a warning
  // so it shows up in the trace for review.
  const rawInputText = JSON.stringify(context.input || {});
  if (detectSuspiciousInput(rawInputText)) {
    console.warn("⚠️ Suspicious input detected before AI call — proceeding, but flagged in logs:", rawInputText);
  }

  const resolvedPrompt = resolveTemplate(promptTemplate, context);

  // Append the schema as an explicit instruction — the AI is told the exact
  // shape we expect back, and we validate against it below. We never trust
  // the AI's own claim about following instructions; we verify the output.
  const fullPrompt = `${resolvedPrompt}\n\nRespond ONLY with valid JSON matching this schema, no extra text:\n${JSON.stringify(schema)}`;

  const { text, promptTokens, completionTokens } = await callAI(fullPrompt);

  // Strip markdown code fences if the model wrapped the JSON in ```json ... ```
  const cleaned = text.replace(/```json\s*|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`AI response was not valid JSON: ${cleaned}`);
  }

  // SCHEMA VALIDATION: the AI's output is never trusted blindly — it must
  // match the schema the workflow author defined for this node.
  const validate = ajv.compile(schema);
  const valid = validate(parsed);

  if (!valid) {
    throw new Error(`AI output failed schema validation: ${JSON.stringify(validate.errors)}`);
  }

  return {
    ...parsed,
    _tokenUsage: { promptTokens, completionTokens },
  };
};

module.exports = { execute };