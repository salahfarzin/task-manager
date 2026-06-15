watch:
	npm run dev -- --host=0.0.0.0

agent-install:
	$(MAKE) -C agent install

agent-dev:
	$(MAKE) -C agent dev

agent-clean:
	$(MAKE) -C agent clean
