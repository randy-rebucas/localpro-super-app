# Development Setup

## Prerequisites

- **Node.js**: 18.x or higher
- **MongoDB**: 6.0+ (local or Atlas)
- **Git**: Latest version
- **npm** or **pnpm**: Package manager

## Installation

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

### 3. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp env.example .env
```

Configure environment variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/localpro-super-app

# JWT
JWT_SECRET=your-secret-key

# Server
PORT=5000
NODE_ENV=development

# External Services
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Start MongoDB

**Local MongoDB**:
```bash
mongod
```

**MongoDB Atlas**: Use connection string in `MONGODB_URI`

### 5. Run Application

**Development**:
```bash
npm run dev
```

**Production**:
```bash
npm start
```

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
│   ├── utils/           # Utilities
│   └── server.js        # Entry point
├── docs/                # Documentation
├── scripts/             # Utility scripts
└── tests/               # Test files
```

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Follow coding standards
- Write tests
- Update documentation

### 3. Test Changes

```bash
npm test
npm run lint
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat: add new feature"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server (nodemon)
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues
- `npm run coverage` - Generate test coverage

## Database Setup

### Seed Data

```bash
npm run seed:categories
npm run seed:job-categories
```

### Reset Database

```bash
npm run setup:reset
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

## Debugging

### VS Code

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

### Console Logging

```javascript
const logger = require('./config/logger');
logger.info('Debug message', { data });
```

## Next Steps

- Read [Coding Standards](./coding-standards.md)
- Review [Testing Guide](./testing.md)
- Check [Contributing Guidelines](./contributing.md)

