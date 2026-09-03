# Database operations

## Baseline recovery policy

- Target RPO: 24 hours.
- Target RTO: 4 hours.
- Create one encrypted full backup each day and before every schema migration.
- Keep seven daily backups and four weekly backups in storage outside the database host.
- Restrict backup access to the operations role and record every restore.
- Perform a restore rehearsal against an isolated database at least quarterly.

Adjust these targets before launch if the business cannot tolerate one day of data loss.

## Local backup and restore

The PowerShell helpers operate on the running Compose `db` service and use PostgreSQL's custom dump format:

```powershell
docker compose up -d db
./scripts/backup-db.ps1 -OutputDirectory D:\backups\tanari

# Destructive: restore into the configured app_db database.
./scripts/restore-db.ps1 -BackupFile D:\backups\tanari\tanari-YYYYMMDDTHHMMSSZ.dump -ConfirmRestore
```

Copy completed backups to encrypted off-host storage. A file left beside the database is not a disaster-recovery backup.

## PostgreSQL 13 to 17

The Compose service now uses PostgreSQL 17 and a new `pgdata17` volume. The old `pgdata` volume is intentionally not reused because major-version data directories are incompatible.

For data that must be retained:

1. Run the old PostgreSQL image against the legacy volume without exposing it publicly.
2. Create and verify a custom-format `pg_dump`.
3. Start PostgreSQL 17 with an empty `pgdata17` volume and restore the full dump into an isolated database.
4. Point the matching application release at that restored copy and run `prisma migrate deploy` to apply migrations created after the dump.
5. Compare row counts, run application smoke tests, and only then schedule the production cutover.
6. Keep the old volume and pre-cutover dump until the retention window expires.

Never point PostgreSQL 17 directly at a PostgreSQL 13 data directory.
Do not apply the new schema before restoring a schema-inclusive dump: the restore
would replace it with the schema and migration history captured from PostgreSQL 13.

## Existing Prisma databases

Before introducing tracked migrations to an existing database, compare its schema with every migration under `src/prisma/migrations`. Take a verified backup, test the procedure on a copy, and only then mark matching migrations with `prisma migrate resolve --applied`. Do not guess the baseline on the production database.

## Release Compose

`docker-compose.release.yml` intentionally has no bundled database and fails closed unless the production database URL and public origin are supplied:

```powershell
$env:PRODUCTION_DATABASE_URL = "postgresql://..."
$env:TRUSTED_ORIGINS = "https://tanari.example.com"
docker compose -f docker-compose.release.yml up --build -d
```

Inject the database URL from the deployment platform's secret manager. Set `TRUST_PROXY=true` only when direct access to the application port is blocked and a trusted reverse proxy overwrites forwarding headers.

## Retention maintenance

Run cleanup daily from the scheduler in the deployment platform:

```powershell
docker compose -f docker-compose.release.yml run --rm maintenance
```

The default retention is 30 days for application logs and seven days for revoked sessions; expired sessions and rate-limit buckets are removed immediately. Override `LOG_RETENTION_DAYS` and `REVOKED_SESSION_RETENTION_DAYS` with positive integer values. Record cleanup failures in the platform alerting system.
