# Finance App

A full-stack finance dashboard system with role-based access control, financial records management, and analytics. Built with **Node.js + Express + MongoDB** on the backend and **React + Vite + Zustand** on the frontend.

---

## Repository Structure

```
finance-app/
├── backend/               # Express REST API
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── seed.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── Transaction.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── rbac.js
│   │   │   └── validate.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── transactionController.js
│   │   │   └── dashboardController.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── users.js
│   │       ├── transactions.js
│   │       └── dashboard.js
│   ├── .env.example
│   └── package.json
│
└── frontend/              # React + Vite SPA
    ├── src/
    │   ├── api/
    │   ├── stores/        # Zustand stores
    │   ├── components/
    │   └── pages/
    └── package.json
```

---

## Tech Stack

### Backend
| Layer | Choice |
|---|---|
| Runtime | Node.js v18+ |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (Bearer token) |
| Validation | express-validator |
| Password hashing | bcryptjs |
| Rate limiting | express-rate-limit |

### Frontend
| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| State management | Zustand |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Routing | React Router v6 |
| HTTP client | Axios |

---

## Roles & Permissions

| Action | Viewer | Analyst | Admin |
|---|---|---|---|
| Login / Register | ✅ | ✅ | ✅ |
| View transactions | ✅ | ✅ | ✅ |
| View dashboard summary | ✅ | ✅ | ✅ |
| View recent activity | ✅ | ✅ | ✅ |
| Create / Update transactions | ❌ | ✅ own only | ✅ all |
| Delete transactions (soft) | ❌ | ❌ | ✅ |
| Category breakdown + Trends | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

---

## Backend — Full Setup Guide

### Prerequisites

- Node.js v18+
- MongoDB running locally **or** a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Install dependencies

```bash
cd finance-app/backend
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/finance_dashboard
JWT_SECRET=replace_this_with_a_long_random_string
JWT_EXPIRES_IN=7d
```

> For production (Render), set these in the Render dashboard under **Environment** — never commit `.env` to Git.

### 3. Seed the first admin user

```bash
npm run seed
```

This creates:
- **Email:** `admin@finance.com`
- **Password:** `Admin@1234`

> Run this only once. Subsequent runs are safely skipped.

### 4. Start the server

```bash
npm run dev     # development — auto-restarts with nodemon
npm start       # production
```

The API will be available at `http://localhost:5000`.

---

## Backend — How It Works

### Request Lifecycle

```
Request
  → express-rate-limit      (blocks abuse before anything else)
  → express.json()          (parse body)
  → Route match
  → protect middleware       (verify JWT → attach req.user)
  → authorize middleware     (check role)
  → express-validator chain  (validate inputs)
  → validate middleware      (return 422 if errors exist)
  → Controller               (business logic)
  → MongoDB via Mongoose
  → JSON Response
```

### Authentication

All protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

Obtain a token by calling `POST /api/auth/login`. Tokens expire after 7 days by default (configurable via `JWT_EXPIRES_IN`).

### Rate Limiting

Rate limiting is applied globally using `express-rate-limit` to protect the API from brute-force and abuse. The current limit is **100 requests per 15 minutes per IP**. When the limit is exceeded the API returns:

```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

Auth routes (`/api/auth/login`, `/api/auth/register`) have a **stricter separate limit of 20 requests per 15 minutes** to specifically defend against credential stuffing attacks.

### Soft Delete

Transactions are never permanently removed from the database. Instead a `isDeleted: true` flag is set. A Mongoose pre-query hook automatically excludes these records from all find queries, so deleted data is invisible to the API without any extra filter logic in controllers. This preserves audit trails.

### Role-Based Access Control (RBAC)

RBAC is implemented as a reusable Express middleware factory:

```js
authorize("admin")               // admin only
authorize("analyst", "admin")    // analyst or admin
```

This is applied at the route level — access control is never buried inside business logic. If a user's role doesn't match, the API immediately returns `403 Forbidden` with a descriptive message.

### Password Security

The `password` field on the User model has `select: false`. This means Mongoose will **never** include it in query results unless explicitly requested with `.select("+password")`. It is only retrieved during login for comparison and is hashed with `bcryptjs` (10 salt rounds) via a pre-save hook.

### Data Aggregation

Dashboard analytics endpoints (`/api/dashboard/trends`, `/api/dashboard/category-breakdown`) use MongoDB's aggregation pipeline — `$match`, `$group`, `$sort` — to compute totals server-side. This is far more efficient than loading all records into memory and summing in JavaScript.

---

## Backend — API Reference

### Base URL (local)
```
http://localhost:5000/api
```

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Self-register (always gets `viewer` role) |
| `POST` | `/auth/login` | Public | Login and receive JWT token |
| `GET` | `/auth/me` | Any authenticated | Get own profile |

**Register / Login body:**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123"
}
```

