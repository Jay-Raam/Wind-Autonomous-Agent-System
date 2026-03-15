# Wind Frontend

React + TypeScript frontend for Wind.

This client provides authentication, chat sessions, activity visualization, tool execution traces, settings management, and responsive layouts for desktop/tablet/mobile.

## Core Features

1. Protected routing with token bootstrap and session refresh.
2. Login and register pages with guided flow:
   invalid login redirects to register with prefilled email.
3. Chat interface backed by backend task APIs.
4. Multi-session local chat state with session switching.
5. Real-time-like activity panel driven by polling task/agent/tool endpoints.
6. Task planning timeline and agent step cards.
7. Tool execution cards with status and expandable output.
8. System configuration modal persisted to backend settings API.
9. Responsive sidebar and activity panel behavior.
10. Animated auth loading screens on route guards.

## Tech Stack

1. React 19
2. TypeScript
3. Vite
4. Tailwind CSS v4
5. Zustand state management
6. React Router
7. Motion (motion/react) animations
8. Lucide icons
9. React Markdown rendering for assistant output

## Application Structure

1. src/pages: LoginPage, RegisterPage.
2. src/routes: ProtectedRoute, PublicOnlyRoute.
3. src/layouts: MainLayout with responsive sidebar shell.
4. src/components/chat: message list, input, container orchestration.
5. src/components/agents: activity panel and agent step cards.
6. src/components/tools: tool execution cards.
7. src/components/ui: reusable UI primitives.
8. src/store: authStore, chatStore, agentStore, uiStore.
9. src/utils/api.ts: typed API client with auto token refresh.

## Frontend State Model

### authStore

1. initAuth bootstraps auth state from localStorage tokens.
2. refreshSession is called if tokens exist.
3. logout clears tokens and user email.

### chatStore

1. Maintains session list and active session id.
2. Supports optimistic user message insertion.
3. Tracks streaming state for thinking indicator.

### agentStore

1. Stores task plan, goal, agent steps, and tool executions.
2. Resets activity context when switching/no active task.

### uiStore

1. Stores sidebar and right panel visibility.
2. Includes viewport sync logic for responsive behavior.

## API Integration

Base backend URL uses VITE_API_BASE_URL and defaults to http://localhost:8080.

Main client capabilities:

1. Access token + refresh token storage.
2. Automatic refresh and request retry on 401.
3. Unified ApiError with status and backend code.

Used endpoints:

1. auth/register
2. auth/login
3. auth/refresh
4. tasks list/create/detail
5. agents by task
6. tools by task
7. settings get/update

## Chat/Task UX Flow

1. User sends prompt.
2. Frontend creates task via POST /api/tasks.
3. Frontend starts polling detail + agents + tools.
4. Activity panel updates with plan progression and tool status.
5. On completion/failure, assistant response card is finalized.

## Settings UX Flow

1. Open system configuration modal.
2. Fetch current settings from GET /api/settings.
3. Edit model, temperature, permissions, autonomous mode.
4. Persist with PUT /api/settings.

## Responsive Behavior

1. Sidebar opens as drawer on small screens and as column on desktop.
2. Activity panel behaves as drawer on smaller breakpoints.
3. Modal components use constrained height and internal scroll.
4. Header controls are tuned for compact widths.

## Scripts

1. npm run dev: start Vite dev server on port 3000.
2. npm run build: production build.
3. npm run preview: preview build.
4. npm run lint: TypeScript noEmit check.

## Environment Variables

1. VITE_API_BASE_URL: backend base URL, example http://localhost:8080.

## Local Development Setup

1. Install dependencies with npm install.
2. Create environment variables as needed.
3. Start with npm run dev.
4. Ensure backend is running and CORS allows frontend origin.
