# Управление каталогом продуктов

## Создание кредитного продукта через Banker API

1. Получите токен команды:
   ```bash
   export TEAM_TOKEN=$(curl -sS -X POST "http://localhost:8080/auth/bank-token" \
     --data-urlencode "client_id=team018" \
     --data-urlencode "client_secret=d78xBRvntBFr6FkxVHLRrfcWXte25QoM" \
     | jq -r '.access_token')
   ```

2. Создайте продукт через `POST /banker/products` (параметры передаются как query string):
   ```bash
   curl -X POST "http://localhost:8080/banker/products" \
     -G \
     -H "Authorization: Bearer $TEAM_TOKEN" \
     --data-urlencode "product_type=loan" \
     --data-urlencode "name=Суперкредит 5%" \
     --data-urlencode "interest_rate=5.0" \
     --data-urlencode "min_amount=100000"
   ```

3. В ответе придёт идентификатор продукта:
   ```json
   {"product_id":"prod-51312583f145","status":"created"}
   ```

4. После этого продукт будет показан в `http://localhost:8080/banker/products.html` и станет доступен микросервису рефинансирования.
