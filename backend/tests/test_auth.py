from tests.conftest import register_and_login


def test_register_creates_user(client):
    response = client.post(
        "/api/auth/register", json={"email": "alice@example.com", "password": "s3cret123"}
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "alice@example.com"
    assert body["is_active"] is True
    assert "hashed_password" not in body


def test_register_duplicate_email_rejected(client):
    client.post("/api/auth/register", json={"email": "alice@example.com", "password": "s3cret123"})
    response = client.post(
        "/api/auth/register", json={"email": "alice@example.com", "password": "different"}
    )
    assert response.status_code == 409


def test_login_success_returns_bearer_token(client):
    client.post("/api/auth/register", json={"email": "alice@example.com", "password": "s3cret123"})
    response = client.post(
        "/api/auth/login", json={"email": "alice@example.com", "password": "s3cret123"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_wrong_password_rejected(client):
    client.post("/api/auth/register", json={"email": "alice@example.com", "password": "s3cret123"})
    response = client.post(
        "/api/auth/login", json={"email": "alice@example.com", "password": "wrong"}
    )
    assert response.status_code == 401


def test_login_unknown_email_rejected(client):
    response = client.post(
        "/api/auth/login", json={"email": "nobody@example.com", "password": "whatever"}
    )
    assert response.status_code == 401


def test_me_requires_auth(client):
    response = client.get("/api/auth/me")
    assert response.status_code in (401, 403)


def test_me_returns_current_user(client):
    headers = register_and_login(client, "alice@example.com")
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == "alice@example.com"


def test_me_rejects_garbage_token(client):
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert response.status_code == 401
