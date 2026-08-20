# Multi-account Todo

A small, security-focused Todo application with a Next.js frontend and Django REST API. Auth0 issues access tokens; Django verifies them against Auth0's JWKS and derives ownership exclusively from the token subject (`sub`).

## Structure

```
frontend/  Next.js + TypeScript dashboard
backend/   Django + DRF API
```

## Why this is safe

`TodoViewSet.get_queryset()` always filters by `account=request.user`. DRF looks up detail objects from that filtered queryset, so another account receives a `404` for an ID it does not own. The create serializer never exposes the `account` field: the server assigns it from the validated JWT identity.

## Run locally

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # enter your Auth0 values
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local # enter your Auth0 values
npm run dev
```

Open `http://localhost:3000`. In Auth0, create a **Single Page Application** and an **API**. Add `http://localhost:3000` to callback, logout, and web-origin URLs. The API Identifier must match `AUTH0_AUDIENCE` / `NEXT_PUBLIC_AUTH0_AUDIENCE`.

## Environment variables

Backend: `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, optional `AUTH0_ISSUER`, and `CORS_ALLOWED_ORIGINS`.

Frontend: `NEXT_PUBLIC_AUTH0_DOMAIN`, `NEXT_PUBLIC_AUTH0_CLIENT_ID`, `NEXT_PUBLIC_AUTH0_AUDIENCE`, `NEXT_PUBLIC_API_URL`.

## Tests

```bash
cd backend && python manage.py test
```

The API tests verify unauthenticated rejection, assignment of ownership from the authenticated identity, and that an account cannot retrieve, modify, or delete another account's Todo.
