FROM node:20-alpine AS development-dependencies-env
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM development-dependencies-env AS production-dependencies-env
RUN npm ci --omit=dev

FROM development-dependencies-env AS build-env
COPY . .
RUN npm run build

FROM node:20-alpine
EXPOSE 3001
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
COPY --from=build-env /app/package.json /app/package.json
WORKDIR /app
CMD ["npm", "start"]