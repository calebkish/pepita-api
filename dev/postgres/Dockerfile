FROM postgres:12.6-alpine
COPY postgresql.conf /tmp/
COPY pg_hba.conf /tmp/
COPY set_configs.sh /docker-entrypoint-initdb.d/
