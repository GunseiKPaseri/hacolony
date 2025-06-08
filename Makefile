.env:
	./tools/create-env.sh
dev:
	npm run dev
studio:
	npx prisma studio --schema ./src/server/prisma/schema.prisma
generate:
	npx prisma generate --schema ./src/server/prisma/schema.prisma
migrate: generate
	npx prisma migrate dev --schema ./src/server/prisma/schema.prisma
syncdb: generate
	npx prisma db push --schema ./src/server/prisma/schema.prisma
syncdb-force:
	npx prisma db push --force-reset --schema ./src/server/prisma/schema.prisma
seed: generate
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
