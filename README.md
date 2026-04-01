# 🚀 Finance Dashboard (Full Stack)

A **full-stack Finance Dashboard application** built using **Django (Backend)** and **React (Frontend)** with JWT authentication and role-based access control.

---

## 📌 Features

* 🔐 JWT Authentication (Login / Refresh)
* 👤 Custom User Model with Roles:

  * Viewer (read-only)
  * Analyst (analytics access)
  * Admin (full CRUD access)
* 💰 Transaction Management (Income / Expense)
* 📊 Dashboard Analytics
* 🔄 RESTful APIs (Django REST Framework)
* ⚛️ React Frontend Integration
* 🌐 Clean API Versioning (`/api/v1/`)

---

## 🧱 Project Structure

```
finance-project/
│
├── backend/
│   ├── apps/
│   │   ├── users/
│   │   ├── records/
│   │   └── dashboard/
│   ├── core/
│   ├── db.sqlite3
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── pages/
│   │   ├── components/
│   │   └── routes/
│   └── package.json
```

---

## ⚙️ Backend Setup (Django)

### 1. Navigate to backend

```
cd backend
```

### 2. Create virtual environment

```
python -m venv venv
venv\Scripts\activate
```

### 3. Install dependencies

```
pip install -r requirements.txt
```

### 4. Run migrations

```
python manage.py makemigrations
python manage.py migrate
```

### 5. Run server

```
python manage.py runserver
```

Backend runs at:

```
http://127.0.0.1:8000/
```

---

## ⚛️ Frontend Setup (React)

### 1. Navigate to frontend

```
cd frontend
```

### 2. Install dependencies

```
npm install
```

### 3. Start app

```
npm start
```

Frontend runs at:

```
http://localhost:3000/
```

---

## 🔐 Authentication API

### Login

```
POST /api/v1/auth/login/
```

Body:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Response:

```json
{
  "access": "JWT_ACCESS_TOKEN",
  "refresh": "JWT_REFRESH_TOKEN"
}
```

---

## 📊 API Endpoints

| Module    | Endpoint              |
| --------- | --------------------- |
| Auth      | `/api/v1/auth/login/` |
| Users     | `/api/v1/users/`      |
| Records   | `/api/v1/records/`    |
| Dashboard | `/api/v1/dashboard/`  |

---

## 🔑 Authorization

Add token in headers:

```
Authorization: Bearer <access_token>
```

---

## 🧪 Tech Stack

### Backend:

* Django
* Django REST Framework
* Simple JWT
* SQLite (default DB)

### Frontend:

* React.js
* Axios
* React Router

---

## 🚀 Future Improvements

* 📊 Charts & Graphs (Recharts / Chart.js)
* 🔐 Role-based UI rendering
* 🌐 Deployment (Render / Vercel / AWS)
* 🐳 Docker support
* 📱 Responsive UI

---

## 👨‍💻 Author

**Nishant Verma**
B.Tech CSE | AI/ML Enthusiast

---

## ⭐ Acknowledgement

This project is built for:

* Learning full-stack development
* Internship/placement preparation
* Real-world backend architecture practice

---

## 📌 Status

✅ Backend Complete
✅ Frontend Connected
🚀 Ready for Enhancement & Deployment

---
