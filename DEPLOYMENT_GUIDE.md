# Руководство по развертыванию OptiFi

Этот документ описывает шаги для развертывания проекта OptiFi на сервере Ubuntu.

## 1. Подготовка сервера

Сначала необходимо обновить систему и установить ключевые зависимости: Docker для контейнеризации, Nginx в качестве веб-сервера и Certbot для SSL-сертификатов.

```bash
# Обновление пакетов
sudo apt-get update && sudo apt-get upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER # Добавить пользователя в группу docker
rm get-docker.sh
# Важно: после этого требуется перезайти на сервер (новая SSH-сессия)

# Установка Docker Compose, Nginx и Certbot
sudo apt-get install -y docker-compose-plugin nginx certbot python3-certbot-nginx
```

## 2. Настройка проекта

Проект разворачивается из Git-репозитория.

```bash
# Создание директории и клонирование проекта
sudo mkdir -p /opt/optifi
sudo chown $USER:$USER /opt/optifi
cd /opt/optifi
git clone -b novaya-vetka https://github.com/jsenjoyer123/OptiFi.git .

# Если проект уже был склонирован, обновите его
git pull origin novaya-vetka
```

## 3. Конфигурация окружения

Для работы приложения необходимы переменные окружения, которые хранятся в файле `.env`.

1.  **Создайте файл `.env`** в корне проекта (`/opt/optifi/.env`).
2.  **Заполните его** необходимыми данными. Обязательно укажите надежные `POSTGRES_PASSWORD` и `SECRET_KEY`.

```bash
# Пример команды для создания .env
cat <<'EOF' > /opt/optifi/.env
# --- Database Settings ---
POSTGRES_USER=bankuser
POSTGRES_PASSWORD=ВАШ_СИЛЬНЫЙ_ПАРОЛЬ
POSTGRES_DB=optifi_prod

# --- Bank API Settings ---
SECRET_KEY=ВАШ_ДЛИННЫЙ_СЕКРЕТНЫЙ_КЛЮЧ
# ... и другие переменные
EOF
```

## 4. Запуск приложения

Приложение запускается с помощью Docker Compose, который читает конфигурацию из `docker-compose.prod.yml`.

```bash
# Перейдите в директорию проекта
cd /opt/optifi

# Сборка образов и запуск контейнеров в фоновом режиме
sudo docker compose -f docker-compose.prod.yml up --build -d
```

После выполнения этой команды будут запущены три контейнера: `optifi-db-prod` (база данных), `optifi-api-prod` (бэкенд) и `optifi-credit-analytics-prod` (микросервис).

## 5. Настройка веб-сервера (Nginx) и SSL

Nginx используется как обратный прокси (reverse proxy) для направления трафика на работающие контейнеры.

1.  **Создайте конфигурационный файл для Nginx:**
    Скопируйте или создайте файл `/etc/nginx/sites-available/рефенансье.рф` (заменив домен на ваш) с настройками для проксирования запросов.

2.  **Активируйте конфигурацию:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/рефенансье.рф /etc/nginx/sites-enabled/
    sudo rm /etc/nginx/sites-enabled/default
    sudo nginx -t # Проверка синтаксиса
    sudo systemctl restart nginx
    ```

3.  **Получите SSL-сертификат:**
    ```bash
    # Замените домен и email на ваши
    sudo certbot --nginx -d рефенансье.рф --non-interactive --agree-tos -m admin@рефенансье.рф
    ```

## 6. Настройка брандмауэра

Откройте порты для веб-трафика и SSH.

```bash
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw --force enable
```

После выполнения всех шагов ваше приложение будет развернуто и доступно по вашему домену.
