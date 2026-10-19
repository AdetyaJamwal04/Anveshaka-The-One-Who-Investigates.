import pytest
from fastapi.testclient import TestClient
from api import app

@pytest.fixture
def client():
    return TestClient(app)

def test_health(client):
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json() == {'status': 'ok'}

def test_liveness(client):
    response = client.get('/health/live')
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'alive'
    assert 'timestamp' in data

def test_readiness(client):
    response = client.get('/health/ready')
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'ready'
    assert data['checks']['storage'] == 'ready'

def test_list_reports(client):
    response = client.get('/reports')
    assert response.status_code == 200
    assert isinstance(response.json(), list)
