class Calculator:
    """Класс с бизнес-логикой для модульного тестирования."""

    def add(self, a, b):
        return a + b

    def subtract(self, a, b):
        return a - b

    def multiply(self, a, b):
        return a * b

    def divide(self, a, b):
        if b == 0:
            raise ZeroDivisionError("Деление на ноль невозможно")
        return a / b

    def is_prime_number(self, n):
        if isinstance(n, bool) or not isinstance(n, int):
            raise TypeError("Аргумент должен быть целым числом")
        if n < 2:
            return False
        if n % 2 == 0:
            return n == 2
        divisor = 3
        while divisor * divisor <= n:
            if n % divisor == 0:
                return False
            divisor += 2
        return True
