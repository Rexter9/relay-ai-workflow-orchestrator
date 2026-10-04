// Ready-made, real-world workflow templates. Each one is a complete
// nodes + edges definition that matches the backend's generic node
// registry (http_request, condition, delay, notify, ai, approval).
// Picking one from the UI pre-fills the "create workflow" form —
// nothing here is sent to the backend until the user clicks Create.
//
// http_request nodes call https://httpbin.org/post, a free public test
// endpoint that echoes back whatever is sent — this lets every "automated"
// step actually execute and succeed live, with no real payment/booking
// API needed for the demo.

export const WORKFLOW_TEMPLATES = [
  {
    key: "refund",
    name: "E-Commerce Refund Processing",
    description:
      "AI checks refund risk. Small, low-risk refunds are auto-processed. Large or suspicious ones are routed to a human for approval before any money moves.",
    tag: "Human Approval",
    sampleTriggerPayload: { reason: "Item arrived damaged", amount: 1200 },
    definition: {
      nodes: [
        {
          id: "node_1",
          type: "ai",
          config: {
            promptTemplate:
              "A customer requests a refund. Reason: {{input.reason}}. Order amount in INR: {{input.amount}}. Treat amounts above 5000 as high risk, and any mention of fraud or dispute as high risk regardless of amount. Otherwise treat it as low risk.",
            schema: {
              type: "object",
              properties: {
                riskLevel: { type: "string", enum: ["high", "low"] },
                reason: { type: "string" },
              },
              required: ["riskLevel"],
            },
          },
          position: { x: 0, y: 0 },
        },
        {
          id: "node_2",
          type: "condition",
          config: { field: "nodes.node_1.riskLevel", operator: "equals", value: "high" },
          position: { x: 0, y: 1 },
        },
        {
          id: "node_3",
          type: "approval",
          config: {},
          position: { x: 1, y: 2 },
        },
        {
          id: "node_4",
          type: "http_request",
          config: {
            url: "https://httpbin.org/post",
            method: "POST",
            body: { action: "process_refund" },
          },
          position: { x: 0, y: 3 },
        },
        {
          id: "node_5",
          type: "notify",
          config: { target: "customer", message: "Your refund has been processed." },
          position: { x: 0, y: 4 },
        },
      ],
      edges: [
        { from: "node_1", to: "node_2" },
        { from: "node_2", to: "node_3", condition: "true" },
        { from: "node_2", to: "node_4", condition: "false" },
        { from: "node_3", to: "node_4" },
        { from: "node_4", to: "node_5" },
      ],
    },
  },

  {
    key: "support",
    name: "Support Ticket Auto-Router",
    description:
      "AI reads an incoming support ticket and classifies its urgency, then automatically routes it to the right team. No human step — fully automated end to end.",
    tag: "Fully Automated",
    sampleTriggerPayload: { subject: "Payment failed twice, I was charged both times" },
    definition: {
      nodes: [
        {
          id: "node_1",
          type: "ai",
          config: {
            promptTemplate:
              "Classify the urgency of this support ticket as 'high' or 'low'. Ticket: {{input.subject}}",
            schema: {
              type: "object",
              properties: { urgency: { type: "string", enum: ["high", "low"] } },
              required: ["urgency"],
            },
          },
          position: { x: 0, y: 0 },
        },
        {
          id: "node_2",
          type: "condition",
          config: { field: "nodes.node_1.urgency", operator: "equals", value: "high" },
          position: { x: 0, y: 1 },
        },
        {
          id: "node_3",
          type: "notify",
          config: { target: "escalation-team", message: "Urgent ticket needs immediate attention." },
          position: { x: 1, y: 2 },
        },
        {
          id: "node_4",
          type: "notify",
          config: { target: "general-queue", message: "New ticket added to the queue." },
          position: { x: 0, y: 2 },
        },
      ],
      edges: [
        { from: "node_1", to: "node_2" },
        { from: "node_2", to: "node_3", condition: "true" },
        { from: "node_2", to: "node_4", condition: "false" },
      ],
    },
  },

  {
    key: "booking",
    name: "Movie Ticket Booking",
    description:
      "Checks seat availability for the show, books the seat and confirms automatically if available, or notifies the customer it's sold out. No human step.",
    tag: "Fully Automated",
    sampleTriggerPayload: { movie: "Interstellar 7PM show", seatsAvailable: true },
    definition: {
      nodes: [
        {
          id: "node_1",
          type: "condition",
          config: { field: "input.seatsAvailable", operator: "equals", value: true },
          position: { x: 0, y: 0 },
        },
        {
          id: "node_2",
          type: "http_request",
          config: {
            url: "https://httpbin.org/post",
            method: "POST",
            body: { action: "book_seat" },
          },
          position: { x: 1, y: 1 },
        },
        {
          id: "node_3",
          type: "notify",
          config: { target: "customer", message: "Your seat is booked! Enjoy the show." },
          position: { x: 1, y: 2 },
        },
        {
          id: "node_4",
          type: "notify",
          config: { target: "customer", message: "Sorry, this show is sold out." },
          position: { x: 0, y: 1 },
        },
      ],
      edges: [
        { from: "node_1", to: "node_2", condition: "true" },
        { from: "node_1", to: "node_4", condition: "false" },
        { from: "node_2", to: "node_3" },
      ],
    },
  },

  {
    key: "moderation",
    name: "Content Moderation Review",
    description:
      "AI scans user-submitted content for policy violations. Clean content is published automatically; flagged content is held for a human moderator to make the final call.",
    tag: "Human Approval",
    sampleTriggerPayload: { content: "Check out this amazing deal, click here now!!!" },
    definition: {
      nodes: [
        {
          id: "node_1",
          type: "ai",
          config: {
            promptTemplate:
              "Review this user-submitted content for spam, scams, or policy violations: {{input.content}}",
            schema: {
              type: "object",
              properties: {
                flagged: { type: "boolean" },
                reason: { type: "string" },
              },
              required: ["flagged"],
            },
          },
          position: { x: 0, y: 0 },
        },
        {
          id: "node_2",
          type: "condition",
          config: { field: "nodes.node_1.flagged", operator: "equals", value: true },
          position: { x: 0, y: 1 },
        },
        {
          id: "node_3",
          type: "approval",
          config: {},
          position: { x: 1, y: 2 },
        },
        {
          id: "node_4",
          type: "http_request",
          config: {
            url: "https://httpbin.org/post",
            method: "POST",
            body: { action: "remove_content" },
          },
          position: { x: 1, y: 3 },
        },
        {
          id: "node_5",
          type: "notify",
          config: { target: "author", message: "Your content was removed after review." },
          position: { x: 1, y: 4 },
        },
        {
          id: "node_6",
          type: "notify",
          config: { target: "author", message: "Your content has been published." },
          position: { x: 0, y: 2 },
        },
      ],
      edges: [
        { from: "node_1", to: "node_2" },
        { from: "node_2", to: "node_3", condition: "true" },
        { from: "node_2", to: "node_6", condition: "false" },
        { from: "node_3", to: "node_4" },
        { from: "node_4", to: "node_5" },
      ],
    },
  },

  {
    key: "expense",
    name: "Expense Reimbursement",
    description:
      "AI reads the expense claim. Small claims are reimbursed automatically. Anything above the limit is routed to a manager for approval before payout.",
    tag: "Human Approval",
    sampleTriggerPayload: { category: "Client dinner", amount: 3500 },
    definition: {
      nodes: [
        {
          id: "node_1",
          type: "ai",
          config: {
            promptTemplate:
              "An employee submitted an expense claim. Category: {{input.category}}. Amount in INR: {{input.amount}}. Treat amounts above 2000 as needing manager approval, otherwise it can be auto-approved.",
            schema: {
              type: "object",
              properties: { needsApproval: { type: "boolean" } },
              required: ["needsApproval"],
            },
          },
          position: { x: 0, y: 0 },
        },
        {
          id: "node_2",
          type: "condition",
          config: { field: "nodes.node_1.needsApproval", operator: "equals", value: true },
          position: { x: 0, y: 1 },
        },
        {
          id: "node_3",
          type: "approval",
          config: {},
          position: { x: 1, y: 2 },
        },
        {
          id: "node_4",
          type: "http_request",
          config: {
            url: "https://httpbin.org/post",
            method: "POST",
            body: { action: "reimburse" },
          },
          position: { x: 0, y: 3 },
        },
        {
          id: "node_5",
          type: "notify",
          config: { target: "employee", message: "Your reimbursement has been paid out." },
          position: { x: 0, y: 4 },
        },
      ],
      edges: [
        { from: "node_1", to: "node_2" },
        { from: "node_2", to: "node_3", condition: "true" },
        { from: "node_2", to: "node_4", condition: "false" },
        { from: "node_3", to: "node_4" },
        { from: "node_4", to: "node_5" },
      ],
    },
  },
];