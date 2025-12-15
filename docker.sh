# docker stop sample-app-container
# docker rm sample-app-container
docker-compose down -v
# docker build -t sample-app .
# docker run -d -p 3000:3000 --name sample-app-container sample-app
# docker logs sample-app-container
docker-compose up -d --build
docker image prune -a
docker-compose logs -f