# Local Quick Start

MedGate Lite runs locally with Bun, Next.js, Prisma, and SQLite.

## Requirements

- Bun 1.1 or newer
- Git

## Setup

```bash
git clone https://github.com/kyal102/medgate.git
cd medgate
cp .env.example .env
bun install --frozen-lockfile
bun run db:generate
bun run db:push
bun run dev
```

Open `http://localhost:3000`.

## Windows PowerShell

```powershell
git clone https://github.com/kyal102/medgate.git
cd medgate
Copy-Item .env.example .env
bun install --frozen-lockfile
bun run db:generate
bun run db:push
bun run dev
```

## Useful Commands

```bash
bun run dev          # local development server
bun run build        # production build check
bun run start        # serve a production build
bun run lint         # static lint pass
bun run db:generate  # generate Prisma client
bun run db:push      # create/update local SQLite database
```

## Reset Local Data

Stop the dev server, delete `db/custom.db`, then run:

```bash
bun run db:push
```

The database is local demo state only and is ignored by Git.
