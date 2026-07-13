from tests.conftest import register_and_login


def _create_module(client, headers, name="Fitness"):
    return client.post(
        "/api/modules", json={"name": name, "category": "list"}, headers=headers
    ).json()


def test_create_and_get_entry(client, auth_headers):
    module = _create_module(client, auth_headers)

    response = client.post(
        "/api/entries",
        json={"module_id": module["id"], "payload": {"reps": 10}},
        headers=auth_headers,
    )
    assert response.status_code == 201
    entry = response.json()
    assert entry["status"] == "active"
    assert entry["payload"] == {"reps": 10}

    get_resp = client.get(f"/api/entries/{entry['id']}", headers=auth_headers)
    assert get_resp.status_code == 200


def test_cannot_create_entry_for_other_users_module(client, auth_headers):
    module = _create_module(client, auth_headers)

    other_headers = register_and_login(client, "bob@example.com")
    response = client.post(
        "/api/entries",
        json={"module_id": module["id"], "payload": {}},
        headers=other_headers,
    )
    assert response.status_code == 404


def test_user_cannot_see_or_modify_other_users_entry(client, auth_headers):
    module = _create_module(client, auth_headers)
    entry = client.post(
        "/api/entries", json={"module_id": module["id"], "payload": {}}, headers=auth_headers
    ).json()

    other_headers = register_and_login(client, "bob@example.com")

    assert client.get(f"/api/entries/{entry['id']}", headers=other_headers).status_code == 404
    assert (
        client.put(
            f"/api/entries/{entry['id']}", json={"status": "done"}, headers=other_headers
        ).status_code
        == 404
    )
    assert client.delete(f"/api/entries/{entry['id']}", headers=other_headers).status_code == 404


def test_update_entry_status_and_payload(client, auth_headers):
    module = _create_module(client, auth_headers)
    entry = client.post(
        "/api/entries", json={"module_id": module["id"], "payload": {"reps": 1}}, headers=auth_headers
    ).json()

    response = client.put(
        f"/api/entries/{entry['id']}",
        json={"status": "done", "payload": {"reps": 2}},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "done"
    assert body["payload"] == {"reps": 2}


def test_delete_entry(client, auth_headers):
    module = _create_module(client, auth_headers)
    entry = client.post(
        "/api/entries", json={"module_id": module["id"], "payload": {}}, headers=auth_headers
    ).json()

    response = client.delete(f"/api/entries/{entry['id']}", headers=auth_headers)
    assert response.status_code == 204
    assert client.get(f"/api/entries/{entry['id']}", headers=auth_headers).status_code == 404


def test_list_entries_filters_by_module_and_status(client, auth_headers):
    module_a = _create_module(client, auth_headers, "Fitness")
    module_b = _create_module(client, auth_headers, "Journal")

    e1 = client.post(
        "/api/entries", json={"module_id": module_a["id"], "payload": {}}, headers=auth_headers
    ).json()
    client.post(
        "/api/entries", json={"module_id": module_b["id"], "payload": {}}, headers=auth_headers
    )
    client.put(f"/api/entries/{e1['id']}", json={"status": "done"}, headers=auth_headers)

    by_module = client.get(
        "/api/entries", params={"module_id": module_a["id"]}, headers=auth_headers
    ).json()
    assert len(by_module) == 1
    assert by_module[0]["module_id"] == module_a["id"]

    by_status = client.get("/api/entries", params={"status": "done"}, headers=auth_headers).json()
    assert len(by_status) == 1
    assert by_status[0]["status"] == "done"


def test_list_entries_pagination(client, auth_headers):
    module = _create_module(client, auth_headers)
    for i in range(5):
        client.post(
            "/api/entries", json={"module_id": module["id"], "payload": {"i": i}}, headers=auth_headers
        )

    page1 = client.get(
        "/api/entries", params={"limit": 2, "offset": 0}, headers=auth_headers
    ).json()
    page2 = client.get(
        "/api/entries", params={"limit": 2, "offset": 2}, headers=auth_headers
    ).json()
    assert len(page1) == 2
    assert len(page2) == 2
    assert {e["id"] for e in page1}.isdisjoint({e["id"] for e in page2})


def test_list_entries_excludes_other_users_entries(client, auth_headers):
    module = _create_module(client, auth_headers)
    client.post(
        "/api/entries", json={"module_id": module["id"], "payload": {}}, headers=auth_headers
    )

    other_headers = register_and_login(client, "bob@example.com")
    response = client.get("/api/entries", headers=other_headers)
    assert response.status_code == 200
    assert response.json() == []
