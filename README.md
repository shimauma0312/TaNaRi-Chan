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

3. Start the application. PostgreSQL must pass its health check, all tracked
   migrations are applied, and an empty development database is seeded before
   Next.js starts. If at least one user already exists, seeding is skipped and
   existing data is left unchanged:

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

The shared development image contains both source and dependencies. This avoids
platform-specific bind-mount I/O failures and makes startup reproducible.
Container startup never runs `npm install`, changes source ownership, or
requires `sudo`. Rebuild the image after changing source or dependencies. The
app, migration, seed, debug, Studio, and Prisma authoring services all use this
same image tag:

```bash
docker compose build app
docker compose up -d app
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

# Verify that the optimized Next.js application build succeeds
docker compose run --rm -e NODE_ENV=production app npm run build
```

The application, database, Studio, and inspector ports are bound to
`127.0.0.1` by default and are not exposed to the local network. VS Code and
Chrome-based debuggers can attach to `localhost:9229`.

The bundled database is PostgreSQL 17 and uses the `pgdata17` volume. If data
exists in the legacy PostgreSQL 13 volume, follow
[`docs/database-operations.md`](docs/database-operations.md) instead of attaching
the old volume directly.

## Prisma Database Setup

> **Important**: Run Prisma authoring commands through the `prisma-cli`
> service. It is the only application service that mounts host files, and its
> writable mount is limited to `src/prisma`. Runtime services remain free of
> source bind mounts.

### Initial Database Setup

`docker compose up` applies all tracked migrations automatically. It inserts
the sample data only when the `User` table is empty; an existing database is
left unchanged. Destructive replacement remains an explicit operation:

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
docker compose --profile authoring run --rm prisma-cli npx prisma migrate dev --name describe_your_changes

# 2. Rebuild the shared image; this regenerates Prisma Client from the new schema
docker compose build app
docker compose up -d app
```

The narrow authoring mount preserves generated migrations and schema formatting
on the host. Do not run authoring commands with the bind-free `app` service,
because changes made inside a disposable container would be lost.

#### Database Reset (Development Only)

If you need to completely reset your development database:

```bash
# Reset database, apply all migrations, and run seed
docker compose --profile authoring run --rm -e ALLOW_DESTRUCTIVE_SEED=true prisma-cli npx prisma migrate reset
```

Use `migrate reset` so the development database retains the same migration
history as deployment environments. Do not use `db push --force-reset` for a
database that will later run `migrate deploy`.

All seed modes are refused when `NODE_ENV=production`. Automatic startup uses
`SEED_IF_EMPTY=true` and skips the seed when any user exists. Destructive
replacement requires `ALLOW_DESTRUCTIVE_SEED=true`; it clears all application
tables in one transaction before creating the sample data.

The Compose definition in this repository is limited to development, debugging,
and local tooling. It does not define a production deployment. Optimized build
validation remains available through `npm run build` in the development image
with `NODE_ENV=production` supplied as shown above.

Backup, restore, cleanup, PostgreSQL upgrade, and Prisma baseline procedures are
documented in [`docs/database-operations.md`](docs/database-operations.md).

### Useful Commands

```bash
# View database with Prisma Studio (opens at http://localhost:5555)
docker compose --profile tools up studio

# Check migration status
docker compose --profile authoring run --rm prisma-cli npx prisma migrate status

# View current database schema
docker compose --profile authoring run --rm prisma-cli npx prisma db pull

# Format schema file
docker compose --profile authoring run --rm prisma-cli npx prisma format
```

After `db pull`, `format`, or any other schema change, rebuild the shared app
image before starting runtime or tooling services.

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

# Run tests with coverage
docker compose run --rm app npm run test:coverage -- --runInBand
```

The bind-free development image is a source snapshot, so test watch mode cannot
observe host edits. Rebuild the image and run the tests once after making
changes.
