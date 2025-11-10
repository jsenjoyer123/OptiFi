# 🚀 OptiFi Deployment - Быстрый старт

Полное руководство по развертыванию проекта **novaya-vetka** на Ubuntu VPS с привязкой к домену **рефенансье.рф**.

## 📋 Что было подготовлено

В папке `deploy/` находятся все необходимые файлы для развертывания:

```
deploy/
├── deploy.sh              # Основной скрипт развертывания
├── test-local.sh          # Тестирование локально
├── manage.sh              # Управление приложением
├── nginx.conf             # Конфигурация Nginx
├── .env.production        # Шаблон переменных окружения
├── DEPLOYMENT.md          # Подробное руководство
└── README.md              # Описание файлов в папке
```

## ⚡ Вариант 1: Автоматическое развертывание (рекомендуется)

### На локальной машине

```bash
# 1. Клонируем ветку novaya-vetka
git clone -b novaya-vetka https://github.com/your-repo/OptiFi.git
cd OptiFi

# 2. Делаем скрипты исполняемыми
chmod +x deploy/deploy.sh deploy/test-local.sh deploy/manage.sh

# 3. Опционально: тестируем локально
bash deploy/test-local.sh
```

### На VPS сервере

```bash
# 1. Подключаемся к серверу
ssh root@your-vps-ip

# 2. Запускаем скрипт развертывания (одна команда!)
curl -fsSL https://raw.githubusercontent.com/your-repo/OptiFi/novaya-vetka/deploy/deploy.sh | bash

# 3. Отредактируем .env с вашими credentials
nano /opt/optifi/.env

# 4. Перезагружаем приложение
cd /opt/optifi && docker-compose -f docker-compose.prod.yml restart
```

## ⚙️ Вариант 2: Пошаговое развертывание

### Шаг 1: Подготовка сервера

```bash
ssh root@your-vps-ip

# Обновляем систему
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git build-essential
```

### Шаг 2: Установка Docker

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Проверяем
docker --version
docker-compose --version
```

### Шаг 3: Клонирование проекта

```bash
# Создаем директорию
sudo mkdir -p /opt/optifi
sudo chown $USER:$USER /opt/optifi

# Клонируем ветку novaya-vetka
cd /opt/optifi
git clone -b novaya-vetka https://github.com/your-repo/OptiFi.git .
```

### Шаг 4: Конфигурация

```bash
# Копируем production .env
cp deploy/.env.production .env

# Редактируем с вашими credentials
nano .env

# ВАЖНО! Измените эти переменные:
# POSTGRES_PASSWORD=your-strong-password
# SECRET_KEY=your-long-random-key-min-32-chars
# TEAM_CLIENT_SECRET=your-credentials
# Все CONSENT_ID переменные
```

### Шаг 5: Запуск Docker

```bash
cd /opt/optifi

# Собираем образы
docker-compose -f docker-compose.prod.yml build

# Запускаем контейнеры
docker-compose -f docker-compose.prod.yml up -d

# Проверяем статус
docker-compose -f docker-compose.prod.yml ps

# Смотрим логи
docker-compose -f docker-compose.prod.yml logs -f
```

### Шаг 6: Nginx и SSL

```bash
# Установка Nginx
sudo apt-get install -y nginx

# Копируем конфигурацию
sudo cp /opt/optifi/deploy/nginx.conf /etc/nginx/sites-available/рефенансье.рф

# Активируем
sudo ln -sf /etc/nginx/sites-available/рефенансье.рф /etc/nginx/sites-enabled/рефенансье.рф
sudo rm -f /etc/nginx/sites-enabled/default

# Проверяем и перезагружаем
sudo nginx -t
sudo systemctl restart nginx

# Установка Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Получаем SSL сертификат
sudo certbot --nginx -d рефенансье.рф --non-interactive --agree-tos -m admin@рефенансье.рф

# Автоматическое обновление
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Шаг 7: Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

## ✅ Проверка развертывания

```bash
# На сервере
cd /opt/optifi

# Проверяем статус контейнеров
bash deploy/manage.sh status

# Проверяем здоровье сервисов
bash deploy/manage.sh health

# Смотрим логи
bash deploy/manage.sh logs

# Проверяем в браузере
# https://рефенансье.рф
```

## 🛠️ Управление приложением

После развертывания используйте скрипт `manage.sh`:

```bash
cd /opt/optifi

# Основные команды
bash deploy/manage.sh status          # Статус сервисов
bash deploy/manage.sh logs            # Логи (follow mode)
bash deploy/manage.sh restart         # Перезагрузить все
bash deploy/manage.sh health          # Проверить здоровье
bash deploy/manage.sh backup          # Резервная копия БД
bash deploy/manage.sh update          # Обновить код и перезагрузить

# Логи конкретных сервисов
bash deploy/manage.sh logs-analytics  # Credit Analytics
bash deploy/manage.sh logs-api        # Bank API
bash deploy/manage.sh logs-db         # Database

# Перезагрузка конкретных сервисов
bash deploy/manage.sh restart-analytics
bash deploy/manage.sh restart-api
bash deploy/manage.sh restart-db

# Справка
bash deploy/manage.sh help
```

