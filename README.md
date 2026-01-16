# PreSocial

Native social layer for the PreSuite ecosystem - powered by [Lemmy](https://join-lemmy.org/).

![PreSuite](https://img.shields.io/badge/PreSuite-Service-0190FF)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

PreSocial provides community-driven discussions by integrating with Lemmy, an open-source federated Reddit alternative. It operates as a standalone service within the PreSuite productivity suite.

**Live URL:** https://presocial.presuite.eu (planned)

## Features

- Browse trending discussions from Lemmy communities
- Search posts across the fediverse
- Discover communities by topic
- Dark Glass UI matching PreSuite design system
- Mobile-responsive design

## Project Structure

```
presocial/
├── apps/
│   ├── api/              # Hono backend API
│   │   └── src/
│   │       ├── api/      # Routes and middleware
│   │       ├── services/ # Lemmy client, cache
│   │       └── types/    # TypeScript definitions
│   └── web/              # React frontend
│       └── src/
│           ├── components/
│           ├── pages/
│           └── services/
├── package.json
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 20+
- Bun runtime
- Redis (optional, for caching)

### Development

```bash
# Install dependencies
npm install
cd apps/web && npm install
cd ../api && bun install

# Copy environment file
cp .env.example .env

# Start development servers
npm run dev
```

This starts:
- API server at `http://localhost:3002`
- Web app at `http://localhost:5174`

### Production Build

```bash
npm run build
npm run start
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/social/search` | GET | Search community posts |
| `/api/social/post/:id` | GET | Get post with comments |
| `/api/social/communities` | GET | List communities |
| `/api/social/trending` | GET | Trending discussions |
| `/api/social/health` | GET | Health check |

## Tech Stack

### Frontend
- React 18
- React Router
- Tailwind CSS
- Lucide Icons
- Vite

### Backend
- Bun runtime
- Hono framework
- lemmy-js-client
- Redis (optional cache)

## Environment Variables

```bash
# Server
PORT=3002
NODE_ENV=development

# Lemmy Instance
LEMMY_INSTANCE_URL=https://lemmy.world

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
```

## Related Services

- [PreSuite Hub](https://presuite.eu) - Identity provider
- [PreDrive](https://predrive.eu) - Cloud storage
- [PreMail](https://premail.site) - Email service
- [PreOffice](https://preoffice.site) - Document editing

## Documentation

See [ARC/PRESOCIAL.md](../ARC/PRESOCIAL.md) for full architecture documentation.

## License

MIT - Part of the PreSuite ecosystem.
