# Setup

## Prerequisites

- This project is set up to run within a **Docker** environment.
- Ensure Docker and Docker Compose are installed on your machine.
- The supported development and debugging workflow runs through Docker Compose.

## Setup Instructions

1. Clone the repository:

   ```bash
   git clone https://github.com/shimauma0312/TaNaRi-Chan.git
   cd TaNaRi-Chan

   ```

2. Build the reproducible development image. Dependencies are installed from
   `src/package-lock.json` with `npm ci` during the image build:

   ```bash
   docker compose build
   ```

3. Start the application. PostgreSQL must pass its health check and all tracked
   migrations are applied before Next.js starts:

   ```bash
   docker compose up -d
   ```

4. Access

   ```bash
   http://localhost:3000
   ```

## Environment Variables

This project requires environment variables to be set up. Follow these steps to create and configure the `.env` file:

1. Copy the `.default.env` file in the `src` directory to create a new `.env` file in the same directory:

   ```bash
   cp src/.default.env src/.env

   ```

2. Open the .env file and set the database URL and other necessary environment variables. For example:

   ```bash
   DATABASE_URL="postgresql://postgres:example_password@db:5432/app_db"
   # Comma-separated externally visible origins, without paths or trailing slashes.
   TRUSTED_ORIGINS="https://tanari.example.com"
   # Add other environment variables as needed for your application
   ```

   Note: Docker Compose supplies this value to containers, so a local `.env`
   value is only needed when commands run outside Compose.

   State-changing browser requests are accepted only from the request's internal
   origin or an exact origin in `TRUSTED_ORIGINS`. Docker Compose automatically
   adds `localhost` and `127.0.0.1` with each service's published port. A reverse
   proxy's public HTTPS origin must be listed explicitly; `X-Forwarded-*` headers
   are not trusted for this decision.

## Docker Development and Debugging

The image contains its dependencies. Container startup never runs `npm install`,
changes source ownership, or requires `sudo`. After changing `package-lock.json`,
rebuild and renew the anonymous dependency volume:

```bash
docker compose build app
docker compose up -d --renew-anon-volumes app
```

Useful commands:

```bash
# Follow application logs
docker compose logs -f app

# Run the test suite in the same image used for development
docker compose run --rm app npm test -- --runInBand

# Apply tracked migrations explicitly (also runs automatically before app)
docker compose run --rm migrate

# Open Prisma Studio at http://localhost:5555
docker compose --profile tools up studio

# Start Next.js with the Node inspector on localhost:9229 (app on port 3001)
docker compose --profile debug up debug

# Build the production runtime image
docker build --target production -t tanari-chan:production .

# Run the standalone production image locally at http://localhost:3002
docker compose --profile production up --build production
```

The application, database, Studio, and inspector ports are bound to
`127.0.0.1` by default and are not exposed to the local network. VS Code and
Chrome-based debuggers can attach to `localhost:9229`.

The bundled database is PostgreSQL 17 and uses the `pgdata17` volume. If data
exists in the legacy PostgreSQL 13 volume, follow
[`docs/database-operations.md`](docs/database-operations.md) instead of attaching
the old volume directly.

## Prisma Database Setup

> **Important**: Run Prisma commands through Docker Compose.
>
> ```bash
> docker compose run --rm app sh
> ```

### Initial Database Setup

`docker compose up` applies all tracked migrations automatically. Seeding is an
explicit operation so existing development data is not replaced unexpectedly:

```bash
# Apply existing tracked migrations manually
docker compose run --rm migrate

# Seed initial data when required (destructively replaces application data)
docker compose run --rm -e ALLOW_DESTRUCTIVE_SEED=true app npx prisma db seed
```

### Development Workflow

#### After Schema Changes

When you modify the Prisma schema file (`prisma/schema.prisma`):

```bash
# 1. Create and apply a new migration
docker compose run --rm app npx prisma migrate dev --name describe_your_changes

# 2. Regenerate Prisma Client
docker compose run --rm app npx prisma generate
```

#### Database Reset (Development Only)

If you need to completely reset your development database:

```bash
# Reset database, apply all migrations, and run seed
docker compose run --rm -e ALLOW_DESTRUCTIVE_SEED=true app npx prisma migrate reset

# Alternative: Manual reset
docker compose run --rm app npx prisma db push --force-reset
docker compose run --rm -e ALLOW_DESTRUCTIVE_SEED=true app npx prisma db seed
```

The seed command is refused when `NODE_ENV=production` or when
`ALLOW_DESTRUCTIVE_SEED=true` is not explicitly supplied. It clears all
application tables in one transaction before creating the sample data.

#### Production Deployment

The `production` profile above is a local production-image smoke environment.
For a release connected to a managed PostgreSQL database, use the fail-closed
release definition and supply secrets from the deployment platform:

```bash
PRODUCTION_DATABASE_URL="postgresql://..." \
TRUSTED_ORIGINS="https://tanari.example.com" \
docker compose -f docker-compose.release.yml up --build -d

# Build the non-root standalone production image
docker build --target production -t tanari-chan:production .
```

Backup, restore, retention, PostgreSQL upgrade, and Prisma baseline procedures
are documented in [`docs/database-operations.md`](docs/database-operations.md).

### Useful Commands

```bash
# View database with Prisma Studio (opens at http://localhost:5555)
docker compose --profile tools up studio

# Check migration status
docker compose run --rm app npx prisma migrate status

# View current database schema
docker compose run --rm app npx prisma db pull

# Format schema file
docker compose run --rm app npx prisma format
```

### Troubleshooting

- **Migration conflicts**: Use `npx prisma migrate reset` in development
- **Client out of sync**: Run `npx prisma generate` after schema changes
- **Database connection issues**: Check `DATABASE_URL` in docker-compose.yml

If a database volume was created before migrations were tracked, startup can
fail with Prisma `P3005` or `P3018`. Do not mark migrations as applied until the
existing schema has been compared with the migration SQL. If the local data is
disposable, this recreates only this Compose project's database volume:

```bash
# Warning: this permanently deletes the local PostgreSQL data for this project.
docker compose down --volumes
docker compose up -d app
```

Back up any data that must be retained and baseline the existing database before
starting the new migration service.

## Testing

This project includes comprehensive test coverage for error handling functionality using Jest.

### Running Tests

```bash
# Run all tests once
docker compose run --rm app npm test -- --runInBand

# Run tests in watch mode
docker compose run --rm app npm run test:watch

# Run tests with coverage
docker compose run --rm app npm run test:coverage -- --runInBand
```
