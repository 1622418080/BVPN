.PHONY: dev build typecheck clean seed prisma-generate prisma-migrate prisma-studio up up-dev down

dev:
	npm run dev

build:
	npm run build

typecheck:
	npm run typecheck

clean:
	npm run clean

seed:
	npm run seed

prisma-generate:
	npm run prisma:generate

prisma-migrate:
	npm run prisma:migrate

prisma-studio:
	npm run prisma:studio

up:
	docker compose up -d

up-dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

down:
	docker compose down
