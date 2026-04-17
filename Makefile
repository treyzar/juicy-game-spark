.PHONY: install dev build preview test lint clean

install:
	npm install

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

test:
	npm run test

lint:
	npm run lint

clean:
	rm -rf node_modules dist
