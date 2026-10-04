const { Worker } = require("bullmq");
const connection = require("../queue/redisConnection");
const { executeRun } = require("./runEngine");

const worker = new Worker(
  "run-queue",
  async (job) => {
    const { runId } = job.data;
    console.log(`🔧 Worker picked up run: ${runId}`);
    await executeRun(runId);
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`🎉 Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

console.log("👷 Worker is listening for jobs...");

module.exports = worker;