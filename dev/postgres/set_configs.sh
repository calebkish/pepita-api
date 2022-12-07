#!/usr/bin/env sh

# This file is meant to be run in the postgres docker container. Don't run this on your host machine.

set -e
psql -v ON_ERROR_STOP=1 --username "postgres" --dbname "postgres" <<-EOSQL
    CREATE USER ${PG_DB_NAME};
    CREATE DATABASE ${PG_DB_NAME};
    GRANT ALL PRIVILEGES ON DATABASE ${PG_DB_NAME} TO ${PG_DB_NAME};
EOSQL

psql -v ON_ERROR_STOP=1 --username "${PG_DB_NAME}" --dbname "${PG_DB_NAME}" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
EOSQL

rm -rf /var/lib/postgresql/data/postgresql.conf
rm -rf /var/lib/postgresql/data/pg_hba.conf
cp /tmp/postgresql.conf /var/lib/postgresql/data/postgresql.conf
cp /tmp/pg_hba.conf /var/lib/postgresql/data/pg_hba.conf
