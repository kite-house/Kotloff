FROM nginx:alpine

# Создаем директорию если её нет
RUN mkdir -p /usr/share/nginx/html

# Копируем файлы с подробным выводом
COPY . /usr/share/nginx/html/

# Проверяем что скопировалось (для отладки)
RUN ls -la /usr/share/nginx/html/ && \
    echo "Contents of /usr/share/nginx/html:" && \
    find /usr/share/nginx/html -type f | head -20

# Устанавливаем права
RUN chmod -R 755 /usr/share/nginx/html

# Заменяем дефолтную конфигурацию
RUN rm -f /etc/nginx/conf.d/default.conf

# Создаем свою конфигурацию
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    autoindex off; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80