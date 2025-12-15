# 📚 Documentation Setup Guide

This guide will help you set up the complete documentation system for LocalPro Super App.

---

## 🎯 Documentation Stack

- **Swagger/OpenAPI**: Interactive API documentation
- **MkDocs**: Knowledge base documentation site
- **JSDoc**: Code-level documentation

---

## 📦 Installation

### 1. Install Dependencies

```bash
# Install Swagger dependencies
npm install --save-dev swagger-jsdoc swagger-ui-express

# Install MkDocs (requires Python)
pip install mkdocs mkdocs-material mkdocs-git-revision-date-localized-plugin mkdocs-minify-plugin
```

### 2. Set Up Swagger

1. **Add Swagger route to server.js**:
```javascript
const { swaggerSpec, swaggerUi, swaggerOptions } = require('./docs/api/swagger-setup');

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
```

2. **Add JSDoc comments to routes**:
```javascript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', getUsers);
```

### 3. Set Up MkDocs

1. **Navigate to docs directory**:
```bash
cd docs/knowledge-base
```

2. **Build documentation**:
```bash
python -m mkdocs build
# Or use npm script: npm run docs:build
```

3. **Serve locally**:
```bash
python -m mkdocs serve
# Or use npm script: npm run docs:serve
```

4. **Access at**: http://127.0.0.1:8000

---

## 🚀 Usage

### Swagger API Docs

```bash
# Start server
npm run dev

# Access Swagger UI
# http://localhost:5000/api-docs
```

### MkDocs Knowledge Base

```bash
# Serve locally
npm run docs:serve

# Build for production
npm run docs:build

# Deploy to GitHub Pages
npm run docs:deploy
```

---

## 📝 Adding Documentation

### Adding API Documentation

Add JSDoc comments to your route files:

```javascript
/**
 * @swagger
 * /api/example:
 *   post:
 *     summary: Example endpoint
 *     tags: [Examples]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/example', exampleController);
```

### Adding Knowledge Base Content

1. Create markdown file in `docs/knowledge-base/docs/`
2. Add to navigation in `mkdocs.yml`
3. Build and deploy

---

## 🌐 Deployment

### GitHub Pages

1. **Configure repository**:
   - Settings → Pages
   - Source: GitHub Actions

2. **Deploy**:
```bash
npm run docs:deploy
```

### Custom Domain

1. Add `CNAME` file to `docs/knowledge-base/site/`
2. Configure DNS
3. Deploy

---

## 📚 Documentation Structure

```
docs/
├── api/                    # Swagger/OpenAPI
│   ├── swagger-setup.js
│   └── openapi.yaml
│
├── knowledge-base/         # MkDocs
│   ├── mkdocs.yml
│   └── docs/
│       ├── index.md
│       ├── getting-started/
│       ├── architecture/
│       └── ...
│
└── guides/                 # Detailed guides
    └── ...
```

---

## ✅ Next Steps

1. ✅ Install dependencies
2. ✅ Set up Swagger
3. ✅ Set up MkDocs
4. ✅ Add JSDoc comments to routes
5. ✅ Migrate existing documentation
6. ✅ Deploy to GitHub Pages

---

**Need help?** Check the troubleshooting guide or contact the team.

