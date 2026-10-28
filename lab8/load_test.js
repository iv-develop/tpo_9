import http from 'k6/http';
import { check, sleep } from 'k6';

// Адрес можно переопределить: k6 run -e BASE_URL=http://host:port lab8/load_test.js
const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:5000';

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'],     // не более 1% ошибок
    http_req_duration: ['p(95)<500'],   // 95% запросов быстрее 500 мс
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/items`);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'body contains 20 items': (r) => r.json().length === 20,
  });
  sleep(1);
}
