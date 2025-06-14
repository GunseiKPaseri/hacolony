.env:
	./tools/create-env.sh
dev:
	npm run dev
db/studio:
	npx prisma studio --schema ./src/infrastructure/prisma/schema.prisma
db/generate:
	npx prisma generate --schema ./src/infrastructure/prisma/schema.prisma
db/migrate: generate
	npx prisma migrate dev --schema ./src/infrastructure/prisma/schema.prisma
db/sync: generate
	npx prisma db push --schema ./src/infrastructure/prisma/schema.prisma
db/sync-force:
	npx prisma db push --force-reset --schema ./src/infrastructure/prisma/schema.prisma
db/fmt:
	npm run fmt:prisma
db/seed: db/fmt db/generate db/sync-force
	npm run db:seed
fmt:
	npm run fmt
check:
	npm run check
test:
	npm run test
pre-push: fmt check test
