BIN = ./node_modules/.bin

BABEL_OPTS = src/ --out-dir lib/
WEBPACK_OPTS = --debug --output-pathinfo --colors

build: node_modules/ webpack
	$(BIN)/babel $(BABEL_OPTS)

build-production: node_modules/ webpack-production
	NODE_ENV=production $(BIN)/babel $(BABEL_OPTS)

webpack:
	$(BIN)/webpack $(WEBPACK_OPTS)

webpack-production:
	NODE_ENV=production $(BIN)/webpack

watch: node_modules/
	bin/parallel "$(BIN)/babel $(BABEL_OPTS) --watch" "$(BIN)/webpack $(WEBPACK_OPTS) --watch"

run: clean build
	node .

run-production: clean build-production
	NODE_ENV=production node .

node_modules/:
	npm install

clean:
	@rm -rf tmp/ lib/ public/bundle.*

distclean: clean
	@rm -rf node_modules/

publish:
	cap production deploy deploy:restart

.PHONY: build build-production watch webpack webpack-production run run-production clean distclean publish
