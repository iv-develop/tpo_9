"""Те же проверки, что и в Postman-коллекции (lab5/users.postman_collection.json)."""
import os

import requests

BASE_URL = os.getenv("BASE_URL", "https://jsonplaceholder.typicode.com")
TIMEOUT = 10


def test_get_user_by_id():
    r = requests.get(f"{BASE_URL}/users/1", timeout=TIMEOUT)
    assert r.status_code == 200
    assert "application/json" in r.headers["Content-Type"]
    assert r.elapsed.total_seconds() < 2
    body = r.json()
    for key in ("id", "name", "username", "email", "address", "phone", "company"):
        assert key in body, f"нет поля {key}"
    assert body["id"] == 1
    assert body["name"] == "Leanne Graham"
    assert "@" in body["email"]
    assert {"street", "city", "zipcode", "geo"} <= set(body["address"])


def test_get_users_list():
    r = requests.get(f"{BASE_URL}/users", timeout=TIMEOUT)
    assert r.status_code == 200
    users = r.json()
    assert isinstance(users, list) and len(users) == 10
    assert len({u["id"] for u in users}) == 10


def test_get_unknown_user_returns_404():
    r = requests.get(f"{BASE_URL}/users/9999", timeout=TIMEOUT)
    assert r.status_code == 404


def test_create_user():
    payload = {"name": "Вадим Потапов", "username": "vadim", "email": "vadim@example.com"}
    r = requests.post(f"{BASE_URL}/users", json=payload, timeout=TIMEOUT)
    assert r.status_code == 201
    body = r.json()
    assert isinstance(body["id"], int)
    for key, value in payload.items():
        assert body[key] == value


def test_update_user():
    payload = {"name": "Вадим Потапов", "username": "vadim", "email": "new@example.com"}
    r = requests.put(f"{BASE_URL}/users/1", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == 1
    assert body["email"] == "new@example.com"
    assert body["name"] == payload["name"]
