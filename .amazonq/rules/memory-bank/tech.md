# Technology Stack

## Programming Languages
- **JavaScript (ES6+)**: Frontend and backend implementation
- **SQL**: PostgreSQL database queries
- **Shell**: Deployment automation scripts

## Frontend Technologies

### Core Framework
- **React 19.2.1**: UI library with hooks and functional components
- **React DOM 19.2.1**: React rendering for web
- **React Router DOM 7.10.1**: Client-side routing

### Authentication
- **react-oidc-context 3.3.0**: React wrapper for OIDC authentication
- **oidc-client-ts 3.4.1**: OpenID Connect client library

### MFA & Security
- **qrcode.react 4.1.0**: QR code generation for TOTP setup
- **WebAuthn API**: Browser-native passkey/biometric authentication

### Styling
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **PostCSS 8.4.49**: CSS processing
- **Autoprefixer 10.4.20**: CSS vendor prefixing

### Build Tools
- **React Scripts 5.0.1**: Create React App build tooling
- **Webpack** (via React Scripts): Module bundling

### Testing
- **@testing-library/react 16.3.0**: React component testing
- **@testing-library/jest-dom 6.9.1**: Jest DOM matchers
- **@testing-library/user-event 13.5.0**: User interaction simulation

## Backend Technologies

### Runtime & Framework
- **Node.js**: JavaScript runtime
- **Express 4.18.2**: Web application framework

### Database
- **pg 8.11.3**: PostgreSQL client for Node.js
- **PostgreSQL**: Relational database (via Docker)

### Middleware & Utilities
- **cors 2.8.5**: Cross-Origin Resource Sharing
- **body-parser 1.20.2**: Request body parsing
- **dotenv 16.3.1**: Environment variable management

### Development
- **nodemon 3.0.2**: Auto-restart on file changes

## Infrastructure & DevOps

### Containerization
- **Docker**: Container runtime
- **Docker Compose**: Multi-container orchestration

### Web Server
- **Nginx**: Production web server and reverse proxy

### Database
- **PostgreSQL**: Relational database with Docker deployment

## AWS Services
- **AWS Cognito**: User authentication and authorization
- **Cognito User Pool**: User directory with Microsoft AD federation
- **Cognito Hosted UI**: Pre-built authentication interface

## Development Commands

### Frontend (sample-app/)
```bash
npm install          # Install dependencies
npm start            # Development server (port 3000)
npm run build        # Production build
npm test             # Run tests
```

### Backend (backend/)
```bash
npm install          # Install dependencies
npm start            # Production server
npm run dev          # Development with nodemon
```

### Docker Deployment
```bash
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs -f [service]  # View logs
./docker.sh                       # Automated deployment
```

### Database Access
```bash
./psql.sh            # Connect to PostgreSQL
```

## Build System

### Frontend Build
- **Multi-stage Docker build**: 
  1. Node.js build stage (npm install + build)
  2. Nginx production stage (serve static files)
- **Output**: Optimized static bundle in /build

### Backend Build
- **Single-stage Docker build**: Node.js runtime with source files
- **Output**: Express server on port 4000

### Database Build
- **PostgreSQL Docker image**: Custom initialization with init.sql
- **Output**: Database server on port 5432

## Environment Configuration

### Frontend (hardcoded in index.js)
- Cognito authority URL
- Client ID
- Redirect URI
- OAuth scopes

### Backend (.env file)
- DB_HOST
- DB_PORT
- DB_NAME
- DB_USER
- DB_PASSWORD
- PORT

### Docker Compose
- Service networking (mfa-network)
- Volume persistence (postgres_data)
- Health checks
- Service dependencies

## Browser Requirements
- **Modern browsers**: Chrome 67+, Firefox 60+, Safari 13+, Edge 18+
- **WebAuthn support**: Required for passkey functionality
- **HTTPS**: Required for WebAuthn in production
