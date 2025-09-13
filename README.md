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
   DATABASE_URL="postgresql://postgres:example_password@db:/app_db" 👈 no touch
   # Add other environment variables as needed for your application
   ```

   Note: You do not need to modify the DATABASE_URL value.


## Prisma Migration Instructions

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

### Test Files

- `__tests__/errorHandler.test.ts` - Comprehensive error handler test suite

### Coverage Reports

When running tests with coverage, reports are generated in:
- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/lcov.info` - LCOV format for CI/CD integration