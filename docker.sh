docker stop sample-app-container
docker rm sample-app-container
docker build --no-cache -t sample-app .
docker run -d -p 3000:3000 --name sample-app-container sample-app
docker logs sample-app-container
