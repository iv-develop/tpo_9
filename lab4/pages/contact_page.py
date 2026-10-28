from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select

from lab4.pages.base_page import BasePage


class ContactPage(BasePage):
    PATH = "/contact"

    NAME = (By.ID, "name")
    EMAIL = (By.ID, "email")
    PHONE = (By.ID, "phone")
    TOPIC = (By.ID, "topic")
    MESSAGE = (By.ID, "message")
    CONSENT = (By.ID, "consent")
    SUBMIT = (By.ID, "submit")
    SUCCESS = (By.ID, "success-message")

    def error_locator(self, field):
        return (By.ID, f"{field}-error")

    def fill_form(self, name="", email="", message="", phone="", topic=None, consent=True):
        self.type(self.NAME, name)
        self.type(self.EMAIL, email)
        self.type(self.PHONE, phone)
        if topic:
            Select(self.find(self.TOPIC)).select_by_visible_text(topic)
        self.type(self.MESSAGE, message)
        checkbox = self.find(self.CONSENT)
        if checkbox.is_selected() != consent:
            checkbox.click()
        return self

    def submit(self):
        self.click(self.SUBMIT)
        return self

    def success_visible(self):
        return self.is_visible(self.SUCCESS)

    def success_text(self):
        return self.text_of(self.SUCCESS)

    def error_text(self, field):
        return self.text_of(self.error_locator(field))
