# Wind Monorepo

<img src="https://mir-s3-cdn-cf.behance.net/project_modules/fs_webp/967eb1245827815.69b63e63b4541.png" width="900"/>

Wind is a full-stack autonomous agent system with a React frontend and a Node.js backend.

The project is organized into:

1. frontend: user interface and client-side state.
2. backend: auth, task orchestration, agent/tool execution, APIs, queues, and sockets.

---

# 🎥 Demo Video

Watch the system in action:

[![Watch the Demo](https://mir-s3-cdn-cf.behance.net/project_modules/fs_webp/967eb1245827815.69b63e63b4541.png)](https://www-ccv.adobe.io/v1/player/ccv/2-AKDA24BCI/embed?api_key=behance1&bgcolor=%23191919)

Click the image above to watch the demo video.

## 📸 UI Preview

### Dashboard Interface
<img src="https://mir-s3-cdn-cf.behance.net/project_modules/fs_webp/967eb1245827815.69b63e63b4541.png" width="900"/>

### Agent Activity Timeline
<img src="https://mir-s3-cdn-cf.behance.net/project_modules/fs_webp/f59c3b245827815.69b63e63b4efe.png" width="900"/>

### Task Execution View
<img src="https://mir-s3-cdn-cf.behance.net/project_modules/fs_webp/fa4af2245827815.69b63e63b4a73.png" width="900"/>


---


## High-Level Feature Set

1. User authentication and session management with access/refresh JWTs.
2. Prompt-driven task creation and lifecycle tracking.
3. Multi-agent execution pipeline:
   PlannerAgent, ResearchAgent, AnalysisAgent, WriterAgent.
4. Tool execution subsystem with persisted results and statuses.
5. Activity visualization in UI with plan/steps/tools timeline.
6. Real-time backend event emission over Socket.IO.
7. GraphQL + REST support in backend.
8. User-specific system settings persisted server-side.
9. Responsive, animated UI experience including route guard loading scenes.

## Repository Layout

1. backend/
2. frontend/

## End-to-End Architecture

1. Frontend sends auth and task requests to backend REST APIs.
2. Backend persists data in MongoDB and optionally queues jobs in Redis/BullMQ.
3. Worker chain executes task -> agent -> tool stages.
4. Backend emits socket events per task room.
5. Frontend polls task, agent, and tool APIs to render current state.
6. Final response is added to chat stream when task completes.

## Backend Highlights

1. Express app with layered architecture.
2. GraphQL endpoint at /graphql with auth-aware context.
3. Socket.IO events for task lifecycle updates.
4. Settings API for aiModel/temperature/tool permissions/autonomous mode.
5. Redis cache helpers for faster task list/detail responses.
6. LLM provider fallback chain for resilience.

See backend-specific guide in backend/README.md.

## Frontend Highlights

1. React Router with public/protected route guards.
2. Zustand stores for auth/chat/agent/ui state.
3. Typed API utility with auto refresh-and-retry logic.
4. Settings modal integrated with backend settings API.
5. Adaptive sidebar and activity panel responsive behavior.
6. Motion-based loading and interface animations.

See frontend-specific guide in frontend/README.md.

## Quick Start (Full Project)

1. Install backend dependencies.

```bash
cd backend
npm install
```

2. Configure backend environment (.env from .env.example) and ensure MongoDB is available.

3. Optional but recommended: start Redis and enable REDIS_ENABLED=true.

4. Start backend.

```bash
npm run dev
```

5. In a second terminal, install frontend dependencies.

```bash
cd ../frontend
npm install
```

6. Set frontend env as needed (VITE_API_BASE_URL should point to backend).

7. Start frontend.

```bash
npm run dev
```

8. Open the app at http://localhost:3000.

## Primary API Surface (Backend)

REST:

1. POST /api/auth/register
2. POST /api/auth/login
3. POST /api/auth/refresh
4. POST /api/tasks
5. GET /api/tasks
6. GET /api/tasks/:id
7. GET /api/agents/tasks/:taskId
8. GET /api/tools/tasks/:taskId
9. GET /api/settings
10. PUT /api/settings

GraphQL:

1. POST /graphql

Health:

1. GET /health

## Realtime Events

1. task_started
2. agent_step
3. tool_executed
4. task_completed
5. task_failed

## Scripts

Backend scripts:

1. npm run dev
2. npm run build
3. npm run start
4. npm run check

Frontend scripts:

1. npm run dev
2. npm run build
3. npm run preview
4. npm run lint

## Additional Notes

1. MongoDB indexes are declared in Mongoose models and synchronized at startup.
2. If Redis is unavailable, task execution still works via inline fallback path.
3. Frontend and backend are loosely coupled through typed API contracts in frontend/src/utils/api.ts.
