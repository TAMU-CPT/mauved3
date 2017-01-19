NPM:=$(shell which npm)
YARN:=$(shell which yarn)

installer = $(NPM)

ifdef YARN
	installer = $(YARN)
endif

all: run

examples: example/nucl.json example/prot.json

example/%.json: example/%.xmfa
	python xmfa_process.py example/data.gff example/data.fa $< data/$(notdir $(basename $<))/ > $@


run: node_modules examples ## Run the server
	@echo "********************************"
	@echo "* open http://localhost:8000/ *"
	@echo "********************************"
	./node_modules/.bin/webpack-dev-server --progress --colors --devtool cheap-module-inline-source-map --hot --debug --inline --host 127.0.0.1 --port 8000

build: node_modules  ## Compile a project for deployment
	./node_modules/.bin/webpack  --progress --colors --devtool source-map --optimize-minimize --optimize-dedupe

node_modules: package.json
	$(installer) install

.PHONY: all examples run build

help:
	@egrep '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
