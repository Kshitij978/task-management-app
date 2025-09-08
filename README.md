# Task Management App

A full-stack task management application with **Node.js + Express + PostgreSQL** backend and **React + Vite + TypeScript** frontend.

---

## 📑 Table of Contents

- [Task Management App](#task-management-app)
  - [📑 Table of Contents](#-table-of-contents)
  - [📦 Project Structure](#-project-structure)
  - [✅ Prerequisites](#-prerequisites)
  - [🛠️ Setup Instructions](#️-setup-instructions)
    - [1. Clone the repository](#1-clone-the-repository)
    - [2. Installing Dependencies](#2-installing-dependencies)
    - [3. Configure environment variables](#3-configure-environment-variables)
    - [4. Start PostgreSQL database with Docker from root folder](#4-start-postgresql-database-with-docker-from-root-folder)
    - [5. Start backend from root folder](#5-start-backend-from-root-folder)
    - [6. Start frontend](#6-start-frontend)
  - [🧪 Testing (backend)](#-testing-backend)
    - [Run unit tests](#run-unit-tests)
    - [For coverage](#for-coverage)
  - [📖 API Documentation](#-api-documentation)
  - [🙌 Credits (AI)](#-credits-ai)

---

## 📦 Project Structure

```
.
├── backend/ # Express + PostgreSQL backend
├── frontend/ # React + Vite + TypeScript frontend
├── docker-compose.yml # Database setup
├── package.json # Root scripts
└── README.md
```

---

## ✅ Prerequisites

- **Node.js** v18+
- **npm** v9+
- **Docker** & **Docker Compose**
- **PostgreSQL client** (optional, for manual queries)

---

## 🛠️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/task-management-app.git
cd task-management-app
```

### 2. Installing Dependencies

Install frontend, and backend dependencies:

```bash
cd backend && npm install
cd frontend && npm install
```

### 3. Configure environment variables

Create .env files in both backend and frontend:

`backend/.env`

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_management
DB_USER=postgres
DB_PASSWORD=password
PORT=3001
DATABASE_URL=postgres://postgres:password@localhost:5432/task_management
```

`frontend/.env`

```
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Start PostgreSQL database with Docker from root folder

From root

```bash
npm run start:db
```

This runs docker-compose.yml and starts PostgreSQL with a task_management database.

### 5. Start backend from root folder

```bash
npm run start:backend
```

or

```bash
cd backend && npm run dev
```

Backend runs at: http://localhost:3001

### 6. Start frontend

```bash
npm run start:frontend
```

or

```bash
cd frontend && npm run dev
```

Frontend runs at: http://localhost:5173

## 🧪 Testing (backend)

Tests are written with Jest + Supertest.

### Run unit tests

```
cd backend
npm run test
```

### For coverage

```
cd backend
npm run test:coverage
```

## 📖 API Documentation

The backend API is documented with Swagger.

After starting the backend, visit:

`http://localhost:3001/api/docs`

You’ll see the Swagger UI with all routes (/users, /tasks) and schemas.

## 🙌 Credits (AI)

Some parts of this project like:

- initial boilerplate code (Claude 4 Sonnet),
- some simple ui generation (Claude 4 Sonnet)
- debugging (Chat GPT & Gemini)
- unit test (Claude 4 Sonnet)
- documentation drafts (ChatGPT)

were assisted using AI tools (Cursor - Claude 4 Sonnet & Chat GPT).

- Initially I feeded project requirement documentation to chatgpt which gave me kickstart and helped a lot in setups & boilerplate.

- All AI-generated code was reviewed, refactored, and tested manually before inclusion in the project.
