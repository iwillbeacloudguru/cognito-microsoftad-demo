FROM postgres:16-alpine

ENV POSTGRES_DB=mfa_demo
ENV POSTGRES_USER=mfa_user
ENV POSTGRES_PASSWORD=mfa_password

COPY init.sql /docker-entrypoint-initdb.d/

EXPOSE 5432
