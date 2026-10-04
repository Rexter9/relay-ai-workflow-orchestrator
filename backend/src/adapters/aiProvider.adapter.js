const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // wait 2 seconds between retries

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// This is the ONLY place that talks to the actual AI provider.
// Engine tests can mock this entire file to avoid real API calls.
const callAI = async (prompt) => {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });

      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("AI provider timeout")), 10000) // timeout requirement
        ),
      ]);

      const text = result.response.text();
      const usage = result.response.usageMetadata || {};

      return {
        text,
        promptTokens: usage.promptTokenCount || 0,
        completionTokens: usage.candidatesTokenCount || 0,
      };
    } catch (error) {
      lastError = error;

      // Only retry on transient errors (server overloaded / rate limited), not on bad requests
      const isRetryable =
        error.message?.includes("503") ||
        error.message?.includes("429") ||
        error.message?.includes("overloaded") ||
        error.message?.includes("high demand");

      if (isRetryable && attempt < MAX_RETRIES) {
        console.warn(`⚠️ AI call failed (attempt ${attempt}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS}ms...`);
        await sleep(RETRY_DELAY_MS);
        continue;
      }

      throw lastError;
    }
  }
};

module.exports = { callAI };