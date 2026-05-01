cd ..
docker rm -f $(docker ps -aq)
docker compose down -v --rmi all
docker system prune -a --volumes -f


