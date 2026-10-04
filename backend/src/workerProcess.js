require("dotenv").config();
const connectDB = require("./db");
require("./engine/worker"); // The worker will start when this file is executed.

connectDB();

console.log("🚀 Relay worker process started");