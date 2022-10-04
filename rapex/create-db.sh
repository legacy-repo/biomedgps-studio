#!/bin/bash
# WARNING
# The create-db.sh file is used for local postgres database.
# This file is listed in .gitignore and will be excluded from version control by Git.
# set -e # exit immediately if a command exits with a non-zero status.

db_name=$1
db_port=$2

function create_db() {
  export PGPASSWORD=password
  POSTGRES="psql -h localhost -p $2 --username postgres"

  if [ -z "$1" ]; then
    database="rapex_dev"
  else
    database="$1"
  fi

  # create database for superset
  $POSTGRES <<EOSQL
CREATE DATABASE $database OWNER postgres;
EOSQL
}

printf "Stop "
docker stop $db_name
printf "Clean "
docker rm $db_name
printf "\nLaunch postgres database...(default password: password)\n"
docker run --name $db_name -e POSTGRES_PASSWORD=password -e POSTGRES_USER=postgres -p 54320:5432 -d postgres:10.0
sleep 3
echo "Create database: rapex_dev"
create_db $db_name $db_port
