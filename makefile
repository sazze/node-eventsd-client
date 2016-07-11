REPORTER = spec

test:
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
	--reporter $(REPORTER) \
	--recursive \
	test/*.test.js

.PHONY: test