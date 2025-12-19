.PHONY: build up down restart logs shell migrate install

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

shell:
	docker-compose exec php bash

migrate:
	docker-compose exec php php artisan migrate

install:
	docker-compose exec php composer install
	npm install
	npm run build

deploy: build up install migrate
	@echo "Deployment completed!"

