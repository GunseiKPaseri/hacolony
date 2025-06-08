.env:
	./tools/create-env.sh
dev:
	npm run dev
db/studio:
	npx prisma studio --schema ./src/server/prisma/schema.prisma
db/generate:
	npx prisma generate --schema ./src/server/prisma/schema.prisma
db/migrate: generate
	npx prisma migrate dev --schema ./src/server/prisma/schema.prisma
db/sync: generate
	npx prisma db push --schema ./src/server/prisma/schema.prisma
db/sync-force:
	npx prisma db push --force-reset --schema ./src/server/prisma/schema.prisma
db/fmt:
	npm run fmt:prisma
db/seed: db/fmt db/generate db/sync-force
	npm run db:seed
lint:
	npm run lint
fmt:
	npm run fmt
check:
	npm run check
test:
	npm run test
pre-push: lint fmt check test
