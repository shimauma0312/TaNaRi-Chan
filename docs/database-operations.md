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

# Stop application writers before the destructive restore.
docker compose stop app
./scripts/restore-db.ps1 -BackupFile D:\backups\tanari\tanari-YYYYMMDDTHHMMSSZ.dump -ConfirmRestore
```

The restore uses one database transaction and exits on the first SQL error, so
a failed restore rolls back instead of leaving a partially restored schema.

Copy completed backups to encrypted off-host storage. A file left beside the database is not a disaster-recovery backup.

## PostgreSQL 13 to 17

The Compose service now uses PostgreSQL 17 and a new `pgdata17` volume. The old `pgdata` volume is intentionally not reused because major-version data directories are incompatible.

For data that must be retained:

1. Run the old PostgreSQL image against the legacy volume without exposing it publicly.
2. Create and verify a custom-format `pg_dump`.
3. Start PostgreSQL 17 with an empty `pgdata17` volume and restore the full dump into an isolated database.
4. Point the matching application version at that restored copy and run `prisma migrate deploy` to apply migrations created after the dump.
5. Compare row counts, run application smoke tests, and only then schedule the production cutover.
6. Keep the old volume and pre-cutover dump until the retention window expires.

Never point PostgreSQL 17 directly at a PostgreSQL 13 data directory.
Do not apply the new schema before restoring a schema-inclusive dump: the restore
would replace it with the schema and migration history captured from PostgreSQL 13.

## Existing Prisma databases

Before introducing tracked migrations to an existing database, compare its schema with every migration under `src/prisma/migrations`. Take a verified backup, test the procedure on a copy, and only then mark matching migrations with `prisma migrate resolve --applied`. Do not guess the baseline on the production database.

## Local retention maintenance

Cleanup can be exercised against the local development database through the
application image:

```powershell
docker compose run --rm `
  -e LOG_RETENTION_DAYS=30 `
  -e REVOKED_SESSION_RETENTION_DAYS=7 `
  app npm run maintenance:cleanup
```

The default retention is 30 days for application logs and seven days for revoked sessions; expired sessions and rate-limit buckets are removed immediately. Override `LOG_RETENTION_DAYS` and `REVOKED_SESSION_RETENTION_DAYS` with positive integer values. Record cleanup failures in the platform alerting system.
