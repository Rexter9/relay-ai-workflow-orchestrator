const execute = async (config) => {
  const { durationMs = 1000 } = config;
  await new Promise((resolve) => setTimeout(resolve, durationMs));
  return { waited: durationMs };
};

module.exports = { execute };