const axios = require("axios");
const crypto = require("crypto");

// This node calls an external URL — generic, can hit any API
const execute = async (config, context) => {
  const { url, method = "GET", body = {}, headers = {} } = config;

  // Generate a unique idempotency key for this specific call
  // It's based on the run's context so the same logical action always gets the same key,
  // even if this code accidentally runs twice after a crash
  const idempotencyKey = crypto
    .createHash("sha256")
    .update(JSON.stringify({ url, body, runInput: context.input }))
    .digest("hex");

  const response = await axios({
    url,
    method,
    data: body,
    headers: {
      ...headers,
      "Idempotency-Key": idempotencyKey, // sent to the external system so IT can also dedupe
    },
    timeout: 10000, // timeout requirement
  });

  return {
    statusCode: response.status,
    data: response.data,
    idempotencyKey, // we return this so the engine can save it in the Step record
  };
};

module.exports = { execute };