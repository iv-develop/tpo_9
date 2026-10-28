import pytest

from lab6.calculator import Calculator


@pytest.fixture
def calc():
    return Calculator()


@pytest.mark.parametrize("a, b, expected", [
    (2, 3, 5), (-2, 3, 1), (-2, -3, -5), (0, 0, 0), (2.5, 0.5, 3.0), (10**12, 1, 10**12 + 1),
])
def test_add(calc, a, b, expected):
    assert calc.add(a, b) == expected


def test_add_floats_with_precision(calc):
    assert calc.add(0.1, 0.2) == pytest.approx(0.3)


@pytest.mark.parametrize("a, b, expected", [
    (5, 3, 2), (3, 5, -2), (-3, -5, 2), (0, 7, -7), (1.5, 0.5, 1.0),
])
def test_subtract(calc, a, b, expected):
    assert calc.subtract(a, b) == expected


@pytest.mark.parametrize("a, b, expected", [
    (4, 3, 12), (-4, 3, -12), (-4, -3, 12), (0, 99, 0), (2.5, 2, 5.0),
])
def test_multiply(calc, a, b, expected):
    assert calc.multiply(a, b) == expected


@pytest.mark.parametrize("a, b, expected", [
    (6, 3, 2), (7, 2, 3.5), (-6, 3, -2), (-6, -3, 2), (0, 5, 0), (1, 3, pytest.approx(0.3333, rel=1e-3)),
])
def test_divide(calc, a, b, expected):
    assert calc.divide(a, b) == expected


@pytest.mark.parametrize("a", [1, -1, 0, 3.5])
def test_divide_by_zero_raises(calc, a):
    with pytest.raises(ZeroDivisionError, match="Деление на ноль"):
        calc.divide(a, 0)


@pytest.mark.parametrize("n, expected", [
    (-7, False), (0, False), (1, False), (2, True), (3, True), (4, False), (9, False),
    (17, True), (25, False), (97, True), (100, False), (7919, True),
])
def test_is_prime_number(calc, n, expected):
    assert calc.is_prime_number(n) is expected


@pytest.mark.parametrize("bad", [2.5, "7", None, True])
def test_is_prime_number_wrong_type(calc, bad):
    with pytest.raises(TypeError):
        calc.is_prime_number(bad)

