# TokTickIT

**TokTickIT** is an IT Service Desk application built with a **React + Vite** frontend and an **Express + Prisma** backend, backed by **PostgreSQL**.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Set Up PostgreSQL](#2-set-up-postgresql)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Install Dependencies](#4-install-dependencies)
  - [5. Run Database Migrations](#5-run-database-migrations)
  - [6. Seed the Database](#6-seed-the-database)
  - [7. Start the Server](#7-start-the-server)
  - [8. Start the Client](#8-start-the-client)
- [Running Tests](#running-tests)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Make sure the following tools are installed on your machine before proceeding:

| Tool           | Minimum Version | Download                                      |
|----------------|-----------------|-----------------------------------------------|
| **Node.js**    | 18+             | [nodejs.org](https://nodejs.org/)             |
| **npm**        | 9+              | Comes with Node.js                            |
| **PostgreSQL** | 14+             | [postgresql.org](https://www.postgresql.org/) |

> **Tip:** You can verify your installations by running:
> ```bash
> node -v
> npm -v
> psql --version
> ```

---

## Repository Structure

```
toktickit/
├── client/           # React + Vite frontend (port 5173)
│   ├── src/
│   ├── tests/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
├── server/           # Express + Prisma backend (port 3000)
│   ├── src/
│   ├── tests/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── .env
│   └── package.json
├── docs/
└── README.md
```

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd toktickit
```

---

### 2. Set Up PostgreSQL

Create a PostgreSQL database and user for the project. Open a PostgreSQL shell (`psql`) and run:

```sql
CREATE USER toktickit WITH PASSWORD 'toktickit';
CREATE DATABASE toktickit OWNER toktickit;
GRANT ALL PRIVILEGES ON DATABASE toktickit TO toktickit;
```

> **Note:** The default credentials above match the connection string in `server/.env`. Feel free to change them, but make sure the `.env` file matches.

---

### 3. Configure Environment Variables

#### Server

The server ships with a pre-configured `.env` file at `server/.env`. Verify it matches your PostgreSQL setup:

```dotenv
DATABASE_URL="postgresql://toktickit:toktickit@localhost:5432/toktickit?schema=public"
PORT=3000
```

> **Important:** Do **not** commit your `.env` file to version control. It is already listed in `.gitignore`.

#### Client

Copy the example file to create your local config:

```bash
cd client
cp .env.example .env
```

The default value points to the local API server:

```dotenv
VITE_API_URL="http://localhost:3000"
```

---

### 4. Install Dependencies

From the **project root**, install dependencies for both the server and the client:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

---

### 5. Run Database Migrations

Navigate to the server directory and apply the Prisma migrations to create the database tables:

```bash
cd server
npx prisma migrate dev
```

This will:
- Apply all pending migrations in `prisma/migrations/`
- Generate the Prisma Client

> If prompted for a migration name, you can enter any descriptive name (e.g., `init`).

---

### 6. Seed the Database

Populate the database with initial data:

```bash
cd server
npm run prisma:seed
```

This runs the seed script at `prisma/seed.ts`, which inserts the default IT request categories.

---

### 7. Start the Server

```bash
cd server
npm run dev
```

The API server will start at **http://localhost:3000**. You should see:

```
TokTickIT API listening on http://localhost:3000
```

You can verify the server is running by visiting the health-check endpoint:

```bash
curl http://localhost:3000/api/health
```

---

### 8. Start the Client

Open a **new terminal** and run:

```bash
cd client
npm run dev
```

The Vite dev server will start at **http://localhost:5173**. Open this URL in your browser to see the TokTickIT frontend.

---

## Running Tests

Both the server and client have their own test suites using **Vitest**.

```bash
# Run server tests
cd server
npm test

# Run client tests
cd client
npm test
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ECONNREFUSED` on port 5432 | Make sure PostgreSQL is running and accepting connections on port 5432. |
| Prisma migration fails | Verify `DATABASE_URL` in `server/.env` matches your PostgreSQL credentials and that the database exists. |
| Client shows network errors | Ensure the server is running on port 3000 and `VITE_API_URL` in `client/.env` is set to `http://localhost:3000`. |
| `npx prisma generate` errors | Run `npm install` in the `server/` directory first to ensure `@prisma/client` is installed. |
| Port already in use | Kill the process using the port or change `PORT` in `server/.env` / `server.port` in `client/vite.config.ts`. |