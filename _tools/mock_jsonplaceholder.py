"""Локальная копия контракта jsonplaceholder.typicode.com (/users) — только для офлайн-проверки тестов."""
from flask import Flask, jsonify, request

app = Flask(__name__)
USERS = {i: {"id": i, "name": f"User {i}", "username": f"user{i}", "email": f"user{i}@example.com",
             "address": {"street": "Main", "suite": "Apt. 1", "city": "City", "zipcode": "00000",
                         "geo": {"lat": "0", "lng": "0"}},
             "phone": "000", "website": "example.org",
             "company": {"name": "Company", "catchPhrase": "-", "bs": "-"}} for i in range(1, 11)}
USERS[1].update(name="Leanne Graham", username="Bret", email="Sincere@april.biz",
                phone="1-770-736-8031 x56442", website="hildegard.org")
USERS[1]["company"]["name"] = "Romaguera-Crona"


@app.get("/users")
def users():
    return jsonify(list(USERS.values()))


@app.get("/users/<int:uid>")
def user(uid):
    return (jsonify(USERS[uid]), 200) if uid in USERS else (jsonify({}), 404)


@app.post("/users")
def create():
    return jsonify({"id": 11, **(request.get_json(silent=True) or {})}), 201


@app.put("/users/<int:uid>")
def update(uid):
    return jsonify({"id": uid, **(request.get_json(silent=True) or {})}), 200


if __name__ == "__main__":
    app.run(port=5001)