**Login response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "64f...",
    "name": "Alice",
    "email": "alice@example.com",
    "role": "viewer"
  }
}
```

---

### Users `(Admin only)`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users` | List all users with filters and pagination |
| `GET` | `/users/:id` | Get a single user |
| `POST` | `/users` | Create a user with any role |
| `PATCH` | `/users/:id` | Update name, role, or status |
| `DELETE` | `/users/:id` | Hard delete a user |

**GET `/users` query params:**

| Param | Example | Description |
|---|---|---|
| `role` | `admin` | Filter by role |
| `status` | `active` | Filter by status |
| `page` | `1` | Page number |
| `limit` | `10` | Records per page |

**PATCH `/users/:id` body:**
```json
{
  "role": "analyst",
  "status": "inactive"
}
```

---

### Transactions

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/transactions` | All roles | List with filters and pagination |
| `GET` | `/transactions/:id` | All roles | Single transaction |
| `POST` | `/transactions` | Analyst, Admin | Create a transaction |
| `PUT` | `/transactions/:id` | Analyst (own), Admin (all) | Update a transaction |
| `DELETE` | `/transactions/:id` | Admin only | Soft delete |

**GET `/transactions` query params:**

| Param | Example | Description |
|---|---|---|
| `type` | `income` | Filter by type |
| `category` | `salary` | Partial match, case-insensitive |
| `startDate` | `2024-01-01` | ISO date range start |
| `endDate` | `2024-12-31` | ISO date range end |
| `sortBy` | `date` | Field to sort by |
| `order` | `desc` | `asc` or `desc` |
| `page` | `1` | Page number |
| `limit` | `10` | Records per page |

**Transaction body:**
```json
{
  "amount": 1500.00,
  "type": "income",
  "category": "Salary",
  "date": "2024-06-01",
  "notes": "Monthly salary"
}
```

---

### Dashboard

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/dashboard/summary` | All roles | Total income, expenses, net balance |
| `GET` | `/dashboard/recent` | All roles | Last N transactions (default 5) |
| `GET` | `/dashboard/category-breakdown` | Analyst, Admin | Per-category totals |
| `GET` | `/dashboard/trends` | Analyst, Admin | Monthly income vs expense trends |

**GET `/dashboard/summary` query params:**

| Param | Example | Description |
|---|---|---|
| `startDate` | `2024-01-01` | Optional range filter |
| `endDate` | `2024-12-31` | Optional range filter |

**Sample summary response:**
```json
{
  "success": true,
  "summary": {
    "totalIncome": 45000,
    "totalExpenses": 32000,
    "netBalance": 13000,
    "totalTransactions": 28,
    "incomeCount": 10,
    "expenseCount": 18
  }
}
```

**GET `/dashboard/trends` query params:**

| Param | Example | Description |
|---|---|---|
| `months` | `6` | How many months back (default: 6) |

---

### Error Response Format

All error responses follow this consistent structure:

```json
{
  "success": false,
  "message": "Human-readable error message.",
  "errors": [
    { "field": "email", "message": "Provide a valid email." }
  ]
}
```

The `errors` array is only present on `422 Validation Failed` responses.

| Status Code | Meaning |
|---|---|
| `200` | OK |
| `201` | Created |
| `401` | Unauthenticated (missing or invalid token) |
| `403` | Forbidden (insufficient role) |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate email) |
| `422` | Validation failed |
| `429` | Too many requests (rate limited) |
| `500` | Internal server error |

---

## Deploying the Backend to Render

### Step 1 — Push to GitHub

Make sure your backend code is pushed to a GitHub repository. Render deploys directly from Git.

```bash
cd finance-app
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/finance-app.git
git push -u origin main
```

> Add a `.gitignore` at the root if you haven't already — make sure `node_modules/` and `.env` are ignored.

