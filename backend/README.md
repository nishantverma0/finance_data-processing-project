# Finance Dashboard Backend

A role-based financial data management API built with **Django REST Framework** and **PostgreSQL** (SQLite fallback for local dev).

---

## Tech Stack

| Layer        | Choice                              |
|--------------|-------------------------------------|
| Language     | Python 3.10+                        |
| Framework    | Django 4.2 + Django REST Framework  |
| Database     | PostgreSQL (SQLite for local dev)   |
| Auth         | JWT via `djangorestframework-simplejwt` |
| Filtering    | `django-filter`                     |
| CORS         | `django-cors-headers`               |

---

## Project Structure

```
finance_dashboard/
├── core/
│   ├── settings.py      # All configuration
│   ├── urls.py          # Root URL routing
│   ├── exceptions.py    # Unified error response format
│   └── wsgi.py
├── apps/
│   ├── users/
│   │   ├── models.py        # Custom User model + Role choices
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── permissions.py   # IsAdmin, IsAnalystOrAbove, IsAdminOrReadOnly
│   │   └── management/commands/seed_data.py
│   ├── records/
│   │   ├── models.py        # FinancialRecord + soft-delete manager
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── filters.py       # Date range, amount range, type, category
│   │   └── urls.py
│   ├── dashboard/
│   │   ├── services.py      # All aggregation logic (service layer)
│   │   ├── views.py
│   │   └── urls.py
│   └── tests.py             # Integration tests (27 test cases)
├── requirements.txt
├── manage.py
└── .env.example
```

---

## Quick Start

### 1. Clone & install

```bash
git clone <repo-url>
cd finance_dashboard
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — leave DATABASE_URL blank to use SQLite
```

### 3. Run migrations & seed data

```bash
python manage.py migrate
python manage.py seed_data
```

Seed creates three demo accounts:

| Role    | Email                  | Password      |
|---------|------------------------|---------------|
| Admin   | admin@finance.dev      | Admin@1234    |
| Analyst | analyst@finance.dev    | Analyst@1234  |
| Viewer  | viewer@finance.dev     | Viewer@1234   |

### 4. Start the server

```bash
python manage.py runserver
```

API is available at `http://127.0.0.1:8000/api/v1/`

### 5. Run tests

```bash
python manage.py test apps.tests --verbosity=2
```

---

## PostgreSQL Setup (optional)

```bash
# macOS
brew install postgresql && brew services start postgresql
createdb finance_db

# Set in .env:
DATABASE_URL=postgresql://postgres:password@localhost:5432/finance_db
```

---

## Role-Based Access Control

| Action                        | Viewer | Analyst | Admin |
|-------------------------------|:------:|:-------:|:-----:|
| Login / refresh token         | ✓      | ✓       | ✓     |
| View own profile (`/me/`)     | ✓      | ✓       | ✓     |
| List / retrieve records       | ✓      | ✓       | ✓     |
| Create / update / delete records | ✗   | ✗       | ✓     |
| Dashboard summary + recent    | ✓      | ✓       | ✓     |
| Category breakdown + trends   | ✗      | ✓       | ✓     |
| Manage users                  | ✗      | ✗       | ✓     |

---

## API Reference

All endpoints require `Authorization: Bearer <access_token>` except `/auth/login/` and `/auth/refresh/`.

All error responses follow a uniform structure:
```json
{ "error": "Human readable message", "status_code": 403 }
```

---

### Authentication

#### `POST /api/v1/auth/login/`
Obtain JWT access + refresh tokens.

**Request:**
```json
{ "email": "admin@finance.dev", "password": "Admin@1234" }
```

**Response `200`:**
```json
{
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>"
}
```

---

#### `POST /api/v1/auth/refresh/`
Exchange a refresh token for a new access token.

**Request:**
```json
{ "refresh": "<jwt_refresh_token>" }
```

---

### Users  `[Admin only]`

#### `GET /api/v1/users/`
List all users. Supports `?role=viewer|analyst|admin` and `?is_active=true|false` filters, and `?search=name_or_email`.

#### `POST /api/v1/users/`
Create a user.
```json
{ "email": "new@example.com", "name": "Jane", "role": "analyst", "password": "Secret@99" }
```

#### `GET /api/v1/users/{id}/`
Retrieve a single user.

#### `PATCH /api/v1/users/{id}/`
Partially update name, role, or active status.

#### `DELETE /api/v1/users/{id}/`
Soft-delete (sets `is_active=False`). Cannot be used on your own account.

