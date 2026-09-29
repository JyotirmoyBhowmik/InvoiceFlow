.PHONY: help up down db-init create-admin test lint build

help:
	@echo "InvoiceFlow Build & Operational Commands:"
	@echo "  make up           - Start PostgreSQL, Redis, and Backend via docker-compose"
	@echo "  make down         - Stop all local containers"
	@echo "  make db-init      - Execute master SQL schemas against database"
	@echo "  make create-admin - Interactively provision superadmin user"
	@echo "  make test         - Run structural unit and service tests"
	@echo "  make lint         - Execute code quality linters (mypy, ruff)"

up:
	docker compose up -d

down:
	docker compose down

db-init:
	docker compose exec -T postgres psql -U postgres -d invoiceflow -f /docker-entrypoint-initdb.d/00_master.sql
	docker compose exec -T postgres psql -U postgres -d invoiceflow -f /docker-entrypoint-initdb.d/01_bootstrap_structure.sql
	docker compose exec -T postgres psql -U postgres -d invoiceflow -f /docker-entrypoint-initdb.d/02_views.sql
	docker compose exec -T postgres psql -U postgres -d invoiceflow -f /docker-entrypoint-initdb.d/03_partitions.sql

create-admin:
	python -m app.cli create-admin

lint:
	npm run lint
