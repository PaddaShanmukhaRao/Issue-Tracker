# IssueTracker — Full Stack App

A production-grade Kanban issue tracker built with **React + TypeScript + Express + PostgreSQL (Neon)**.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Backend | Express, TypeScript, Node.js |
| Database | PostgreSQL via Neon (serverless) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Validation | Zod (runtime type safety) |
| HTTP Client | Axios with interceptors |
| Notifications | react-hot-toast |

---

## Project Structure

```
issue-tracker/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   └── database.ts        # Pool + schema migration
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts # JWT verification
│   │   │   └── validate.middleware.ts # Zod request validation
│   │   ├── routes/
│   │   │   ├── auth.routes.ts     # POST /register, POST /login
│   │   │   └── issues.routes.ts   # GET/POST/PATCH/DELETE /issues
│   │   ├── validators/
│   │   │   └── schemas.ts         # Zod schemas
│   │   ├── types.ts               # Shared types
│   │   └── server.ts              # Express entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── board/
    │   │   │   ├── KanbanBoard.tsx # DnD context + column layout
    │   │   │   ├── KanbanColumn.tsx # Drop zone + card list
    │   │   │   ├── IssueCard.tsx   # Draggable card
    │   │   │   └── IssueModal.tsx  # Create issue dialog
    │   │   ├── layout/
    │   │   │   ├── Navbar.tsx
    │   │   │   └── ProtectedRoute.tsx
    │   │   └── ui/
    │   │       └── PriorityBadge.tsx
    │   ├── hooks/
    │   │   ├── useAuth.tsx         # Auth context + provider
    │   │   └── useIssues.ts        # CRUD + optimistic updates
    │   ├── lib/
    │   │   ├── api.ts              # Axios instance with interceptors
    │   │   └── utils.ts            # cn(), formatDate(), etc.
    │   ├── pages/
    │   │   ├── RegisterPage.tsx
    │   │   ├── LoginPage.tsx
    │   │   └── DashboardPage.tsx
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx                 # Routes + providers
    │   ├── main.tsx
    │   └── index.css
    ├── vite.config.ts              # Dev proxy to backend
    ├── tailwind.config.js
    └── package.json
```

---

## Setup

### 1. Clone & install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
# In backend/
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=your-random-64-char-string
PORT=3000
NODE_ENV=development
```

**Get a free Neon database:** https://neon.tech → create project → copy connection string.

**Generate a JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Run the backend

```bash
cd backend
npm run dev
# Server starts at http://localhost:3000
# Database tables are created automatically on first run
```

### 4. Run the frontend

```bash
cd frontend
npm run dev
# App starts at http://localhost:5173
# /api requests are proxied to :3000 automatically
```

### 5. Open the app

Go to **http://localhost:5173** → Register → use the Kanban board.

---

## API Reference

### Auth
| Method | Path | Body | Auth |
|--------|------|------|------|
| POST | `/api/auth/register` | `{ email, password }` | No |
| POST | `/api/auth/login` | `{ email, password }` | No |

### Issues
| Method | Path | Body | Auth |
|--------|------|------|------|
| GET | `/api/issues` | — | JWT |
| POST | `/api/issues` | `{ title, description?, priority }` | JWT |
| PATCH | `/api/issues/:id` | `{ status?, title?, priority? }` | JWT |
| DELETE | `/api/issues/:id` | — | JWT |

All issue requests require: `Authorization: Bearer <token>`

---

## Key Architecture Decisions

**Optimistic Updates** — When a card is dragged, the UI updates instantly and the API call happens in the background. If the API fails, we roll back the UI and show a toast.

**JWT in localStorage** — Simple and works without cookie configuration. For higher security apps, consider httpOnly cookies instead.

**Zod on both sides** — Frontend validates before sending (fast UX feedback). Backend validates again (never trust the client).

**Schema auto-migration** — `initializeDatabase()` runs `CREATE TABLE IF NOT EXISTS` on every server start, so you never need to manually run SQL.

---

## Production Deployment

**Backend** (Railway / Render / Fly.io):
- Set `NODE_ENV=production`
- Set `DATABASE_URL` and `JWT_SECRET`
- Set `FRONTEND_URL` to your Vercel domain
- Run `npm run build && npm start`

**Frontend** (Vercel):
- Set `VITE_API_URL` if not using a proxy
- Update `vite.config.ts` proxy or use environment variable for the API base URL
- Run `npm run build`