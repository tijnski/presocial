# PreSocial

Native social layer for the PreSuite ecosystem - powered by [Lemmy](https://join-lemmy.org/).

![PreSuite](https://img.shields.io/badge/PreSuite-Service-0190FF)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

PreSocial provides community-driven discussions by integrating with Lemmy, an open-source federated Reddit alternative.

**Live URL:** https://presocial.presuite.eu
**Server:** `ssh root@76.13.2.221` → `/opt/presocial`

## Quick Start

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