## 📊 Мониторинг

### Просмотр логов

```bash
# Все логи
cd /opt/optifi && docker-compose -f docker-compose.prod.yml logs -f

# Последние 100 строк
cd /opt/optifi && docker-compose -f docker-compose.prod.yml logs --tail=100

# Конкретный сервис
cd /opt/optifi && docker-compose -f docker-compose.prod.yml logs -f credit-analytics
```

### Проверка ресурсов

```bash
docker stats
```

### Nginx логи

```bash
sudo tail -f /var/log/nginx/optifi_access.log
sudo tail -f /var/log/nginx/optifi_error.log
```

## 🔄 Обновление приложения

```bash
cd /opt/optifi

# Получаем последние изменения
git pull origin novaya-vetka

# Пересобираем образы
docker-compose -f docker-compose.prod.yml build

# Перезагружаем
docker-compose -f docker-compose.prod.yml up -d
```

Или используйте скрипт:

```bash
cd /opt/optifi
bash deploy/manage.sh update
```

## 💾 Резервные копии

### Создание

```bash
cd /opt/optifi
bash deploy/manage.sh backup
# Создаст файл: backup_20250110_120000.sql
```

### Восстановление

```bash
cd /opt/optifi
bash deploy/manage.sh restore backup_20250110_120000.sql
```

## 🐛 Решение проблем

### Контейнеры не запускаются

```bash
# Проверяем логи
cd /opt/optifi && docker-compose -f docker-compose.prod.yml logs

# Проверяем, что порты не заняты
sudo netstat -tlnp | grep -E ':(80|443|8000|8100|5432)'

# Перезагружаем Docker
sudo systemctl restart docker
```

### SSL сертификат не работает

```bash
# Проверяем сертификат
sudo certbot certificates

# Обновляем вручную
sudo certbot renew --dry-run

# Проверяем Nginx
sudo nginx -t
```

### БД не инициализируется

```bash
cd /opt/optifi

# Проверяем логи БД
docker-compose -f docker-compose.prod.yml logs db

# Удаляем volume и пересоздаем
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

### Приложение медленное

```bash
# Проверяем ресурсы
docker stats

# Проверяем ошибки в логах
cd /opt/optifi && docker-compose -f docker-compose.prod.yml logs credit-analytics | grep -i error
```

## 🔐 Безопасность

### Обновление переменных окружения

```bash
nano /opt/optifi/.env
cd /opt/optifi && docker-compose -f docker-compose.prod.yml restart
```

### Регулярные обновления

```bash
# Обновляем систему
sudo apt-get update && sudo apt-get upgrade -y

# Обновляем Docker образы
cd /opt/optifi && docker-compose -f docker-compose.prod.yml pull
cd /opt/optifi && docker-compose -f docker-compose.prod.yml up -d
```

## 📞 Помощь

Для подробной информации смотрите:

- **`deploy/DEPLOYMENT.md`** - Полное руководство
- **`deploy/README.md`** - Описание файлов
- **`README.md`** - Описание проекта

## 🎯 Требования

- Ubuntu 20.04 LTS или выше
- VPS с минимум 2GB RAM
- Доступ по SSH с правами sudo
- Домен рефенансье.рф, указывающий на IP сервера

## 📝 Переменные окружения

Все переменные находятся в файле `.env`:

```bash
# Database
POSTGRES_USER=optifi_user
POSTGRES_PASSWORD=your-strong-password
POSTGRES_DB=optifi_prod

# Security
SECRET_KEY=your-long-random-key-min-32-chars

# Bank API
BANK_CODE=optifi
BANK_NAME=OptiFi Credit Analytics

# Credit Analytics
NODE_ENV=production
PORT=8100
BANK_API_BASE_URL=http://bank:8000

# Team Credentials (from HackAPI)
TEAM_CLIENT_ID=team018
TEAM_CLIENT_SECRET=your-credentials
EXTERNAL_CLIENT_ID=team018-1

# External Banks
VBANK_API_BASE=https://vbank.open.bankingapi.ru
ABANK_API_BASE=https://abank.open.bankingapi.ru
SBANK_API_BASE=https://sbank.open.bankingapi.ru

# Consent IDs
VBANK_PRODUCT_AGREEMENT_CONSENT_ID=your-consent-id
ABANK_PRODUCT_AGREEMENT_CONSENT_ID=your-consent-id
SBANK_PRODUCT_AGREEMENT_CONSENT_ID=your-consent-id
VBANK_ACCOUNT_CONSENT_ID=your-consent-id
SBANK_CONSENT_ID=your-consent-id

# Feature Flags
USE_MOCK_DATA=false
USE_MOCK_EXTERNAL_BANKS=false
```

## ✨ Успешное развертывание!

После завершения всех шагов ваше приложение будет доступно по адресу:

```
https://рефенансье.рф
```

**Поздравляем! 🎉 OptiFi успешно развернут на вашем VPS!**

---

**Дата подготовки:** 2025-01-10
**Версия:** 1.0
**Ветка:** novaya-vetka
