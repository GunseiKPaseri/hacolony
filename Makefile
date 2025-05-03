.env:
	./tools/create-env.sh
dev:
	npm run dev
studio:
	npx prisma studio
migrate:
	npx prisma migrate dev
generate:
	npx prisma generate
syncdb: generate
	npx prisma db push
syncdb-force:
	npx prisma db push --force-reset
lint:
	npm run lint