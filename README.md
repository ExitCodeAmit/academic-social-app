# Commonroom

Commonroom is a full-stack academic community platform for sharing ideas, forming research communities, submitting papers, and reviewing published work. It has a React single-page application and a Node.js/Express REST API backed by PostgreSQL.

## Contents

- [Features](#features)
- [Technology](#technology)
- [Requirements](#requirements)
- [Run locally on Windows](#run-locally-on-windows)
- [Configuration](#configuration)
- [First administrator](#first-administrator)
- [Application guide](#application-guide)
- [Architecture and project layout](#architecture-and-project-layout)
- [Database schema](#database-schema)
- [API reference](#api-reference)
- [Security and operational notes](#security-and-operational-notes)
- [Development commands](#development-commands)
- [Troubleshooting](#troubleshooting)

## Features

- Email/password registration and login; passwords are hashed using bcrypt.
- Seven-day JWT sessions, authenticated API requests, and role-restricted screens and endpoints.
- Global discussion feed with group filtering and posts for groups a member has joined.
- User-created communities and membership management.
- Research-paper submission as PDF, DOI and abstract metadata, and submission status tracking.
- Moderation workflow for reviewing, approving, and rejecting submitted papers.
- Searchable public library of approved papers with ratings and written reviews.
- Editable profiles, public profile details, and a view of the signed-in user's research submissions.
- Administrator controls for promoting or changing member roles.
- PostgreSQL health check at `GET /api/health`.

PDF uploads must be valid PDF files and no larger than 20 MB. Files are stored in `backend/uploads`.

## Technology

| Area | Tools |
|---|---|
| API | Node.js, Express, PostgreSQL (`pg`), bcryptjs, jsonwebtoken |
| API security and uploads | Helmet, CORS, Multer |
| Client | React 18, Vite, React Router, Tailwind CSS |
| Client networking and icons | Axios, Lucide React |

## Requirements

- Node.js and npm (Node.js 18 or later recommended).
- PostgreSQL (PostgreSQL 14 or later recommended).
- A PostgreSQL database and credentials for the application.

## Run locally on Windows

Open two PowerShell terminals, one for the backend and one for the frontend.

### 1. Create a PostgreSQL database

Start PostgreSQL, then create a database called `academic_social`. For example, in pgAdmin, create a database with this name. If the PostgreSQL command-line tools are installed and your account permits it, you can also run:

```powershell
psql -U postgres -c "CREATE DATABASE academic_social;"
```

The application creates its tables and indexes on its first successful API startup; you do not need to run `schema.sql` separately.

### 2. Configure the backend

```powershell
cd D:\academic-social-app\backend
Copy-Item .env.example .env
notepad .env
```

Set `DATABASE_URL` to use your real PostgreSQL password and database name. Generate a private signing secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Paste the generated value as `JWT_SECRET` in `.env`. Keep this secret private. Then install and start the API:

```powershell
npm install
npm run dev
```

Leave this terminal running. A successful startup prints a message that the API is listening on port 5000. Verify the database connection by opening [http://localhost:5000/api/health](http://localhost:5000/api/health). A healthy response looks like:

```json
{
  "status": "ok",
  "database": "connected",
  "database_time": "2026-10-14T12:00:00.000Z"
}
```

### 3. Start the frontend

In a second PowerShell terminal:

```powershell
cd D:\academic-social-app\frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally [http://localhost:5173](http://localhost:5173), and create an account.

### Start for production

Build the client and start the API in production mode:

```powershell
cd D:\academic-social-app\frontend
npm run build
```

```powershell
cd D:\academic-social-app\backend
npm start
```

The production client files are written to `frontend/dist`. Deploy these files with a static web host and deploy the API separately. Configure `CLIENT_ORIGIN`, `VITE_API_BASE_URL`, HTTPS, persistent upload storage, and PostgreSQL credentials for the deployment. The API does not itself serve the built React application.

## Configuration

### Backend: `backend/.env`

Copy `backend/.env.example` to `backend/.env`. `.env` must be a **file**, not a directory.

| Variable | Purpose | Default / example |
|---|---|---|
| `PORT` | HTTP API port | `5000` |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://postgres:password@localhost:5432/academic_social` |
| `JWT_SECRET` | Secret used to sign access tokens; at least 32 characters | Generate a random secret; do not use the example value |
| `CLIENT_ORIGIN` | Browser origin allowed by CORS | `http://localhost:5173` |
| `PGSSL` | Set to `true` if the PostgreSQL provider requires TLS | `true` or unset |

If the PostgreSQL password contains URL-reserved characters, URL-encode those characters in `DATABASE_URL`. For hosted PostgreSQL that requires SSL, set `PGSSL=true`.

### Frontend: `frontend/.env`

Copy `frontend/.env.example` to `frontend/.env` only when the API does not use the default address.

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL for API requests | `http://localhost:5000/api` |

Restart the relevant development server after changing environment variables. Do not put server secrets in frontend environment variables; Vite values are bundled into browser-visible code.

## First administrator

Public registration always creates a `user` account. To establish the first administrator, register in the app, then use pgAdmin or `psql` to run the following query using your registration email:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.edu';
```

Sign out and sign in again to refresh the role shown in the interface. Only admins can change account roles. Admins and moderators can review papers.

## Application guide

### Sign up and sign in

Create an account with a name, valid email address, and password of at least eight characters. Institution is optional. On successful registration or login, the API returns a bearer token and user object. The client stores the token in browser `localStorage` and Axios attaches it to subsequent API requests.

### Feed

The home feed displays recent posts. Signed-in members can create a post with a title and content, publish globally, or select one of their joined groups. Use the group filter to show posts from one group.

### Communities

Browse all communities, create a uniquely named community, or join an existing one. The creator is added as a group administrator. A member must join a group before publishing a post to it.

### Research library

Browse or search approved papers by title, abstract, author, or DOI. Signed-in users can submit a paper with a title, abstract, optional DOI, and a PDF. New papers start in `pending`; they appear in the public library only after approval. Authors can see their own submission status in the library and profile. Members can rate and comment on approved papers; submitting another review updates that review.

### Profile

Update the signed-in account name, institution, and biography. The profile also lists the account's research submissions and their statuses.

### Review workspace

Admins and moderators see papers in `pending` or `under_review` status and can mark them `under_review`, `approved`, or `rejected`. Admins also see the member directory and can assign any supported account role. Moderators cannot change account roles.

## Architecture and project layout

```text
academic-social-app/
├── backend/
│   ├── config/db.js                 PostgreSQL connection pool
│   ├── controllers/authController.js Registration, login, current user
│   ├── middlewares/authMiddleware.js JWT verification and role checks
│   ├── routes/apiRoutes.js          REST API and PDF upload routes
│   ├── uploads/                     Uploaded research PDFs
│   ├── schema.sql                   Tables, constraints, indexes
│   ├── server.js                    Express app and startup
│   ├── .env.example                 Backend configuration template
│   └── package.json
├── frontend/
│   ├── src/App.jsx                  Screens, application shell, routes
│   ├── src/AuthContext.jsx          Client authentication state
│   ├── src/api/axios.js             Shared API client and JWT interceptor
│   ├── src/index.css                Tailwind layers and shared styles
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── .env.example                 Frontend configuration template
│   └── package.json
├── .gitignore
└── README.md
```

At API startup, `server.js` validates `JWT_SECRET`, ensures the upload folder exists, executes the idempotent DDL in `schema.sql`, and starts Express. Routes live under `/api`. The frontend is a client-side React application; Vite serves it in development.

## Database schema

The schema is defined in [`backend/schema.sql`](./backend/schema.sql). All primary keys are generated integers, timestamps default to the current time, and relational cleanup uses foreign-key constraints.

| Table | Purpose and notable fields |
|---|---|
| `users` | Account name, unique email, bcrypt `password_hash`, role, biography, institution, profile image URL, creation time |
| `groups` | Unique community name, description, creator, creation time |
| `group_members` | Group/user membership, membership role (`member` or `admin`), join time; one membership per user per group |
| `posts` | Author, optional group, title, text content, optional media URL, creation time |
| `research_papers` | Author, title, abstract, PDF URL, DOI, workflow status, creation time |
| `paper_reviews` | Paper, reviewer, comment, rating from 1 to 5, creation time; one review per user per paper |

Supported user roles are `user`, `researcher`, `moderator`, `group_admin`, and `admin`. Paper statuses are `pending`, `under_review`, `approved`, and `rejected`. The database enforces these role/status values and the review rating range.

## API reference

All paths below are relative to `http://localhost:5000/api`. JSON request bodies use `Content-Type: application/json`, except paper submissions, which use `multipart/form-data`. Protected routes need:

```http
Authorization: Bearer <token>
```

### Health and authentication

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/health` | Public | Test API and database connectivity |
| `POST` | `/auth/register` | Public | Create a `user` account; body: `name`, `email`, `password`, optional `institution` |
| `POST` | `/auth/login` | Public | Sign in; body: `email`, `password` |
| `GET` | `/auth/me` | Signed in | Return the current user's profile |

Registration requires a valid email and a password of at least eight characters. Registration/login responses contain `{ "token": "...", "user": { ... } }`.

### Users and profiles

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/users/:id` | Public | Return public user profile fields |
| `GET` | `/users/:id/papers` | Public | Return approved research by the specified author |
| `PATCH` | `/users/me` | Signed in | Update own `name`, `bio`, and `institution` |

### Groups and posts

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/groups` | Public | List groups, member counts, and whether the current user has joined |
| `POST` | `/groups` | Signed in | Create a group; body: `name`, optional `description` |
| `POST` | `/groups/:id/join` | Signed in | Join a group |
| `GET` | `/posts` | Public | List latest posts; optional `?groupId=:id`; maximum 100 |
| `POST` | `/posts` | Signed in | Create a post; body: `title`, `content`, optional `group_id`, optional `media_url` |

The author must be a member of a group to post to that group.

### Research papers and reviews

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/papers` | Public | List approved papers; optional `?search=...` |
| `GET` | `/papers/mine` | Signed in | List the current user's submissions, including status |
| `POST` | `/papers` | Signed in | Submit a paper using multipart fields `title`, `abstract`, optional `doi`, and required PDF field `pdf` |
| `GET` | `/papers/:id/reviews` | Public | List reviews for an approved paper |
| `POST` | `/papers/:id/reviews` | Signed in | Add or update own review; JSON body: `comment`, `rating` (integer 1–5) |

### Moderation and roles

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/admin/papers` | Admin or moderator | List pending and in-review papers; optional `?status=pending`, `under_review`, `approved`, or `rejected` |
| `PATCH` | `/admin/papers/:paperId/status` | Admin or moderator | Set status to `under_review`, `approved`, or `rejected`; body: `{ "status": "approved" }` |
| `GET` | `/admin/users` | Admin | List up to 200 user accounts |
| `PATCH` | `/admin/users/:id/role` | Admin | Set a role to `user`, `researcher`, `moderator`, `group_admin`, or `admin`; body: `{ "role": "researcher" }` |

Common error responses have a JSON `message` field. Typical status codes are `400` for invalid input, `401` for missing/invalid authentication, `403` for insufficient permissions, `404` for missing records, `409` for a duplicate, `413` for an oversized PDF, and `500` for an unexpected server/database error.

## Security and operational notes

- Never commit `.env` files or share `DATABASE_URL` credentials or `JWT_SECRET`.
- Registration does not accept a role, so a new account cannot grant itself administrative access.
- Passwords are stored as bcrypt hashes; plaintext passwords are not stored.
- Access tokens are signed with `JWT_SECRET` and expire after seven days. The API checks the current database role for each protected request.
- The API uses Helmet security headers, restricts CORS to `CLIENT_ORIGIN`, parameterizes database queries, and limits JSON bodies to 1 MB.
- PDF uploads are restricted by extension, MIME type, file size, and PDF signature. Uploaded files are served from `/uploads/...`.
- Back up both PostgreSQL data and the `backend/uploads` directory. Local uploads are not stored in PostgreSQL.
- For a public deployment, use HTTPS, a strong private JWT secret, secure PostgreSQL credentials, a suitable persistent file/object store, and an explicitly configured CORS origin.

## Development commands

Run commands from their corresponding package directory.

### Backend

```powershell
npm install
npm run dev
npm start
```

`npm run dev` starts Nodemon. `npm start` starts the API directly.

### Frontend

```powershell
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

`npm run build` produces the production bundle in `frontend/dist`. `npm run preview` serves that bundle locally. `npm run lint` runs Oxlint on `frontend/src`.

## Troubleshooting

### Signup shows “Network Error”

The browser could not reach the API. Make sure both terminals are running: the backend on port 5000 and the Vite client on port 5173. Open [http://localhost:5000/api/health](http://localhost:5000/api/health) and read the backend terminal if it fails.

### `password authentication failed for user "postgres"`

Edit `backend/.env` and set `DATABASE_URL` to the actual PostgreSQL username and password. Confirm the `academic_social` database exists. Do not use the literal example password unless you deliberately configured PostgreSQL that way. URL-encode reserved characters in a password placed in a connection URL.

### `Set JWT_SECRET to a random secret with at least 32 characters`

`backend/.env` is missing, the `JWT_SECRET` setting is absent, or its value is too short. Copy `backend/.env.example` into a `.env` **file** (not a folder) and set a random private value with at least 32 characters.

### `EADDRINUSE` / port already in use

Another process is using the configured port. Stop the other application or change `PORT` in `backend/.env`. Update the frontend API URL if you change the backend port.

### CORS error

Set `CLIENT_ORIGIN` to the exact browser origin (scheme, host, and port), for example `http://localhost:5173`, and restart the backend.

### PDF upload error

Upload a real PDF file with the `.pdf` extension. Files larger than 20 MB are rejected.

### Frontend can't find a package

Run `npm install` from the affected package directory (`backend` or `frontend`), then restart its development server.
