"""Снимки стенда для отчётов."""
import threading, sys
from werkzeug.serving import make_server
from selenium.webdriver.common.by import By
from stand.app import app
from lab3.utils.browser import create_driver

srv = make_server("127.0.0.1", 0, app, threaded=True)
threading.Thread(target=srv.serve_forever, daemon=True).start()
base = f"http://127.0.0.1:{srv.server_port}"
out = sys.argv[1]
d = create_driver(); d.set_window_size(700, 620)
try:
    d.get(base + "/login"); d.save_screenshot(f"{out}/login.png")
    d.find_element(By.ID, "username").send_keys("student")
    d.find_element(By.ID, "password").send_keys("Passw0rd!")
    d.find_element(By.ID, "login-btn").click(); d.save_screenshot(f"{out}/secure.png")
    d.get(base + "/logout")
    d.set_window_size(700, 860)
    d.get(base + "/contact")
    d.find_element(By.ID, "name").send_keys("Иван Петров")
    d.find_element(By.ID, "email").send_keys("ivan.example.com")
    d.find_element(By.ID, "submit").click(); d.save_screenshot(f"{out}/contact_errors.png")
    d.get(base + "/contact")
    d.find_element(By.ID, "name").send_keys("Иван Петров")
    d.find_element(By.ID, "email").send_keys("ivan@example.com")
    d.find_element(By.ID, "message").send_keys("Здравствуйте, у меня вопрос по заказу.")
    d.find_element(By.ID, "consent").click(); d.save_screenshot(f"{out}/contact_filled.png")
    d.find_element(By.ID, "submit").click(); d.save_screenshot(f"{out}/contact_success.png")
finally:
    d.quit(); srv.shutdown()
