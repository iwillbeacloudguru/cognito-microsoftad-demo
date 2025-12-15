FROM node:18-alpine AS build
WORKDIR /app
COPY sample-app/package*.json ./
RUN npm install
COPY sample-app/src ./src
COPY sample-app/public ./public
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
CMD ["nginx", "-g", "daemon off;"]