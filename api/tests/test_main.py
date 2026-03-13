import io
import json


def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_check_aif_valid(client, sample_aif_content):
    response = client.post(
        "/api/check-aif",
        content=json.dumps({"content": sample_aif_content}),
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "valid" in data


def test_check_aif_invalid(client):
    response = client.post(
        "/api/check-aif",
        content=json.dumps({"content": "this is not valid AIF content"}),
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 500


def test_input_to_aif(client):
    payload = {
        "metadata": {
            "_exptl_adsorptive": "N2",
            "_exptl_temperature": "77",
            "_units_temperature": "K",
            "_units_pressure": "kPa",
            "_units_loading": "mmol/g",
        },
        "adsorption_data": [
            {"_adsorp_pressure": "0.1", "_adsorp_amount": "1.2"},
            {"_adsorp_pressure": "0.2", "_adsorp_amount": "2.3"},
        ],
    }
    response = client.post("/api/input-to-aif", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "aif_content" in data
    assert "_exptl_adsorptive" in data["aif_content"]


def test_input_to_aif_missing_fields(client):
    response = client.post("/api/input-to-aif", json={"metadata": {}})
    assert response.status_code == 422


def test_process_aif(client, sample_aif_content):
    response = client.post(
        "/api/process-aif",
        files={"file": ("test.aif", io.BytesIO(sample_aif_content.encode()), "application/octet-stream")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "metadata" in data
    assert "plotData" in data
    assert len(data["plotData"]["ads_press"]) == 3
    assert len(data["plotData"]["des_press"]) == 3


def test_process_aif_wrong_extension(client):
    response = client.post(
        "/api/process-aif",
        files={"file": ("test.txt", io.BytesIO(b"some content"), "text/plain")},
    )
    assert response.status_code == 400


def test_convert_invalid_format(client):
    response = client.post(
        "/api/convert",
        data={"source_format": "invalid,format"},
        files={"file": ("test.txt", io.BytesIO(b"some content"), "text/plain")},
    )
    assert response.status_code == 400
