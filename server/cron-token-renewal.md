# Cron job para renovar automáticamente el token de Google Sheets
# Se ejecuta el primer día de cada mes a las 2:00 AM

# Agregar esta línea al crontab:
# 0 2 1 * * cd /path/to/your/project/server && node renovar-token-automatico.js >> logs/token-renewal.log 2>&1

# Para Windows (Task Scheduler):
# - Crear una tarea programada que ejecute:
#   node renovar-token-automatico.js
# - Configurar para ejecutarse mensualmente

# Para Docker:
# - Agregar al docker-compose.yml:
#   cron-job:
#     image: node:18-alpine
#     volumes:
#       - ./server:/app
#     command: >
#       sh -c "
#         echo '0 2 1 * * cd /app && node renovar-token-automatico.js' | crontab -
#         crond -f
#       "
