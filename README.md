# Multi-Account Todo Application

A secure Todo application built with a Next.js frontend and Django REST Framework backend.

Users sign up and log in with Auth0. Every Todo belongs to the authenticated account, and the Django API enforces ownership so one user cannot view, edit, or delete another user’s Todos.

## Tech Stack

- Frontend: Next.js, React, TypeScript
- Backend: Django, Django REST Framework
- Authentication: Auth0 with JWT access tokens
- Database: SQLite for local development
- API: REST

## Features

- Auth0 signup, login, logout, and authenticated user state
- Create, view, edit, complete/uncomplete, and delete Todos
- Search Todos by title
- Filter Todos by All, Active, and Completed
- Loading, empty, success, and error states
- Mobile-friendly interface
- Backend JWT validation using Auth0 JWKS
- Account-level Todo isolation and IDOR protection

## Project Structure

```text
.
├── backend/
│   ├── config/             # Django project configuration
│   ├── todos/              # Todo models, API, authentication, tests
│   ├── requirements.txt
│   └── manage.py
├── frontend/
│   ├── app/                # Next.js pages and styles
│   ├── package.json
│   └── .env.local.example
├── .gitignore
└── README.md
```

## Security and Ownership

Security is enforced on the backend.

- Auth0 issues an access token after user authentication.
- Django validates the JWT signature, issuer, audience, and expiration using Auth0’s JWKS endpoint.
- Django identifies the current account from the token `sub` claim.
- The frontend never sends an owner or `user_id` when creating a Todo.
- Every Todo query is filtered using `account=request.user`.
- If a user attempts to access another account’s Todo ID, the API returns `404 Not Found`.

This prevents insecure direct object reference (IDOR) attacks.

## API Endpoints

All endpoints require a valid Auth0 Bearer access token.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/todos/` | List the authenticated user’s Todos |
| POST | `/api/todos/` | Create a Todo |
| GET | `/api/todos/:id/` | Get one owned Todo |
| PATCH | `/api/todos/:id/` | Update one owned Todo |
| DELETE | `/api/todos/:id/` | Delete one owned Todo |

Optional query parameters:

```text
/api/todos/?status=active
/api/todos/?status=completed
/api/todos/?search=project
```

## Prerequisites

Install:

- Python 3.10 or newer
- Node.js 18 or newer
- npm
- An Auth0 account

## Auth0 Setup

### 1. Create an Auth0 application

In Auth0:

1. Go to **Applications → Applications**.
2. Create a **Single Page Application** named `Todo Frontend`.
3. In its settings, add:

```text
Allowed Callback URLs: http://localhost:3000
Allowed Logout URLs: http://localhost:3000
Allowed Web Origins: http://localhost:3000
```

4. Save the changes.
5. Copy the application **Domain** and **Client ID**.

### 2. Create an Auth0 API

1. Go to **Applications → APIs**.
2. Create an API named `Todo API`.
3. Set the identifier to:

```text
https://todo-api
```

4. Select the `RS256` signing algorithm.
5. Under the API’s **Application Access** settings, authorize `Todo Frontend` for user-delegated access.

Do not use or commit the Auth0 Client Secret.

## Local Installation

### Backend

```bash
cd backend

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
```

Edit `backend/.env`:

```env
DJANGO_SECRET_KEY=replace-with-a-long-random-local-secret
DJANGO_DEBUG=True

AUTH0_DOMAIN=your-auth0-domain.us.auth0.com
AUTH0_AUDIENCE=https://todo-api
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

Run database migrations and start the API:

```bash
python manage.py migrate
python manage.py runserver
```

The backend runs at:

```text
http://localhost:8000
```

### Frontend

Open a second terminal:

```bash
cd frontend

npm install

cp .env.local.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_AUTH0_DOMAIN=your-auth0-domain.us.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-auth0-client-id
NEXT_PUBLIC_AUTH0_AUDIENCE=https://todo-api
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Start the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Running Tests

Run backend tests:

```bash
cd backend
source .venv/bin/activate
python manage.py test
```

Tests cover:

- Unauthenticated API requests are rejected.
- New Todos are assigned to the authenticated account.
- A user cannot retrieve, update, or delete a Todo owned by another account.

## Environment Variables

### Backend

| Variable | Description |
| --- | --- |
| `DJANGO_SECRET_KEY` | Django secret key |
| `DJANGO_DEBUG` | Enables debug mode locally |
| `AUTH0_DOMAIN` | Auth0 tenant domain |
| `AUTH0_AUDIENCE` | Auth0 API identifier |
| `AUTH0_ISSUER` | Optional custom issuer; defaults to the Auth0 domain issuer |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origin |

### Frontend

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_AUTH0_DOMAIN` | Auth0 tenant domain |
| `NEXT_PUBLIC_AUTH0_CLIENT_ID` | Auth0 SPA Client ID |
| `NEXT_PUBLIC_AUTH0_AUDIENCE` | Auth0 API identifier |
| `NEXT_PUBLIC_API_URL` | Django API base URL |

## Important Notes

- Never commit `.env` or `.env.local`.
- Never commit Auth0 Client Secrets, Django production secrets, or database credentials.
- `.env.example` and `.env.local.example` contain placeholders only.
- SQLite is used for local development.
- A live deployment is optional for this assignment.

## Author

Deepak Jha