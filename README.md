# ThinkLabWeb Project

## Project Structure

The project structure is based on a **Full-Stack Separated Architecture**, promoting a clear separation of concerns between the **React Frontend** and the **Node.js/Express Backend**.

```bash
├── client/
│   ├── dist/                            # Production build files
│   ├── index.html                       # Entry HTML file
│   └── src/                             # Frontend Source Code (React/TSX)
│       ├── assets/                      # Static files (background.png, react.svg)
│       ├── components/                  # Reusable UI components
│       │   └──......
│       ├── pages/                       # Page components linked to routes
│       │   └──.....
│       ├── index.css
│       ├── layout.tsx                   # Main application layout
│       ├── main.tsx                     # Application entry point
│       ├── router.tsx                   # Routing configuration
│       └── UserContext.tsx              # User state management via Context API
│
├── server/
│   ├── src
│   │   ├── config/                      # Server configuration files
│   │   │   └── config.ts
│   │   ├── controllers/                 # High-level business logic handlers
│   │   │   └── .....
│   │   ├── routes/                      # API route definitions
│   │   │   └── routes.ts
│   │   ├── services/                    # Low-level business logic and data 
│   │   │   ├── database.ts 
│   │   │   └── .....        
│   │   ├── utils/                       # Utility and helper functions
│   │   │   └── response.ts              # Standardized response formatting
│   │   └── server.ts                    # Main Express server initialization
│   ├── prisma/                          # Prisma ORM files
│   │   ├── schema.prisma                # Database schema definition
│   │   └── seed.ts                      # Script for seeding initial data
│   ├── package.json                     # Dependencies for backend
│   └── tsconfig.json                    # TypeScript settings for backend
├── package.json                         # Dependencies and NPM scripts
├── tsconfig.json                        # Global TypeScript settings
└── vite.config.ts                       # Vite bundler configuration

```

## Link host project

[ThinkLab Online Auction](https://thinklabweb-onlineauction.apn.leapcell.app/)

---

## Quickstart (Local Development)

### 1. Clone or Open Local Repository

```bash
# If not cloned yet
git clone <repository-url> && cd online-auction 

# If already in workspace, ensure you're on the correct branch
git checkout main   # or your desired branch
```

### 2. Install Dependencies

```bash
npm 
```

### 3. Copy Environment Template and Configure

```bash

# Create env for server, then edit with your value
touch server/.env

# Server Configuration
PORT=8000

# Database
DATABASE_URL="postgresql://username:password@host:5432/database_name"

# Authentication
JWT_SECRET="your_jwt_secret_key"

# Mail Service
MAIL="your_email@example.com"
PASSWORD="your_email_password"

# AWS S3 Configuration
AAWS_REGION=ap-st-2
AAWS_ACCESS_KEY_ID=your_aws_access_key_id
AAWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AAWS_BUCKET_NAME=your_bucket_name

# Google & Security
RECAPTCHA_SECRET=your_recaptcha_secret
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Default System Values
DEFAULT_PASSWORD=your_default_password
```

**Security Tip**: Never commit `.env` to version control.

---

### 4. Database Sample Data Setup

```bash
cd server && npm run db:seed
```

---

### 5. Run Development Server

```bash
npm run dev
```

Use `npm run dev:client` or `npm run dev:server` to run individually if needed.


---

## Additional Scripts (package.json)

| Script | Description |
|-------|-------------|
| npm run dev | Start both client & server in dev mode |
| npm run client | Start only React frontend |
| npm run server | Start only Express backend |
| npm run build:client | Build frontend for production |
| npm run build:server | Build backend (TS -> JS) for production |
| npm run build | Build frontend and backend (TS -> JS) for production |
| npm run db:setup | Run Prisma migrations + seed |
| npm run start | Run production |

---

## Technologies Used

| Layer | Technology |
|------|------------|
| *Frontend* | React, TypeScript, Vite, TailwindCSS  |
| *Backend* | Node.js, Express, TypeScript |
| *Database* | PostgreSQL + Prisma ORM |
| *Auth* | JWT-based authentication |
| *State* | React Context API |

---
