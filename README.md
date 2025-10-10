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

### Database Reset (Development Troubleshooting)

If you encounter database issues that prevent containers from starting properly and need to reset the database, use the following commands:

```bash
# Windows (cmd)
set PRISMA_RESET=true && docker compose up -d

# Windows (PowerShell)
$env:PRISMA_RESET="true"; docker compose up -d

# macOS/Linux
PRISMA_RESET=true docker compose up -d
```

This command will completely reset the database, reapply migrations, and reseed the data.

**Warning**: This command will delete all existing data. Do not use in production environments.

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
   DATABASE_URL="postgresql://postgres:example_password@db:/app_db"
   # Add other environment variables as needed for your application
   ```

   Note: You do not need to modify the DATABASE_URL value.

## Prisma Migration Instructions

> All instructions and commands below must be executed _inside_ the Docker container.
>
> ```bash
> docker compose exec app bash
> ```

Follow these steps to set up the database. This process is required when starting the application for the first time or after changing the Prisma schema.

```bash
# Prismaのマイグレーションファイルを生成（初期スキーマ定義時などに使用）
npx prisma migrate dev --name init

# 既存のマイグレーションを本番環境に適応（ビルドしないなら不要
npx prisma migrate deploy

# Prisma Client最新化
npx prisma generate
```

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
