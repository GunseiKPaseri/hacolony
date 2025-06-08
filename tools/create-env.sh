# This script generates a .env file with random secrets for a Next.js application.
export SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET=$(SECRET)\nDATABASE_URL=file:./db/dev.db" > .env
