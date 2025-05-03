# This script generates a .env file with random secrets for a Next.js application.
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" > .env
