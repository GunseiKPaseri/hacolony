.env:
	./tools/create-env.sh
dev:
	npm run dev
studio:
	npx prisma studio
migrate:
	npx prisma migrate dev
syncdb:
	npx prisma generate
	npx prisma db push
lint:
	npm run lint