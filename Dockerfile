FROM node:25-alpine AS build

WORKDIR /app

COPY ./sample-app/package*.json ./

RUN npm install --frozen-lockfile

COPY ./sample-app .

RUN npm run build

FROM nginx:trixie-perl

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
