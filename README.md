# PreSocial

Native social layer for the PreSuite ecosystem - powered by [Lemmy](https://join-lemmy.org/).

![PreSuite](https://img.shields.io/badge/PreSuite-Service-0190FF)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

PreSocial provides community-driven discussions by integrating with Lemmy, an open-source federated Reddit alternative. It operates as a standalone service within the PreSuite productivity suite.

**Live URL:** https://presocial.presuite.eu
**Server:** `ssh root@76.13.2.221` → `/opt/presocial`

## Features

- **Trending Discussions** - Browse trending posts from Lemmy communities
- **Community Search** - Search posts across the fediverse
- **Community Discovery** - Discover communities by topic
- **PreSuite Auth** - Sign in with PreSuite Hub credentials
- **Voting** - Upvote/downvote posts (requires auth)
- **Bookmarks** - Save posts for later (requires auth)
- **Comment Threads** - Nested, collapsible comment viewing
- **Dark Glass UI** - Matching PreSuite design system
- **Mobile Responsive** - Works on all screen sizes

## Repository Structure

```
PreSocial/
├── apps/
│   ├── api/                    # Hono backend API
│   │   └── src/
│   │       ├── api/            # Routes and middleware
│   │       ├── services/       # Lemmy client, cache
│   │       └── types/          # TypeScript definitions
│   └── web/                    # React frontend
│       └── src/
│           ├── components/     # Header, Layout, PostCard, Sidebar
│           ├── context/        # Auth, Vote, Bookmark contexts
│           ├── pages/          # Feed, Trending, Communities, Search, Post, Saved
│           └── services/       # API clients
├── .env.example
├── package.json
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 20+
- Bun runtime

### Development

```bash
# Install dependencies
npm install
cd apps/web && npm install
cd ../api && bun install

# Copy environment file
cp .env.example .env

# Start development
npm run dev
```

- API: `http://localhost:3002`
- Web: `http://localhost:5174`

### Production

```bash
npm run build
npm run start
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Lucide Icons |
| Backend | Bun, Hono, lemmy-js-client |
| Cache | In-memory LRU (Redis optional) |
| Auth | PreSuite Hub JWT |

## Documentation

Full documentation is in the [ARC repository](https://github.com/tijnski/presuite-architecture):

- **[PRESOCIAL.md](https://github.com/tijnski/presuite-architecture/blob/main/PRESOCIAL.md)** - Architecture, API spec, deployment
- **[CLAUDE.md](https://github.com/tijnski/presuite-architecture/blob/main/CLAUDE.md)** - AI agent reference

## Related Services

| Service | URL |
|---------|-----|
| PreSuite Hub | https://presuite.eu |
| PreDrive | https://predrive.eu |
| PreMail | https://premail.site |
| PreOffice | https://preoffice.site |

## License

MIT - Part of the PreSuite ecosystem.

---

Based on [Lemmy](https://join-lemmy.org/), an open-source federated link aggregator.
