# Relay — AI Workflow Orchestrator

Relay is a backend-first, n8n-style **workflow orchestration engine** with a
React console on top. You design a workflow as a DAG (directed graph) of
nodes — AI calls, HTTP requests, conditions, delays, notifications, and
human-approval gates — and Relay executes it step by step, persisting every
step to MongoDB so a run can resume safely even if the worker crashes
mid-execution.

Built as a MERN + Google Gemini capstone project.

---

## 1. What this project does

- **DAG engine** — a workflow is stored as JSON (`nodes` + `edges`); the
  engine walks the graph node by node, not a fixed pipeline.
- **Queue-based execution** — every triggered run is pushed onto a
  BullMQ/Redis queue and picked up by a separate **worker** process, so the
  API server stays responsive while runs execute in the background.
- **Resume-safe runs** — each step's status is written to MongoDB as it
  happens. If the worker crashes, the next pickup resumes from the last
  completed step instead of starting over or double-running side effects.
- **Human-approval gates** — a workflow can pause at an `approval` node and
  wait until a human approves or rejects it from the console before
  continuing.
- **Two trigger paths** — manually from the console, or via webhook
  (`POST /webhook/:workflowId` with an `x-relay-secret` header), simulating
  a real external system such as a payment gateway calling in.
- **Prompt-injection defenses** — AI node inputs are template-resolved
  safely (no raw string interpolation of untrusted data) and scanned for
  suspicious instruction-override patterns before being sent to Gemini.
- **5 ready-made workflow templates**, creatable from the frontend: e-commerce
  refund processing, support ticket auto-routing, movie ticket booking,
  content moderation review, and expense reimbursement — a mix of
  fully-automated and human-approval-required flows.

---

## 2. Architecture

```
                    ┌─────────────┐
   Browser  ───────▶│   Frontend   │  (React + Vite, served by nginx)
                    └──────┬──────┘
                           │ REST (axios)
                           ▼
                    ┌─────────────┐        ┌──────────────┐
                    │   Backend    │───────▶│  MongoDB     │
                    │ (Express API)│        │  (Atlas)     │
                    └──────┬──────┘        └──────────────┘
                           │ enqueue run
                           ▼
                    ┌─────────────┐
                    │    Redis     │◀────── job queue (BullMQ)
                    └──────┬──────┘
                           │ dequeue run
                           ▼
                    ┌─────────────┐
                    │    Worker    │──────▶ Gemini API / external HTTP APIs
                    │ (node process)│
                    └─────────────┘
```

The **backend** and **worker** are two separate, always-running Node
processes built from the same codebase — the backend handles HTTP requests
and enqueues runs; the worker executes workflow steps. They run as two
separate Docker containers from one image, mirroring how this would be
deployed in production (e.g. two separate services on Render).

---

## 3. Tech stack

| Layer      | Technology                                             |
|------------|---------------------------------------------------------|
| Frontend   | React (Vite), Tailwind CSS v4, framer-motion, axios      |
| Backend    | Node.js, Express                                         |
| Database   | MongoDB (Atlas), Mongoose                                |
| Queue      | Redis + BullMQ                                           |
| AI         | Google Gemini API                                        |
| Containers | Docker, Docker Compose                                   |

---

## 4. Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- A MongoDB connection string ([MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) free tier, or run Mongo locally — see section 7).
- A free [Google Gemini API key](https://aistudio.google.com/app/apikey).

Node.js does **not** need to be installed on your machine — Docker builds everything inside containers.

---

## 5. Running with Docker

```bash
# 1. Set your environment variables
cp backend/.env.example backend/.env
# then edit backend/.env and fill in MONGODB_URI and GEMINI_API_KEY

# 2. Build and start all services
docker compose up --build

# 3. Check everything is running
docker compose ps
curl http://localhost:5000      # backend health check
```

Open **http://localhost:5173** in your browser for the React console.

This starts 4 containers: `redis`, `backend` (API), `worker` (queue consumer), and `frontend` (nginx).

Stop everything with:
```bash
docker compose down
```

> **Before your first build**, confirm your `backend/src/queue/redisConnection.js`
> and Mongo connection file read `process.env.REDIS_URL` and
> `process.env.MONGODB_URI`. If your code uses different variable names,
> update `backend/.env` and `docker-compose.yml` to match.

---

## 6. Testing the app end-to-end

1. Open **http://localhost:5173** → Workflows page.
2. Pick a template (e.g. "Movie Ticket Booking") → Create → Publish.
3. Click **Trigger** → try both modes:
   - **Manual (console)** — runs immediately from the UI.
   - **Webhook (external system)** — copies the webhook URL + secret, simulating an outside system calling `POST /webhook/:workflowId`.
4. Go to the **Runs** page → expand a run → see the step-by-step trace.
5. For a workflow with an approval node, go to **Approvals** → Approve or Reject → watch the run resume on the Runs page.
6. Delete a workflow or run using the trash icon to confirm cascading cleanup.

---

## 7. Running MongoDB locally instead of Atlas (optional)

Uncomment the `mongo` service in `docker-compose.yml`, add `mongo_data:` under `volumes:`, and set in `backend/.env`:
```
MONGODB_URI=mongodb://mongo:27017/relay
```
Rebuild with `docker compose up --build`.

---

## 8. Environment variables

| Variable         | Used by          | Example (Docker)                          |
|-------------------|------------------|---------------------------------------------|
| `MONGODB_URI`     | backend, worker  | `mongodb+srv://user:pass@cluster/relay`      |
| `PORT`            | backend          | `5000`                                       |
| `REDIS_URL`       | backend, worker  | `redis://redis:6379` (set by compose)        |
| `GEMINI_API_KEY`  | worker (AI node) | your Gemini key                              |

---

## 9. Known limitations

- **Gemini free-tier quota**: a limited number of requests per day per
  model. A `429 Too Many Requests` in the worker logs means the quota is
  temporarily exhausted, not a bug — non-AI steps (`http_request`,
  `condition`, `notify`, `approval`) are unaffected, and the engine's
  retry/error-handling is itself part of what this project demonstrates.
- No authentication/login layer yet — the console assumes a single trusted operator, as scoped for this capstone.
- MongoDB Atlas is the default data store; a local Mongo container is available as an opt-in alternative (section 7).