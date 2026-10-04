const execute = async (config, context) => {
  const { message, target = "default" } = config;
  console.log(`📣 NOTIFY [${target}]: ${message}`);
  return { notified: true, target, message };
};

module.exports = { execute };