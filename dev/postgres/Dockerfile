FROM postgres:15.2-alpine
COPY postgresql.conf /tmp/
COPY pg_hba.conf /tmp/
COPY set_configs.sh /docker-entrypoint-initdb.d/
