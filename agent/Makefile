VENV := venv
PYTHON := $(VENV)/bin/python
UVICORN := $(VENV)/bin/uvicorn
UV := uv
PYTHON3 := $(shell which python3.13 || which python3.12 || which python3.11)
SITE_PACKAGES := $(shell $(PYTHON) -c "import site; print(site.getsitepackages()[0])" 2>/dev/null)

.PHONY: venv install fix-pydub dev run clean

venv:
	$(UV) venv --python $(PYTHON3) $(VENV)

install: venv
	$(UV) pip install --python $(PYTHON) aider-chat -r requirements.txt
	$(MAKE) fix-pydub

# Python 3.13 removed the built-in audioop module (PEP 594).
# pydub imports it at module load time which crashes aider on startup.
# This installs a no-op stub that satisfies the import without real audio support.
fix-pydub:
	@SITE=$$($(PYTHON) -c "import site; print(site.getsitepackages()[0])") && \
	if [ ! -f "$$SITE/audioop.py" ]; then \
		echo "Installing audioop stub for Python 3.13+ compatibility..." ; \
		cp audioop_stub.py "$$SITE/audioop.py" ; \
	fi

dev: install
	$(UVICORN) main:app --host 0.0.0.0 --port 8000 --reload

run: install
	$(UVICORN) main:app --host 0.0.0.0 --port 8000

clean:
	rm -rf $(VENV) __pycache__ */__pycache__ *.egg-info
