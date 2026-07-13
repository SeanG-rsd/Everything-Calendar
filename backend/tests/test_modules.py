from tests.conftest import register_and_login


def test_create_and_list_module(client, auth_headers):
    response = client.post(
        "/api/modules",
        json={"name": "Fitness", "category": "list", "schema_definition": {"fields": ["reps"]}},
        headers=auth_headers,
    )
    assert response.status_code == 201
    module = response.json()
    assert module["name"] == "Fitness"
    assert module["category"] == "list"
    assert module["is_active"] is True

    response = client.get("/api/modules", headers=auth_headers)
    assert response.status_code == 200
    names = [m["name"] for m in response.json()]
    assert "Fitness" in names


def test_duplicate_module_name_for_same_user_rejected(client, auth_headers):
    client.post("/api/modules", json={"name": "Fitness", "category": "list"}, headers=auth_headers)
    response = client.post(
        "/api/modules", json={"name": "Fitness", "category": "list"}, headers=auth_headers
    )
    assert response.status_code == 409


def test_same_module_name_allowed_for_different_users(client, auth_headers):
    client.post("/api/modules", json={"name": "Fitness", "category": "list"}, headers=auth_headers)

    other_headers = register_and_login(client, "bob@example.com")
    response = client.post(
        "/api/modules", json={"name": "Fitness", "category": "list"}, headers=other_headers
    )
    assert response.status_code == 201


def test_user_cannot_see_or_modify_other_users_module(client, auth_headers):
    created = client.post(
        "/api/modules", json={"name": "Fitness", "category": "list"}, headers=auth_headers
    ).json()
    module_id = created["id"]

    other_headers = register_and_login(client, "bob@example.com")

    get_resp = client.get(f"/api/modules/{module_id}", headers=other_headers)
    assert get_resp.status_code == 404

    put_resp = client.put(
        f"/api/modules/{module_id}", json={"name": "Hijacked"}, headers=other_headers
    )
    assert put_resp.status_code == 404

    delete_resp = client.delete(f"/api/modules/{module_id}", headers=other_headers)
    assert delete_resp.status_code == 404


def test_update_module(client, auth_headers):
    created = client.post(
        "/api/modules", json={"name": "Fitness", "category": "list"}, headers=auth_headers
    ).json()

    response = client.put(
        f"/api/modules/{created['id']}",
        json={"is_active": False},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False
    assert response.json()["name"] == "Fitness"


def test_filter_modules_by_is_active(client, auth_headers):
    client.post(
        "/api/modules", json={"name": "Active One", "category": "list"}, headers=auth_headers
    )
    inactive = client.post(
        "/api/modules", json={"name": "Inactive One", "category": "list"}, headers=auth_headers
    ).json()
    client.put(
        f"/api/modules/{inactive['id']}", json={"is_active": False}, headers=auth_headers
    )

    response = client.get("/api/modules", params={"is_active": True}, headers=auth_headers)
    names = [m["name"] for m in response.json()]
    assert "Active One" in names
    assert "Inactive One" not in names


def test_delete_module_without_entries_succeeds(client, auth_headers):
    created = client.post(
        "/api/modules", json={"name": "Fitness", "category": "list"}, headers=auth_headers
    ).json()
    response = client.delete(f"/api/modules/{created['id']}", headers=auth_headers)
    assert response.status_code == 204
    assert client.get(f"/api/modules/{created['id']}", headers=auth_headers).status_code == 404


def test_delete_module_with_entries_blocked(client, auth_headers):
    module = client.post(
        "/api/modules", json={"name": "Fitness", "category": "list"}, headers=auth_headers
    ).json()
    client.post(
        "/api/entries",
        json={"module_id": module["id"], "payload": {"reps": 10}},
        headers=auth_headers,
    )

    response = client.delete(f"/api/modules/{module['id']}", headers=auth_headers)
    assert response.status_code == 409

    # deactivating instead is allowed
    deactivate = client.put(
        f"/api/modules/{module['id']}", json={"is_active": False}, headers=auth_headers
    )
    assert deactivate.status_code == 200


def test_registration_seeds_default_modules(client):
    headers = register_and_login(client, "seeded@example.com")
    modules = client.get("/api/modules", headers=headers).json()
    by_name = {m["name"]: m["category"] for m in modules}
    assert by_name == {
        "To-Dos": "list",
        "Homework": "list",
        "Long-Term Goals": "list",
        "Daily Diet": "totals",
        "Daily Goals": "totals",
        "Daily Workout": "totals",
    }
