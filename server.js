/// <reference path="Chess/Scripts/MyScripts/socket.io.js" />
/*********************************
              服务器
**********************************/
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    rooms = new Int32Array(1000),
    players = [];
var r = express();
app.use('/', express.static(__dirname + '/Chess'));
//server.listen(9000);
server.listen(process.env.PORT || 3000);
console.log("启动成功");
//socket部分
io.on('connection', function (socket) {
    //登陆
    socket.on('login', function (roomId) {
        //判断输入房间号是否有效
        if (!publicFun.JudgeRoomId(roomId)) {
            socket.emit('loginError', '房间号必须在1~100之间');
            return;
        }
        //判断房间是否已满
        if (rooms[roomId] == 2) {
            socket.emit('loginError', '房间已满');
            return;
        }
        //创建与房间号对应二维数组存放socket
        if (rooms[roomId] == 0) {
            players[roomId] = [0,0];
        }
        rooms[roomId] += 1;
        //保存玩家房间
        socket.roomId = roomId;
        //保存玩家角色
        socket.player = rooms[roomId] - 1;
        //等待其他玩家
        if (rooms[roomId] == 1) {
            players[roomId][0] = socket;
            socket.emit('loginWait');
        }
        //如果房间已满则开始游戏
        if (rooms[roomId] == 2) {
            players[roomId][1] = socket;
            players[roomId][0].emit('loginSuccess');
            players[roomId][1].emit('loginSuccess');
        }
        //console.log("进入----房间:" + roomId + ",人数" + rooms[roomId]);
    });
    //断开连接
    socket.on('disconnect', function () {
        //如果玩家一离开，玩家二自动变为玩家一
        if (socket.player == 0) {
            players[socket.roomId][0] = players[socket.roomId][1];
        }
        //玩家退出游戏后向对手发出消息
        if (rooms[socket.roomId] == 2) {
            players[socket.roomId][0].emit('loginOut');
            players[socket.roomId][1].emit('loginOut');
        } else {
            socket.emit('loginOut');
        }
        rooms[socket.roomId] -= 1;
        //console.log("断开----房间:" + socket.roomId + ",人数" + rooms[socket.roomId]);
    });
    //重新开局
    socket.on('ReStart', function (firstplayer) {
        players[socket.roomId][0].emit('StartGame', firstplayer);
        players[socket.roomId][1].emit('StartGame', firstplayer);
    });
    //点击棋子
    socket.on('clickPiece', function (ClickClass, turn) {
        if (turn == socket.player) {
            players[socket.roomId][0].emit('clickPiece', ClickClass);
            players[socket.roomId][1].emit('clickPiece', ClickClass);
        }
          
    });

});
var publicFun = {
    //判断输入的房间号是否正确
    JudgeRoomId: function (roomID) {
        if (roomID < 1 || roomID > 1000) {
            $(".room-errorWord").text("房间号必须在1~1000之间");
            return false;
        }
        return true;
    }
}
