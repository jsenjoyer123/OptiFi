# Получение договоров клиента через Open Banking

Ниже собран пошаговый сценарий для команды `team018`, позволяющий выгрузить договоры клиента `team018-1` из банков VBank, ABank и SBank.

## Общие переменные окружения

```bash
export TEAM_CLIENT_ID=team018
export TEAM_CLIENT_SECRET=d78xBRvntBFr6FkxVHLRrfcWXte25QoM
export CLIENT_ID=team018-1
```

## VBank

```bash
# 1. Получаем командный токен
export TEAM_TOKEN_VBANK=$(curl -s -G "https://vbank.open.bankingapi.ru/auth/bank-token" \
  --data-urlencode "client_id=$TEAM_CLIENT_ID" \
  --data-urlencode "client_secret=$TEAM_CLIENT_SECRET" | jq -r '.access_token')

# 2. Запрашиваем consent (автоодобрение)
curl -s -X POST "https://vbank.open.bankingapi.ru/product-agreement-consents/request?client_id=$CLIENT_ID" \
  -H "Authorization: Bearer $TEAM_TOKEN_VBANK" \
  -H "Content-Type: application/json" \
  -d '{
        "requesting_bank": "team018",
        "client_id": "'"$CLIENT_ID"'",
        "read_product_agreements": true,
        "open_product_agreements": false,
        "close_product_agreements": false,
        "allowed_product_types": ["deposit","card","loan"],
        "reason": "Агрегатор команды team018"
      }' | jq

# 3. Сохраняем consent ID
export VBANK_PRODUCT_AGREEMENT_CONSENT_ID=pagc-1ba3070c51e5

# 4. Получаем договоры
curl -s "https://vbank.open.bankingapi.ru/product-agreements" \
  -H "Authorization: Bearer $TEAM_TOKEN_VBANK" \
  -H "x-requesting-bank: team018" \
  -H "x-product-agreement-consent-id: $VBANK_PRODUCT_AGREEMENT_CONSENT_ID" \
  -G --data-urlencode "client_id=$CLIENT_ID" | jq
```

Пример ответа (сокращённо):

```json
{
  "data": [
    {
      "agreement_id": "agr-2f189c66585e",
      "product_name": "Ипотека VBank 9.3%",
      "product_type": "loan",
      "amount": 1800000.0,
      "status": "active",
      "start_date": "2025-11-06T19:11:27.212166",
      "end_date": "2045-07-24T19:11:27.209950",
      "account_number": "455d5d7a74bb3be416"
    }
  ],
  "meta": { "total": 2 }
}
```

## ABank

```bash
# 1. Токен команды
export TEAM_TOKEN_ABANK=$(curl -s -G "https://abank.open.bankingapi.ru/auth/bank-token" \
  --data-urlencode "client_id=$TEAM_CLIENT_ID" \
  --data-urlencode "client_secret=$TEAM_CLIENT_SECRET" | jq -r '.access_token')

# 2. Запрашиваем consent (автоодобрение)
curl -s -X POST "https://abank.open.bankingapi.ru/product-agreement-consents/request?client_id=$CLIENT_ID" \
  -H "Authorization: Bearer $TEAM_TOKEN_ABANK" \
  -H "Content-Type: application/json" \
  -d '{
        "requesting_bank": "team018",
        "client_id": "'"$CLIENT_ID"'",
        "read_product_agreements": true,
        "open_product_agreements": false,
        "close_product_agreements": false,
        "allowed_product_types": ["deposit","card","loan"],
        "reason": "Агрегатор команды team018"
      }' | jq

# 3. Сохраняем consent ID
export ABANK_PRODUCT_AGREEMENT_CONSENT_ID=pagc-bec67e156704

# 4. Получаем договоры
curl -s "https://abank.open.bankingapi.ru/product-agreements" \
  -H "Authorization: Bearer $TEAM_TOKEN_ABANK" \
  -H "x-requesting-bank: team018" \
  -H "x-product-agreement-consent-id: $ABANK_PRODUCT_AGREEMENT_CONSENT_ID" \
  -G --data-urlencode "client_id=$CLIENT_ID" | jq
```

