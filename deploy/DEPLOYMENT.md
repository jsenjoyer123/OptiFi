# OptiFi Deployment Guide

Полное руководство по развертыванию OptiFi на Ubuntu VPS с привязкой к домену рефенансье.рф.

## 📋 Предварительные требования

- Ubuntu 20.04 LTS или выше
- VPS сервер с минимум 2GB RAM
- Доступ по SSH с правами sudo
- Домен рефенансье.рф, указывающий на IP адрес сервера
- Git установлен на локальной машине

## 🚀 Быстрое развертывание (5 минут)

### 1. Подготовка на локальной машине

```bash
# Клонируем ветку novaya-vetka
git clone -b novaya-vetka https://github.com/your-repo/OptiFi.git
cd OptiFi

# Делаем скрипты исполняемыми
chmod +x deploy/deploy.sh
chmod +x deploy/test-local.sh
```

### 2. Тестирование локально (опционально)

```bash
# Тестируем Docker конфигурацию локально
bash deploy/test-local.sh

# Отредактируйте .env если нужно
nano .env
```

### 3. Развертывание на VPS

```bash
# Подключаемся к серверу
ssh root@your-vps-ip

# Скачиваем и запускаем скрипт развертывания
curl -fsSL https://raw.githubusercontent.com/your-repo/OptiFi/novaya-vetka/deploy/deploy.sh | bash

# Или если скрипт уже на сервере:
bash /opt/optifi/deploy/deploy.sh
```

## 📝 Пошаговое развертывание

### Шаг 1: Подготовка сервера

```bash
# Подключаемся к серверу
ssh root@your-vps-ip

# Обновляем систему
sudo apt-get update
sudo apt-get upgrade -y

# Устанавливаем необходимые пакеты
sudo apt-get install -y curl wget git build-essential
```

### Шаг 2: Установка Docker и Docker Compose

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Проверяем установку
docker --version
docker-compose --version
```

### Шаг 3: Клонирование репозитория

```bash
# Создаем директорию приложения
sudo mkdir -p /opt/optifi
sudo chown $USER:$USER /opt/optifi

# Клонируем ветку novaya-vetka
cd /opt/optifi
git clone -b novaya-vetka https://github.com/your-repo/OptiFi.git .
```

### Шаг 4: Конфигурация окружения

```bash
# Копируем production .env
cp deploy/.env.production .env

# Редактируем .env с вашими credentials
nano .env

# Важные переменные для изменения:
# - POSTGRES_PASSWORD: сильный пароль для БД
# - SECRET_KEY: длинный случайный ключ (минимум 32 символа)
# - TEAM_CLIENT_SECRET: ваши credentials из HackAPI
# - Все CONSENT_ID переменные
```

### Шаг 5: Запуск Docker контейнеров

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

### Шаг 6: Установка и конфигурация Nginx

```bash
# Установка Nginx
sudo apt-get install -y nginx

# Копируем конфигурацию
sudo cp /opt/optifi/deploy/nginx.conf /etc/nginx/sites-available/рефенансье.рф

# Активируем конфигурацию
sudo ln -sf /etc/nginx/sites-available/рефенансье.рф /etc/nginx/sites-enabled/рефенансье.рф

# Удаляем default конфигурацию
sudo rm -f /etc/nginx/sites-enabled/default

# Проверяем конфигурацию
sudo nginx -t

# Перезагружаем Nginx
sudo systemctl restart nginx
```

### Шаг 7: Установка SSL сертификата

```bash
# Установка Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Получаем SSL сертификат
sudo certbot --nginx -d рефенансье.рф --non-interactive --agree-tos -m admin@рефенансье.рф

# Проверяем автоматическое обновление
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Шаг 8: Конфигурация Firewall

```bash
# Включаем UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Проверяем статус
sudo ufw status
```

## 🔍 Проверка развертывания

```bash
# Проверяем, что все контейнеры запущены
docker-compose -f docker-compose.prod.yml ps

# Проверяем логи приложения
docker-compose -f docker-compose.prod.yml logs -f credit-analytics

# Проверяем здоровье приложения
curl https://рефенансье.рф/health

# Проверяем Nginx логи
sudo tail -f /var/log/nginx/optifi_access.log
sudo tail -f /var/log/nginx/optifi_error.log
```

## 📊 Мониторинг и обслуживание

### Просмотр логов

```bash
# Все контейнеры
docker-compose -f docker-compose.prod.yml logs -f

# Конкретный контейнер
docker-compose -f docker-compose.prod.yml logs -f credit-analytics

# Последние N строк
docker-compose -f docker-compose.prod.yml logs --tail=100 credit-analytics
```

### Перезагрузка приложения

```bash
cd /opt/optifi

# Перезагружаем контейнеры
docker-compose -f docker-compose.prod.yml restart

# Или пересобираем и перезагружаем
docker-compose -f docker-compose.prod.yml up -d --build
```

### Обновление кода

```bash
cd /opt/optifi

# Получаем последние изменения
git pull origin novaya-vetka

# Пересобираем образы
docker-compose -f docker-compose.prod.yml build

# Перезагружаем контейнеры
docker-compose -f docker-compose.prod.yml up -d
```

### Резервная копия БД

```bash
# Создаем резервную копию
docker-compose -f docker-compose.prod.yml exec db pg_dump -U optifi_user optifi_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстанавливаем из резервной копии
docker-compose -f docker-compose.prod.yml exec -T db psql -U optifi_user optifi_prod < backup_20250110_120000.sql
```

## 🐛 Решение проблем

### Проблема: Контейнеры не запускаются

```bash
# Проверяем логи
docker-compose -f docker-compose.prod.yml logs

# Проверяем, что порты не заняты
sudo netstat -tlnp | grep -E ':(80|443|8000|8100|5432)'

# Перезагружаем Docker
sudo systemctl restart docker
```

### Проблема: SSL сертификат не работает

```bash
# Проверяем сертификат
sudo certbot certificates

# Обновляем сертификат вручную
sudo certbot renew --dry-run

# Проверяем Nginx конфигурацию
sudo nginx -t
```

### Проблема: БД не инициализируется

```bash
# Проверяем логи БД
docker-compose -f docker-compose.prod.yml logs db

# Удаляем volume и пересоздаем
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

### Проблема: Приложение медленное

```bash
# Проверяем использование ресурсов
docker stats

# Проверяем логи приложения на ошибки
docker-compose -f docker-compose.prod.yml logs credit-analytics | grep -i error
```

## 🔐 Безопасность

### Обновление переменных окружения

```bash
# Редактируем .env
nano /opt/optifi/.env

# Перезагружаем контейнеры для применения изменений
docker-compose -f docker-compose.prod.yml restart
```

### Регулярные обновления

```bash
# Обновляем систему
sudo apt-get update && sudo apt-get upgrade -y

# Обновляем Docker образы
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Мониторинг безопасности

```bash
# Проверяем открытые порты
sudo ss -tlnp

# Проверяем логи безопасности
sudo tail -f /var/log/auth.log

# Проверяем Nginx логи на подозрительную активность
sudo grep "error" /var/log/nginx/optifi_error.log
```

## 📞 Поддержка

Если у вас возникли проблемы:

1. Проверьте логи: `docker-compose -f docker-compose.prod.yml logs`
2. Убедитесь, что DNS правильно указывает на сервер
3. Проверьте, что все порты открыты в firewall
4. Проверьте, что .env содержит правильные credentials

## 🎉 Успешное развертывание!

После завершения всех шагов ваше приложение должно быть доступно по адресу:

```
https://рефенансье.рф
```

Поздравляем с успешным развертыванием OptiFi! 🚀
