# ShuWeiChess
a game about chess

# 构建项目：
docker build -t chess .

# 运行容器：
docker run -dp 3001:3001 --name chess --restart=always chess
