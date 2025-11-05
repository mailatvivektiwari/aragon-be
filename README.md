# Backend - Kanban Board Management System

Backend API server built with Node.js, Express, TypeScript, and Prisma ORM.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- **MySQL** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
- **Git** - [Download](https://git-scm.com/)

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd assignment/backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Express.js
- Prisma ORM
- TypeScript
- JWT authentication
- Winston logger
- And more...

### Step 3: Set Up Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# Copy example file (if exists) or create new one
touch .env
```

Add the following configuration to `.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration - MySQL
DATABASE_URL="mysql://root:@localhost:3306/taskmanagement"

# If MySQL root has a password, use:
# DATABASE_URL="mysql://root:password@localhost:3306/taskmanagement"

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

**Important Notes:**
- For MySQL with no password: `mysql://root:@localhost:3306/taskmanagement` (note the colon after root)
- For MySQL with password: `mysql://root:password@localhost:3306/taskmanagement`
- Replace `your-super-secret-jwt-key-change-this-in-production` with a strong random string
- Ensure the database `taskmanagement` exists (or create it)

### Step 4: Set Up Database

#### Using MySQL

1. **Create MySQL Database:**

```bash
# Login to MySQL (if password required)
mysql -u root -p

# Or if no password
mysql -u root

# Create database
CREATE DATABASE taskmanagement;

# Exit MySQL
EXIT;
```

2. **Generate Prisma Client and Push Schema:**

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (creates tables automatically)
npm run db:push
```

### Step 5: Build TypeScript

```bash
npm run build
```

This compiles TypeScript files to JavaScript in the `dist/` directory.

## ▶️ Running the Application

### Development Mode

```bash
npm run dev
```

This starts the server with:
- Hot reload (automatically restarts on file changes)
- TypeScript compilation
- Debug logging

The server will start on `http://localhost:3001`

### Production Mode

```bash
# Build TypeScript first
npm run build

# Start production server
npm start
```

## 🧪 Testing the Installation

### 1. Check Server Health

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-11-05T12:00:00.000Z",
  "environment": "development"
}
```

### 2. Test Login Endpoint

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kanban.com","password":"admin123"}'
```

Expected response:
```json
{
  "data": {
    "user": {
      "id": "...",
      "email": "admin@kanban.com",
      "name": "Admin User"
    },
    "token": "JWT_TOKEN_HERE"
  },
  "statusCode": 200,
  "message": "Login successful"
}
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers (auth, boards, tasks, columns)
│   ├── middleware/       # Express middleware (auth, validation, error handling)
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic (email service, etc.)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions (logger, etc.)
│   ├── app.ts           # Express app configuration
│   └── server.ts        # Server entry point
├── prisma/
│   ├── schema.prisma    # Database schema definition
│   └── dev.db          # SQLite database file (if using SQLite)
├── dist/               # Compiled JavaScript files
├── logs/               # Application logs
├── .env                # Environment variables (create this)
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload

# Building
npm run build            # Compile TypeScript to JavaScript

# Production
npm start                # Start production server (requires build first)

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema changes to database
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Prisma Studio (database GUI)
npm run db:seed          # Seed database with sample data

# Utilities
npm run logs:create      # Create logs directory
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port number |
| `NODE_ENV` | No | `development` | Environment (development/production) |
| `DATABASE_URL` | Yes | - | Database connection string |
| `JWT_SECRET` | Yes | - | Secret key for JWT tokens |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |

### Database Configuration

**MySQL (Default - No Password):**
```env
DATABASE_URL="mysql://root:@localhost:3306/taskmanagement"
```

**MySQL (With Password):**
```env
DATABASE_URL="mysql://root:password@localhost:3306/taskmanagement"
```

**MySQL (Custom User):**
```env
DATABASE_URL="mysql://username:password@localhost:3306/taskmanagement"
```

## 🐛 Troubleshooting

### Issue: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3001`

**Solution:**
```bash
# Option 1: Kill the process using port 3001
lsof -ti:3001 | xargs kill

# Option 2: Change PORT in .env file
PORT=3002
```

### Issue: Database Connection Error

**Error:** `Can't reach database server`

**Solutions:**

1. **Verify MySQL is Running:**
   ```bash
   # Check MySQL status (macOS)
   brew services list | grep mysql
   
   # Check MySQL status (Linux)
   sudo systemctl status mysql
   
   # Start MySQL if not running
   brew services start mysql  # macOS
   sudo systemctl start mysql  # Linux
   ```

2. **Check DATABASE_URL Format:**
   - Format: `mysql://username:password@host:port/database`
   - Verify username and password are correct
   - Ensure database exists: `CREATE DATABASE taskmanagement;`
   - Verify user permissions

3. **Test Connection:**
   ```bash
   # Test MySQL connection
   mysql -u root -h localhost -D taskmanagement
   ```

### Issue: Prisma Client Not Generated

**Error:** `@prisma/client did not initialize yet`

**Solution:**
```bash
npm run db:generate
```

### Issue: Module Not Found Errors

**Error:** `Cannot find module '...'`

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript Compilation Errors

**Solution:**
```bash
# Clean and rebuild
rm -rf dist
npm run build
```

## 📡 API Endpoints

See the main README.md in the root directory for complete API documentation.

## 🔐 Authentication

The application uses hardcoded credentials:

- **Email**: `admin@kanban.com`
- **Password**: `admin123`

Tokens expire after 7 days.

## 📝 Logging

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

## 📄 License

ISC

## 📞 Support

For issues and questions, please check the main README.md or open an issue on the repository.

