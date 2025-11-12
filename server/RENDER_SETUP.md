# Render Deployment Setup

## Build Settings for Render

When deploying to Render, configure the following:

### Build Command
```bash
cd server && npm install && npm run build
```

### Start Command
```bash
cd server && npm start
```

### Environment Variables
Set these in your Render dashboard:
- `PORT` - Port number (Render will set this automatically, but you can override)
- `JWT_SECRET` - Secret key for JWT tokens
- `FRONTEND_ORIGINS` - Comma-separated list of allowed frontend origins (e.g., `https://science-quiz-cyan.vercel.app,http://localhost:5173`)

### Root Directory
Set the root directory to: `server`

### Node Version
Use Node.js version 18.x or 20.x

## Alternative: If building from root

If Render is building from the project root, you may need to:

1. Set Root Directory to: `server`
2. Or use these build commands:
   - Build: `cd server && npm install && npm run build`
   - Start: `cd server && npm start`

## Troubleshooting

If you see TypeScript errors about missing types:
- Make sure `@types/node` is installed: `cd server && npm install --save-dev @types/node`
- Verify all type packages are in `devDependencies`:
  - `@types/express`
  - `@types/cors`
  - `@types/cookie-parser`
  - `@types/jsonwebtoken`
  - `@types/bcryptjs`
  - `@types/node`

