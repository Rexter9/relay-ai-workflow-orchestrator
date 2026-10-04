const httpRequest = require("./httpRequest.node");
const condition = require("./condition.node");
const delay = require("./delay.node");
const notify = require("./notify.node");
const ai = require("./ai.node");
const approval = require("./approval.node");
 
// This is the "registry" — maps a node type to its executor function.
// The engine doesn't know what any node actually does; it only looks up
// this map by type and calls whichever function is registered there.
const nodeRegistry = {
  http_request: httpRequest.execute,
  condition: condition.execute,
  delay: delay.execute,
  notify: notify.execute,
  ai: ai.execute,
  approval: approval.execute,
};
 
module.exports = nodeRegistry;