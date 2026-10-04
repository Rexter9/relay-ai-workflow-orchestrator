const { Queue } = require("bullmq");
const connection = require("./redisConnection");

const runQueue = new Queue("run-queue", { connection });

module.exports = runQueue;