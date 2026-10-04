// Basic defense-in-depth check for prompt-injection style phrases.
// This does NOT replace the real protection (which is: AI output never
// directly controls approvals or sensitive actions — see approval.service.js).
// This just flags obviously suspicious payloads for the trace/log.
const SUSPICIOUS_PATTERNS = [
  /ignore (all )?(previous|above) instructions/i,
  /disregard (all )?(previous|above)/i,
  /you are now/i,
  /system prompt/i,
  /act as/i,
];

const detectSuspiciousInput = (text) => {
  if (typeof text !== "string") return false;
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(text));
};

module.exports = { detectSuspiciousInput };