### Step 2 — Create a MongoDB Atlas cluster (for production)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free cluster
2. Create a database user with a strong password
3. Under **Network Access**, allow connections from anywhere (`0.0.0.0/0`) for Render
4. Copy the **Connection String** — it looks like:
   ```
   mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/finance_dashboard?retryWrites=true&w=majority
   ```

### Step 3 — Create a Web Service on Render

1. Go to [render.com](https://render.com) and sign in
2. Click **New → Web Service**
3. Connect your GitHub account and select the `finance-app` repository
4. Configure the service:

| Setting | Value |
|---|---|
| **Name** | `finance-backend` (or any name you like) |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

### Step 4 — Set Environment Variables on Render

In your Render service go to **Environment** and add these variables:

| Key | Value |
|---|---|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random string (e.g. generate one at [randomkeygen.com](https://randomkeygen.com)) |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |

> Do **not** set `PORT` — Render injects this automatically.

### Step 5 — Deploy

Click **Create Web Service**. Render will:
1. Pull your code from GitHub
2. Run `npm install`
3. Start the server with `npm start`

Your API will be live at a URL like:
```
https://finance-backend-xxxx.onrender.com
```

### Step 6 — Seed the admin user on Render

Once deployed, open the **Shell** tab in your Render service dashboard and run:

```bash
node src/config/seed.js
```

This creates the first admin account on the production database.

### Step 7 — Point the frontend at your Render URL

In `frontend/vite.config.js`, update the proxy target for production builds, or set the `VITE_API_URL` environment variable to your Render URL.

```js
// vite.config.js — for local dev, proxy works fine
// For production build, set your base URL in axios.js:
// baseURL: import.meta.env.VITE_API_URL || "/api"
```

Then in `frontend/src/api/axios.js`:
```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});
```

And add a `.env` in the frontend folder:
```env
VITE_API_URL=https://finance-backend-xxxx.onrender.com/api
```

---

## Frontend — Setup Guide

```bash
cd finance-app/frontend
npm install
npm run dev       # http://localhost:3000
npm run build     # production build → dist/
```

### Pages

| Page | Route | Access |
|---|---|---|
| Login | `/login` | Public |
| Dashboard | `/dashboard` | All roles |
| Transactions | `/transactions` | All roles (write: analyst+admin) |
| Users | `/users` | Admin only |

### Frontend Features

- **JWT stored in localStorage** — auto-attached to every request via Axios interceptor
- **Auto logout** on `401` responses — clears token and redirects to `/login`
- **Role-aware UI** — buttons, charts, and nav items conditionally rendered by role
- **Zustand stores** — separate stores for auth, dashboard, transactions, and users
- **Charts** — line chart for monthly trends, donut chart for category split (analyst + admin only)
- **Pagination + Filters** — date range, type, and category filters on transactions
- **Modals** — create/edit forms and delete confirmations

---

## Key Design Decisions

**1. Soft Delete for Transactions**
Transactions are flagged with `isDeleted: true` instead of being removed. A Mongoose pre-query hook filters them out globally. This preserves historical data and audit trails.

**2. Password never returned**
The `password` field uses `select: false` on the Mongoose schema, so it is never included in query results by default.

**3. RBAC as middleware**
The `authorize(...roles)` helper enforces access control at the route layer, keeping controllers clean and role logic centralized.

**4. Rate limiting at the app level**
`express-rate-limit` is applied globally and with a stricter limit on auth routes, preventing brute-force attacks without needing an external service.

**5. Aggregation pipeline for analytics**
Dashboard endpoints use MongoDB `$group` and `$sum` to compute totals server-side, which is efficient regardless of record volume.

**6. Self-registration always gets viewer**
To prevent privilege escalation, users who register themselves always get the `viewer` role. Only an admin can assign `analyst` or `admin` roles.

---

## Assumptions & Tradeoffs

- JWT is stored in `localStorage`. A refresh token mechanism is out of scope for this project.
- Monetary amounts are stored as plain JavaScript `Number` (float). Currency conversion is not in scope.
- A single MongoDB instance (or Atlas free tier) is sufficient for this project's scale.
- The Render free tier spins down after inactivity — expect a ~30 second cold start on the first request.

---

## Default Credentials (after seed)

```
Email   : admin@finance.com
Password: Admin@1234
```

> Change this password immediately after your first login in any production environment.