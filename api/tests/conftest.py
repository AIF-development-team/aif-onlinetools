import os
import pytest
from fastapi.testclient import TestClient

# Ensure working directory is api/ so aifdictionary.json is found
os.chdir(os.path.join(os.path.dirname(__file__), ".."))

from main import app  # noqa: E402


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def sample_aif_content():
    fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "sample.aif")
    with open(fixture_path) as f:
        return f.read()
