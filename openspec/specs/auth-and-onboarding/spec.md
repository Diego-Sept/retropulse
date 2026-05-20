# Auth & Onboarding Specification

## Purpose

Handle user registration, authentication, session management, and first-user tenant creation. Uses custom auth (bcrypt + JWT + httpOnly cookies) without Supabase Auth.

## Data Models

**usuarios**: id (UUID PK), email (UNIQUE), password_hash, nombre, rol_global (super_admin|empresa_admin|member), empresa_id (FK→empresas), created_at

**empresas**: id (UUID PK), nombre, plan_id (FK→planes_subscription), created_at

## Requirements

| # | Requirement | Strength |
|---|------------|----------|
| 1 | User MUST register with email + password + nombre | MUST |
| 2 | Password MUST be hashed with bcrypt (cost >= 10) before storage | MUST |
| 3 | On first user registration (zero users in DB), the system MUST create a new empresa and assign that user as empresa_admin | MUST |
| 4 | Subsequent registrations MUST NOT create empresas | MUST |
| 5 | Login MUST validate email/password against bcrypt hash | MUST |
| 6 | On successful login, the system MUST issue a JWT in an httpOnly, Secure, SameSite=Strict cookie | MUST |
| 7 | JWT MUST contain: user_id, empresa_id, rol_global, exp (1h) | MUST |
| 8 | Middleware MUST verify the JWT cookie on all /dashboard/* routes | MUST |
| 9 | Invalid/expired JWT MUST redirect to /login | MUST |
| 10 | /login and /register SHOULD redirect to /dashboard if valid JWT exists | SHOULD |
| 11 | Logout MUST clear the JWT cookie | MUST |

## API Contracts

### POST /api/auth/register

```typescript
// Request
{ email: string; password: string; nombre: string }

// Response 201
{ user: { id, email, nombre, rol_global, empresa_id }, token: string }

// Response 409 (duplicate email)
{ error: "El email ya está registrado" }
```

### POST /api/auth/login

```typescript
// Request
{ email: string; password: string }

// Response 200
{ user: { id, email, nombre, rol_global, empresa_id }, token: string }

// Response 401
{ error: "Credenciales inválidas" }
```

### POST /api/auth/logout

```typescript
// Response 200
{ message: "Sesión cerrada" }
```

## Scenarios

### Scenario: First user registers and creates empresa

- GIVEN the usuarios table is empty
- WHEN a user registers with email, password, and nombre
- THEN a new empresa is created with plan_id = Free
- AND the user is assigned rol_global = empresa_admin
- AND a JWT cookie is set

### Scenario: Subsequent user registers in existing empresa

- GIVEN the usuarios table has at least one user and one empresa exists
- WHEN a new user registers
- THEN no new empresa is created
- AND the user is assigned rol_global = member
- AND the user's empresa_id is set to the existing empresa

### Scenario: Login with invalid credentials

- GIVEN a registered user
- WHEN the user posts /api/auth/login with wrong password
- THEN the API returns 401
- AND no cookie is set

### Scenario: Expired JWT redirects to /login

- GIVEN an expired JWT cookie on /dashboard/*
- WHEN middleware verifies the cookie
- THEN the user is redirected to /login

### Scenario: Duplicate email registration

- GIVEN an existing user with email "a@b.com"
- WHEN a new registration uses "a@b.com"
- THEN the API returns 409 with error message

## Acceptance Criteria

- [ ] Registration creates empresa only on first user
- [ ] Login sets httpOnly JWT cookie
- [ ] Middleware protects all /dashboard/* routes
- [ ] JWT expires after 1 hour
- [ ] Logout clears the cookie
- [ ] Duplicate emails rejected with 409
