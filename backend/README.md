# Wind Backend

Production backend for Wind, built with Express, MongoDB, Redis/BullMQ, GraphQL Yoga, and Socket.IO.

This service handles authentication, task orchestration, multi-agent execution, tool execution, settings persistence, and real-time event streaming.

## Core Features

1. JWT authentication with refresh flow.
2. Task lifecycle API: create, list, detail, logs.
3. Multi-agent pipeline per task:
   PlannerAgent -> ResearchAgent -> AnalysisAgent -> WriterAgent.
4. Tool execution system with persisted tool records and status updates.
5. Real-time task updates over Socket.IO events.
6. GraphQL API for task query/mutation flows.
7. User-level system settings API persisted in MongoDB.
8. Redis cache helpers for task list/detail response acceleration.
9. Safe fallback behavior when Redis/queues are unavailable.

## Tech Stack

1. Node.js 20+
2. TypeScript 5
3. Express 4
4. Mongoose 8 + MongoDB 7
5. BullMQ + Redis (optional but recommended)
6. GraphQL Yoga 5
7. Socket.IO 4
8. Zod request validation
9. Pino logging

## Architecture

The backend uses a layered structure:

1. controllers: request/response translation and status codes.
2. services: business logic and orchestration.
3. repositories: database access.
4. models: Mongoose schemas/indexes.
5. routes: REST route composition and middleware binding.
6. queues/workers: asynchronous execution pipeline.
7. graphql: schema/resolvers/context.
8. sockets/events: real-time transport and event constants.
9. middlewares: auth, validation, sanitize, rate-limit, error handling.

## Task Execution Flow

1. Client creates task via REST or GraphQL mutation.
2. Task is stored with pending status and task_created log.
3. If Redis queue is available:
   task.queue -> agent.queue -> tool.queue for research step.
4. If Redis queue is not available:
   service executes agents inline via setImmediate fallback.
5. AgentService emits socket events and records agent documents.
6. Research agent triggers WebSearchTool execution.
7. Final response is generated and task status becomes completed.
8. On any error path, task is marked failed and task_failed event/log is produced.

## REST API

Base URL: /api

### Health

1. GET /health

### Auth

1. POST /api/auth/register
2. POST /api/auth/login
3. POST /api/auth/refresh

### Tasks

1. POST /api/tasks
2. GET /api/tasks
3. GET /api/tasks/:id

### Agents

1. GET /api/agents/tasks/:taskId

### Tools

1. GET /api/tools/tasks/:taskId

### Settings

1. GET /api/settings
2. PUT /api/settings

Payload for PUT /api/settings:

1. aiModel: wind-v2.5 | wind-v2.0 | deepthink-1.0
2. temperature: number from 0 to 1
3. requireToolApproval: boolean
4. autonomousMode: boolean

## GraphQL API

Endpoint: /graphql

Supported operations:

1. Query meTasks
2. Query task(id)
3. Mutation createTask(input)

GraphQL auth uses Bearer access token parsed in graphql/context.ts.

## Socket.IO

Server accepts room subscription with join_task event.
Task updates are emitted to room named by taskId.

Events:

1. task_started
2. agent_step
3. tool_executed
4. task_completed
5. task_failed

## Security and Validation

1. Helmet for baseline HTTP hardening.
2. CORS allowlist from ALLOWED_ORIGINS.
3. Zod schema validation for request payloads.
4. Auth middleware for protected routes.
5. Body sanitization middleware.
6. Rate limiting on login route.

## Environment Variables

Required/important variables (see config/env.ts):

1. NODE_ENV
2. PORT
3. MONGODB_URI
4. REDIS_ENABLED
5. REDIS_URL
6. JWT_ACCESS_SECRET
7. JWT_REFRESH_SECRET
8. JWT_ACCESS_TTL
9. JWT_REFRESH_TTL
10. LLM_PROVIDER (openrouter | openai | local)
11. OPENROUTER_API_KEY (optional)
12. OPENROUTER_BASE_URL
13. OPENROUTER_MODEL
14. OPENAI_API_KEY (optional)
15. OPENAI_BASE_URL
16. ALLOWED_ORIGINS (comma-separated)
17. BCRYPT_SALT_ROUNDS
18. LOG_LEVEL

## Scripts

1. npm run dev: run server with tsx watch.
2. npm run build: compile TypeScript.
3. npm run start: run compiled build.
4. npm run check: strict type-check only.
5. npm run seed: run seed worker.

## Local Development Setup

1. Copy .env.example to .env.
2. Install dependencies with npm install.
3. Ensure MongoDB is running.
4. Optionally start Redis and set REDIS_ENABLED=true.
5. Start development server with npm run dev.

## Notes

1. MongoDB indexes are created from model definitions on startup.
2. LLM service supports provider fallback behavior:
   openrouter -> openai -> local simulation.
3. Queue workers run only when Redis connectivity is available.
