import itertools

import pytest

from lab4.pages.contact_page import ContactPage

VALID = dict(name="Вадим Потапов", email="vadim@example.com",
             message="Здравствуйте, у меня вопрос по заказу.", consent=True)
INVALID = dict(name="", email="vadim.example.com", message="Коротко", consent=False)
ERRORS = {
    "name": "Введите имя",
    "email": "Введите корректный email",
    "message": "Сообщение должно содержать не менее 10 символов",
    "consent": "Необходимо согласие на обработку данных",
}


@pytest.fixture
def page(driver, base_url):
    return ContactPage(driver, base_url).open()


def test_positive_valid_form_is_sent(page):
    page.fill_form(**VALID, phone="+79991234567", topic="Вопрос").submit()
    assert page.success_visible()
    assert page.success_text() == "Спасибо! Ваше сообщение отправлено."


def test_negative_empty_required_name(page):
    page.fill_form(**{**VALID, "name": ""}).submit()
    assert page.error_text("name") == "Введите имя"
    assert not page.success_visible()


# Матрица принятия решений: 4 обязательных поля x {валидно, невалидно} = 16 комбинаций
COMBINATIONS = list(itertools.product([True, False], repeat=4))
FIELDS = ["name", "email", "message", "consent"]


def combo_id(combo):
    return "".join(f[0].upper() + ("+" if ok else "-") for f, ok in zip(FIELDS, combo))


@pytest.mark.parametrize("combo", COMBINATIONS, ids=[combo_id(c) for c in COMBINATIONS])
def test_decision_matrix(page, combo):
    data = {f: (VALID if ok else INVALID)[f] for f, ok in zip(FIELDS, combo)}
    page.fill_form(**data).submit()
    assert page.success_visible() == all(combo)
    for field, ok in zip(FIELDS, combo):
        expected = "" if ok else ERRORS[field]
        assert page.error_text(field) == expected, f"поле {field}"


@pytest.mark.parametrize("phone, ok", [
    ("", True), ("+79991234567", True), ("89991234567", True),
    ("12345", False), ("abc", False), ("+7 999 123", False),
])
def test_optional_phone(page, phone, ok):
    page.fill_form(**VALID, phone=phone).submit()
    assert page.success_visible() == ok
    assert page.error_text("phone") == ("" if ok else "Некорректный номер телефона")
