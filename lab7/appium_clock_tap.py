"""Лабораторная 7: Appium + Python. Запускает приложение «Часы» на реальном телефоне."""
from appium import webdriver
from appium.options.android import UiAutomator2Options
from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

options = UiAutomator2Options()
options.platform_name = "Android"
options.automation_name = "UiAutomator2"

# 1. Привязка к вашему реальному телефону
options.udid = "P2126S001817"
options.device_name = "Nothing Phone (1)"

options.app_package = "com.google.android.deskclock"          # приложение «Часы»
options.app_activity = "com.android.deskclock.DeskClock"
options.no_reset = True

driver = webdriver.Remote("http://127.0.0.1:4723", options=options)
try:
    wait = WebDriverWait(driver, 15)

    # Стабильный селектор по ID элемента вкладки (не зависит от языка системы)
    # На русском в content-desc написано "Таймеры" (во мн. числе)
    tab_locator = (
        AppiumBy.XPATH,
        "//*[@resource-id='com.google.android.deskclock:id/tab_menu_timer' "
        "or @content-desc='Таймеры' or @content-desc='Timer' or @content-desc='Timers']"
    )
    timer_tab = wait.until(EC.element_to_be_clickable(tab_locator))
    timer_tab.click()

    selected = timer_tab.get_attribute("selected")
    print("Вкладка «Таймеры» выбрана:", selected)
    assert selected == "true"
finally:
    driver.quit()

