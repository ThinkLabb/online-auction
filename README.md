# ThinkLabWeb Project

## Project Structure
The project structure is based on a **Full-Stack Separated Architecture**, promoting a clear separation of concerns between the **React Frontend** and the **Node.js/Express Backend**.
```markdown
# ThinkLabWeb Project

## Project Structure
The project structure is based on a **Full-Stack Separated Architecture**, promoting a clear separation of concerns between the **React Frontend** and the **Node.js/Express Backend**.

```
├── client/
│   ├── dist/                  # Production build files
│   ├── index.html             # Entry HTML file
│   └── src/                   # Frontend Source Code (React/TSX)
│       ├── assets/            # Static files (background.png, react.svg)
│       ├── components/        # Reusable UI components
│       │   └──......
│       ├── pages/             # Page components linked to routes
│       │   └──.....
│       ├── index.css
│       ├── layout.tsx         # Main application layout
│       ├── main.tsx           # Application entry point
│       ├── router.tsx         # Routing configuration
│       └── UserContext.tsx    # User state management via Context API
│
├── server/
│   ├── config/                # Server configuration files
│   │   └── config.ts
│   ├── controllers/           # High-level business logic handlers
│   │   └── .....
│   ├── routes/                # API route definitions
│   │   └── routes.ts
│   ├── services/              # Low-level business logic and data access
│   │   ├── database.ts 
│   │   └── .....        
│   ├── utils/                 # Utility and helper functions
│   │   └── response.ts        # Standardized response formatting
│   └── server.ts              # Main Express server initialization
│
├── prisma/                    # Prisma ORM files
│   ├── schema.prisma          # Database schema definition
│   └── seed.ts                # Script for seeding initial data
│
├── package.json               # Dependencies and NPM scripts
├── tsconfig.json              # Global TypeScript settings
└── vite.config.ts             # Vite bundler configuration
```

---

## Quickstart (Local Development)

### 1. Clone or Open Local Repository
```bash
# If not cloned yet
git clone <repository-url> && cd ThinkLabWeb

# If already in workspace, ensure you're on the correct branch
git checkout main   # or your desired branch
```

### 2. Install Dependencies
```bash
npm i
```

### 3. Database Setup
```bash
npm run db:setup
```

> This command typically runs `prisma generate`, `prisma migrate dev`, and optionally `prisma db seed`.

---

### 4. Copy Environment Template and Configure
```bash
cp .env.example .env
```

Then edit `.env` with your values:

```env
# Server
PORT=3000

# Sessions / JWT
# Generate a cryptographically secure random string:
# openssl rand -hex 32
JWT_SECRET=your_generated_secret_here

# Database
DATABASE_URL=postgres://user:password@localhost:5432/thinklabdb
DB_HOST=localhost
DB_PORT=5432
DB_NAME=thinklabdb
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

> **Security Tip**: Never commit `.env` to version control.

---

### 5. Run Development Server
```bash
npm run dev
```
> Use `npm run dev:client` or `npm run dev:server` to run individually if needed.

---

## Additional Scripts (package.json)

| Script | Description |
|-------|-------------|
| `npm run dev` | Start both client & server in dev mode |
| `npm run client` | Start only React frontend |
| `npm run server` | Start only Express backend |
| `npm run build` | Build frontend for production |
| `npm run build:server` | Build backend (TS -> JS) for production |
| `npm run db:setup` | Run Prisma migrations + seed |
| `npm run db:reset` | Reset database (use with caution) |

---

## Technologies Used

| Layer | Technology |
|------|------------|
| **Frontend** | React, TypeScript, Vite, TailwindCSS  |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | JWT-based authentication |
| **State** | React Context API |

---

## Environment Variables (Required)

| Variable | Description | Example |
|--------|-------------|---------|
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | Secret for signing JWTs | `a1b2c3...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://...` |
| `DB_HOST`, `DB_PORT`, etc. | Optional fallback config | — |

```
