VENV := venv
PYTHON := $(VENV)/bin/python
UVICORN := $(VENV)/bin/uvicorn
UV := uv
PYTHON3 := $(shell which python3.13 || which python3.12 || which python3.11)

.PHONY: venv install dev run clean

venv:
	$(UV) venv --python $(PYTHON3) $(VENV)

install: venv
	$(UV) pip install --python $(PYTHON) aider-chat -r requirements.txt

dev: install
	$(UVICORN) main:app --host 0.0.0.0 --port 8000 --reload

run: install
	$(UVICORN) main:app --host 0.0.0.0 --port 8000

clean:
	rm -rf $(VENV) __pycache__ */__pycache__ *.egg-info
