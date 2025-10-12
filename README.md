# Setup

## Prerequisites

- This project is set up to run within a **Docker** environment.
- Ensure Docker and Docker Compose are installed on your machine.
  -This project is primarily developed on WSL2 (Ubuntu). We have not tested it on other environments.

## Setup Instructions

1. Clone the repository:

   ```bash
   git clone https://github.com/shimauma0312/TaNaRi-Chan.git
   cd TaNaRi-Chan

   ```

2. Build the Docker containers:

   ```bash
   docker compose build
   ```

3. Start the application:

   ```bash
   docker compose up -d
   ```

4. Set up the database (see Prisma Migration Instructions below)

5. Access

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
   DATABASE_URL="postgresql://postgres:example_password@db:/app_db"
   # Add other environment variables as needed for your application
   ```

   Note: You do not need to modify the DATABASE_URL value.

## Prisma Database Setup

> **Important**: All Prisma commands below must be executed _inside_ the Docker container.
>
> ```bash
> docker compose exec app bash
> ```

### Initial Database Setup

When starting the application for the first time, follow these steps in order:

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Apply existing migrations (if any)
npx prisma migrate deploy

# 3. If no migrations exist, create the initial migration
npx prisma migrate dev --name init

# 4. Seed the database with initial data
npx prisma db seed
```

### Development Workflow

#### After Schema Changes

When you modify the Prisma schema file (`prisma/schema.prisma`):

```bash
# 1. Create and apply a new migration
npx prisma migrate dev --name describe_your_changes

# 2. Regenerate Prisma Client
npx prisma generate
```

#### Database Reset (Development Only)

If you need to completely reset your development database:

```bash
# Reset database, apply all migrations, and run seed
npx prisma migrate reset

# Alternative: Manual reset
npx prisma db push --force-reset
npx prisma db seed
```

#### Production Deployment

For production environments:

```bash
# Apply pending migrations without prompts
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Useful Commands

```bash
# View database with Prisma Studio (opens at http://localhost:5555)
npx prisma studio

# Check migration status
npx prisma migrate status

# View current database schema
npx prisma db pull

# Format schema file
npx prisma format
```

### Troubleshooting

- **Migration conflicts**: Use `npx prisma migrate reset` in development
- **Client out of sync**: Run `npx prisma generate` after schema changes
- **Database connection issues**: Check `DATABASE_URL` in docker-compose.yml

## Testing

This project includes comprehensive test coverage for error handling functionality using Jest.

### Running Tests

```bash
# Navigate to src directory
cd src

# Run all tests once
npm test

# Run tests in watch mode (automatically re-run when files change)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Alternative: Use the test runner script
chmod +x run-tests.sh
./run-tests.sh --coverage
```
