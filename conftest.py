import threading
import os

import pytest
from werkzeug.serving import make_server

from stand.app import app

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service



def create_driver():
    options = Options()
    if os.getenv("HEADLESS", "1") == "1":
        options.add_argument("--headless=new")
    options.add_argument("--window-size=1280,900")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--lang=ru")
    if os.getenv("CHROME_BINARY"):                      # нестандартное расположение браузера
        options.binary_location = os.environ["CHROME_BINARY"]
        for arg in ("--disable-gpu", "--single-process", "--no-zygote"):
            options.add_argument(arg)

    driver_path = os.getenv("CHROMEDRIVER_PATH")
    if not driver_path:                                  # обычный случай: webdriver-manager сам скачает драйвер
        from webdriver_manager.chrome import ChromeDriverManager
        driver_path = ChromeDriverManager().install()

    driver = webdriver.Chrome(service=Service(driver_path), options=options)
    driver.implicitly_wait(0)
    return driver


@pytest.fixture(scope="session")
def base_url():
    """Поднимает тестовый стенд на свободном порту на время всей сессии."""
    server = make_server("127.0.0.1", 0, app, threaded=True)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{server.server_port}"
    server.shutdown()


@pytest.fixture
def driver():
    drv = create_driver()
    yield drv
    drv.quit()


