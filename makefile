stand:
	py stand/app.py
12app: 
	cd lab1_2 ; npm i ; npm run dev
3:
	py -m pytest -v lab3
4:
	py -m pytest -v lab4
5:
	py -m pytest -v lab5
6:
	py -m pytest -v lab6 --cov=lab6.calculator --cov-report=term-missing
7:
	py lab7/appium_clock_tap.py
8_10:
	k6 run --vus 10 --duration 30s lab8/load_test.js
8_50:
	k6 run --vus 50 --duration 30s lab8/load_test.js

.PHONY: stand 3 4 5 6 8_10 8_50