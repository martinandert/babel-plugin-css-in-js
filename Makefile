BIN = ./node_modules/.bin

SRC_JS = $(shell find src/ -name "*.js")
LIB_JS = $(patsubst src/%.js,lib/%.js,$(SRC_JS))

build: node_modules/ $(LIB_JS)

$(LIB_JS): lib/%.js: src/%.js
	@mkdir -p $(dir $@)
	BABEL_ENV=build $(BIN)/babel $< --out-file $@

fast: node_modules/ clean
	BABEL_ENV=build $(BIN)/babel src/ --out-dir lib/

watch: node_modules/
	BABEL_ENV=build $(BIN)/babel src/ --out-dir lib/ --watch

lint: node_modules/
	@$(BIN)/eslint src/

test: lint build
	@NODE_ENV=test $(BIN)/mocha

test-cov:
	@NODE_ENV=test $(BIN)/babel-node $(BIN)/babel-istanbul cover $(BIN)/_mocha

node_modules/:
	@npm install

clean:
	@rm -rf lib/ tmp/cache/build/

distclean: clean
	@rm -rf tmp/ node_modules/ coverage/

release-patch: test
	@$(call release,patch)

release-minor: test
	@$(call release,minor)

release-major: test
	@$(call release,major)

publish:
	git push --tags origin HEAD:master
	npm publish

define release
	npm version $(1) -m 'Release v%s'
endef

.PHONY: build fast watch lint test test-cov clean distclean release-patch release-minor release-major publish