#### `GET /api/v1/users/me/`
Return the authenticated user's own profile. Available to **all roles**.

---

### Financial Records

#### `GET /api/v1/records/`   `[All roles]`
List records. **Paginated** (default 20/page).

**Filter params:**

| Param       | Example             | Description                    |
|-------------|---------------------|--------------------------------|
| `type`      | `?type=income`      | `income` or `expense`          |
| `category`  | `?category=Rent`    | Exact category name            |
| `date_from` | `?date_from=2024-01-01` | Start date (inclusive)    |
| `date_to`   | `?date_to=2024-03-31`   | End date (inclusive)      |
| `min_amount`| `?min_amount=100`   | Minimum amount                 |
| `max_amount`| `?max_amount=5000`  | Maximum amount                 |
| `search`    | `?search=salary`    | Full-text search in category + notes |
| `ordering`  | `?ordering=-amount` | Sort field (`date`, `amount`, `created_at`) |
| `page`      | `?page=2`           | Pagination                     |

#### `POST /api/v1/records/`   `[Admin only]`
```json
{
  "amount": "2500.00",
  "type": "income",
  "category": "Salary",
  "date": "2024-03-31",
  "notes": "March salary"
}
```

#### `GET /api/v1/records/{id}/`   `[All roles]`

#### `PATCH /api/v1/records/{id}/`   `[Admin only]`

#### `DELETE /api/v1/records/{id}/`   `[Admin only]`
Soft-deletes the record (sets `is_deleted=True`). The record disappears from all listings but remains in the database.

---

### Dashboard

All dashboard endpoints accept optional date filter params: `?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD`

#### `GET /api/v1/dashboard/summary/`   `[All roles]`
```json
{
  "total_income":   "12500.00",
  "total_expenses": "4800.00",
  "net_balance":    "7700.00"
}
```

#### `GET /api/v1/dashboard/recent/?limit=10`   `[All roles]`
Returns the N most recent records (max 50).

#### `GET /api/v1/dashboard/categories/`   `[Analyst, Admin]`
```json
[
  { "category": "Rent",   "type": "expense", "total": "3600.00", "count": 3 },
  { "category": "Salary", "type": "income",  "total": "9000.00", "count": 3 }
]
```

#### `GET /api/v1/dashboard/trends/monthly/`   `[Analyst, Admin]`
```json
[
  { "month": "2024-01", "total_income": "3000.00", "total_expense": "1200.00", "net": "1800.00" },
  { "month": "2024-02", "total_income": "3000.00", "total_expense": "1600.00", "net": "1400.00" }
]
```

#### `GET /api/v1/dashboard/trends/weekly/`   `[Analyst, Admin]`
```json
[
  { "week_start": "2024-03-25", "total_income": "1500.00", "total_expense": "400.00", "net": "1100.00" }
]
```

---

## Design Decisions & Assumptions

### Authentication
JWT is used with a 2-hour access token and 7-day rotating refresh token. This keeps the system stateless and suitable for a frontend dashboard.

### Role model
Three roles are defined — Viewer, Analyst, Admin. Viewers represent read-only stakeholders (e.g. board members); Analysts are internal team members who need trend data; Admins manage the system. This maps naturally to a typical finance team.

### Soft deletes
Both users and financial records use soft deletion (`is_active=False` / `is_deleted=True`) rather than hard deletion. This preserves audit history, which is critical in financial systems.

### Service layer for dashboard
All aggregation logic lives in `apps/dashboard/services.py` rather than in the views. This makes the business logic unit-testable independently of HTTP concerns and keeps views thin.

### Database
Defaults to SQLite for frictionless local setup. Set `DATABASE_URL` in `.env` to switch to PostgreSQL for staging or production. All ORM queries are database-agnostic.

### Pagination
All list endpoints are paginated at 20 items per page by default. This is configured globally in `REST_FRAMEWORK` settings and requires no per-view changes.

### Input validation
DRF serializers handle field-level validation. The custom exception handler in `core/exceptions.py` normalises all error responses — including field-level validation errors — into a consistent `{ "error": "...", "status_code": N }` envelope.

### What's not included (tradeoffs)
- **Rate limiting**: Not implemented to keep dependencies minimal. Django's cache framework or `django-ratelimit` would be the natural next step.
- **Audit log**: Not implemented, but soft deletes and `created_by` FKs preserve enough traceability for this scope.
- **Search full-text**: Basic `icontains` search via DRF's `SearchFilter`. For production, consider `pg_trgm` or Elasticsearch.
