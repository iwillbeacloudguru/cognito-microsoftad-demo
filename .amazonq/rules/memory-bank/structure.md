# Project Structure

## Directory Organization

```
cognito-microsoftad-demo/
├── sample-app/              # React frontend application
│   ├── src/
│   │   ├── App.js          # Main component with auth logic
│   │   ├── MfaSettings.js  # MFA configuration UI
│   │   ├── MfaCrud.js      # MFA CRUD operations
│   │   ├── api.js          # Backend API client
│   │   ├── index.js        # OIDC configuration & entry point
│   │   └── App.css         # Custom styling
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
│
├── backend/                 # Node.js Express API server
│   ├── server.js           # Express server with MFA endpoints
│   ├── Dockerfile          # Backend container image
│   └── package.json        # Backend dependencies
│
├── postgres/                # PostgreSQL database
│   ├── init.sql            # Database schema initialization
│   └── Dockerfile          # Database container image
│
├── Dockerfile              # Frontend production image (Nginx)
├── nginx.conf              # Nginx reverse proxy configuration
├── docker-compose.yml      # Multi-container orchestration
└── docker.sh               # Deployment automation script
```

## Core Components

### Frontend Layer (sample-app/)
- **App.js**: Main React component handling authentication flow, token management, and user interface
- **MfaSettings.js**: Component for displaying and managing MFA methods (TOTP, Passkey)
- **MfaCrud.js**: Component for MFA CRUD operations with backend integration
- **api.js**: Centralized API client for backend communication
- **index.js**: OIDC provider configuration and React app initialization

### Backend Layer (backend/)
- **server.js**: Express REST API with endpoints for:
  - MFA method CRUD operations
  - PostgreSQL database integration
  - CORS configuration for frontend communication
  - Health checks and error handling

### Database Layer (postgres/)
- **init.sql**: Schema definition for MFA methods storage
- Tables for user MFA preferences and configurations
- Initialization scripts for development/demo data

### Infrastructure Layer
- **Dockerfile**: Multi-stage build for optimized React production bundle with Nginx
- **docker-compose.yml**: Orchestrates 3 services (postgres, backend, app) with networking and health checks
- **nginx.conf**: Reverse proxy configuration for serving React SPA

## Architectural Patterns

### Three-Tier Architecture
1. **Presentation Tier**: React SPA with Tailwind CSS
2. **Application Tier**: Node.js Express REST API
3. **Data Tier**: PostgreSQL relational database

### Authentication Flow
```
User → React App → AWS Cognito (OIDC) → Microsoft AD
                ↓
            JWT Tokens
                ↓
        Backend API (validation)
                ↓
        PostgreSQL (MFA storage)
```

### Component Relationships
- **React App** ↔ **OIDC Provider**: Authentication and token management
- **React Components** ↔ **Backend API**: MFA CRUD operations via REST
- **Backend API** ↔ **PostgreSQL**: Persistent MFA configuration storage
- **Nginx** → **React SPA**: Static file serving and routing

### Design Patterns
- **Provider Pattern**: react-oidc-context wraps app for auth state
- **API Client Pattern**: Centralized axios/fetch wrapper in api.js
- **Component Composition**: Separate MFA concerns into dedicated components
- **Container Pattern**: Docker multi-stage builds for optimization
- **Service Orchestration**: Docker Compose with health checks and dependencies

## Key Configuration Files
- **sample-app/package.json**: React dependencies (react-oidc-context, qrcode.react)
- **backend/package.json**: Express dependencies (pg, cors, dotenv)
- **docker-compose.yml**: Service definitions, networking, volumes
- **tailwind.config.js**: Tailwind CSS customization
- **nginx.conf**: SPA routing and proxy configuration