Ответ (сокращённо):

```json
{
  "data": [
    {
      "agreement_id": "agr-7813df17497b",
      "product_name": "Экспресс кредит 14.2%",
      "product_type": "loan",
      "amount": 420000.0,
      "status": "active",
      "start_date": "2025-11-06T19:10:56.486107",
      "end_date": "2029-10-16T19:10:56.480296",
      "account_number": "455dc2b060e5942402"
    }
  ],
  "meta": { "total": 1 }
}
```

## SBank

```bash
# 1. Токен команды
export TEAM_TOKEN_SBANK=$(curl -s -G "https://sbank.open.bankingapi.ru/auth/bank-token" \
  --data-urlencode "client_id=$TEAM_CLIENT_ID" \
  --data-urlencode "client_secret=$TEAM_CLIENT_SECRET" | jq -r '.access_token')

# 2. Запрос consent (требуется подпись клиента)
curl -s -X POST "https://sbank.open.bankingapi.ru/product-agreement-consents/request?client_id=$CLIENT_ID" \
  -H "Authorization: Bearer $TEAM_TOKEN_SBANK" \
  -H "Content-Type: application/json" \
  -d '{
        "requesting_bank": "team018",
        "client_id": "'"$CLIENT_ID"'",
        "read_product_agreements": true,
        "open_product_agreements": false,
        "close_product_agreements": false,
        "allowed_product_types": ["deposit","card","loan"],
        "reason": "Агрегатор команды team018"
      }' | jq

# 3. Подписываем запрос от имени клиента
export SBANK_CLIENT_TOKEN=<JWT_клиента_из_.env>
export REQUEST_ID=pagcr-8e8a8b860ece  # значение из шага 2

curl -s -X POST "https://sbank.open.bankingapi.ru/product-agreement-consents/sign" \
  -H "Authorization: Bearer $SBANK_CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "request_id": "'"$REQUEST_ID"'",
        "action": "approve",
        "signature": "password"
      }' | jq

# 4. Сохраняем consent ID
export SBANK_PRODUCT_AGREEMENT_CONSENT_ID=pagc-00293a4eafc4

# 5. Получаем договоры
curl -s "https://sbank.open.bankingapi.ru/product-agreements" \
  -H "Authorization: Bearer $TEAM_TOKEN_SBANK" \
  -H "x-requesting-bank: team018" \
  -H "x-product-agreement-consent-id: $SBANK_PRODUCT_AGREEMENT_CONSENT_ID" \
  -G --data-urlencode "client_id=$CLIENT_ID" | jq
```

Пример ответа:

```json
{
  "data": [
    {
      "agreement_id": "agr-f38d911ad4d9",
      "product_name": "Автокредит Smart 11.9%",
      "product_type": "loan",
      "amount": 380000.0,
      "status": "active",
      "start_date": "2025-11-06T19:11:17.849777",
      "end_date": "2028-04-24T19:11:17.847578",
      "account_number": "45560441e630fef44a"
    }
  ],
  "meta": { "total": 2 }
}
```

## Что важно сохранить

* `TEAM_TOKEN_*` — токены каждого банка (валидны 24 часа).
* `VBANK_PRODUCT_AGREEMENT_CONSENT_ID`, `ABANK_PRODUCT_AGREEMENT_CONSENT_ID`, `SBANK_PRODUCT_AGREEMENT_CONSENT_ID` — согласия на выдачу договоров.
* Для SBank требуется клиентский JWT (`SBANK_CLIENT_TOKEN`) и ручное подтверждение согласия.

Эти значения уже добавлены в `OptiFi/.env`. Документ пригодится для замены моковых данных в микросервисе `microservices/credit-analytics-backend/` и автоматизации интеграции с Open Banking.
