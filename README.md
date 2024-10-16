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
   docker-compose build
   ```

3. Start the application:

   ```bash
   docker-compose up
   ```

4. Access

   ```bash
   http://localhost:3000
   ```

## Environment Variables

This project requires environment variables to be set up. Follow these steps to create and configure the `.env` file:

1. Copy the `.default.env` file in the `src` directory to create a new `.env` file in the same directory:

2. Open the .env file and set the Firebase authentication information and other necessary environment variables. For example:

   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_firebase_auth_domain"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_firebase_project_id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_firebase_storage_bucket"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_firebase_messaging_sender_id"
   NEXT_PUBLIC_FIREBASE_APP_ID="your_firebase_app_id"
   ```

   Replace the placeholder values with your actual Firebase project credentials.  
   Note: You do not need to modify the DATABASE_URL value.
