# Development Setup

Complete guide for setting up the development environment.

## Prerequisites

- **Node.js**: 18.x or higher
- **MongoDB**: 6.0+ (local or Atlas)
- **Git**: Latest version
- **Code Editor**: VS Code recommended

## Step-by-Step Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd localpro-super-app
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Environment Configuration

```bash
cp env.example .env
```

Edit `.env` with your settings:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/localpro-super-app
JWT_SECRET=development-secret-key
```

### 4. Database Setup

**Local MongoDB**:
```bash
mongod
```

**MongoDB Atlas**:
- Create free cluster
- Get connection string
- Update `MONGODB_URI`

### 5. Seed Database (Optional)

```bash
npm run seed:categories
npm run seed:job-categories
```

### 6. Start Development Server

```bash
npm run dev
```

Server runs with nodemon (auto-restart on changes).

## Development Tools

### VS Code Extensions

Recommended extensions:
- ESLint
- Prettier
- MongoDB for VS Code
- REST Client

### Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "program": "${workspaceFolder}/src/server.js",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

## Available Scripts

- `npm start` - Production server
- `npm run dev` - Development server (nodemon)
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues
- `npm run coverage` - Test coverage

## Project Structure

```
localpro-super-app/
├── src/
│   ├── config/          # Configuration
│   ├── controllers/     # Business logic
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # External services
│   └── utils/           # Utilities
├── docs/                # Documentation
├── scripts/             # Utility scripts
└── tests/               # Test files
```

## Testing

### Run Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage

```bash
npm run coverage
```

## Code Quality

### Linting

```bash
npm run lint
npm run lint:fix
```

### Formatting

Use Prettier (if configured) or follow ESLint rules.

## Database Management

### Reset Database

```bash
npm run setup:reset
```

### Backup

```bash
mongodump --uri="$MONGODB_URI" --out=./backups
```

## Common Tasks

### Add New Feature

1. Create route in `src/routes/`
2. Create controller in `src/controllers/`
3. Create model in `src/models/` (if needed)
4. Add route to `src/server.js`
5. Write tests

### Debug Issues

1. Check logs in `logs/` directory
2. Use debugger in VS Code
3. Check MongoDB connection
4. Verify environment variables

## Next Steps

- Read [Coding Standards](../development/coding-standards.md)
- Review [Testing Guide](../development/testing.md)
- Check [Contributing Guidelines](../development/contributing.md)

