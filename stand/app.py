"""Тестовый стенд для лабораторных работ (написан студентом).

Страницы:  /login, /secure, /logout, /contact
API:       /api/health, /api/items
"""
from flask import Flask, jsonify, redirect, render_template, request, session, url_for

app = Flask(__name__)
app.secret_key = "tpo-lab-secret-key"

VALID_LOGIN = "student"
VALID_PASSWORD = "Passw0rd!"
ITEMS = [{"id": i, "title": f"Товар {i}", "price": round(100 + i * 12.5, 2)} for i in range(1, 21)]


@app.get("/")
def index():
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    error = None
    if request.method == "POST":
        if (request.form.get("username") == VALID_LOGIN
                and request.form.get("password") == VALID_PASSWORD):
            session["user"] = VALID_LOGIN
            return redirect(url_for("secure"))
        error = "Неверный логин или пароль"
    return render_template("login.html", error=error, info=request.args.get("info"))


@app.get("/secure")
def secure():
    if "user" not in session:
        return redirect(url_for("login"))
    return render_template("secure.html", user=session["user"])


@app.get("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("login", info="Вы вышли из системы"))


@app.get("/contact")
def contact():
    return render_template("contact.html")


@app.get("/api/health")
def health():
    return jsonify(status="ok")


@app.get("/api/items")
def items():
    return jsonify(ITEMS)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, threaded=True)
