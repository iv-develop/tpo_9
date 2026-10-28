import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


def do_login(driver, base_url, username, password):
    driver.get(f"{base_url}/login")
    driver.find_element(By.ID, "username").send_keys(username)
    driver.find_element(By.ID, "password").send_keys(password)
    driver.find_element(By.ID, "login-btn").click()


def test_valid_login_shows_logout(driver, base_url):
    do_login(driver, base_url, "student", "Passw0rd!")
    logout = WebDriverWait(driver, 5).until(
        EC.visibility_of_element_located((By.ID, "logout")))
    assert logout.text == "Logout"
    assert driver.current_url.endswith("/secure")


@pytest.mark.parametrize("username, password", [
    ("student", "wrong"),
    ("unknown", "Passw0rd!"),
    ("", ""),
])
def test_invalid_login_shows_error(driver, base_url, username, password):
    do_login(driver, base_url, username, password)
    flash = WebDriverWait(driver, 5).until(
        EC.visibility_of_element_located((By.ID, "flash")))
    assert flash.text == "Неверный логин или пароль"
    assert not driver.find_elements(By.ID, "logout")
