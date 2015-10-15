/// <reference path="jquery-1.7.1.js" />
/*********************************
              游戏入口
**********************************/
//var client = null;
$(function () {
    //var client = new Client();
    InitPanel.InitGamePanel();
    Game.StartGame();
    $(".btn_help").click(function () {
        InitPanel.HelpInfo();
    });
    Game.ConnectServer();
});
/*********************************
              棋子类
**********************************/
var Piece = function (type,mapXY,pX,pY) {
    //棋子类型
    this.ptype = type;
    //棋子位置div
    this.mapXY = mapXY;
    //棋子X坐标
    this.pX = pX;
    //棋子Y坐标
    this.pY = pY;
    //棋子是否被选中
    this.selected = false;
    //初始化棋子
    this.Init();
}
Piece.prototype = {
    //初始化
    Init: function () {
        //红方
        if (this.ptype == 0) {
            $(this.mapXY).css("backgroundImage", "url('../../Content/Images/piece_shu.png')");
        //蓝方
        } else if(this.ptype == 1){
            $(this.mapXY).css("backgroundImage", "url('../../Content/Images/piece_wei.png')");
        } else if (this.ptype == -1) {
            $(this.mapXY).css("backgroundImage", "none");
        }
    },
    //选取更改样式
    ChangeSelected:function(){
        if (this.ptype == 0) {
            $(this.mapXY).css("backgroundImage", "url('../../Content/Images/piece_shu_selected.png')");
            //蓝方
        } else if (this.ptype == 1) {
            $(this.mapXY).css("backgroundImage", "url('../../Content/Images/piece_wei_selected.png')");
        }
    },
    //取消选择样式
    CancelSelected: function () {
        this.Init();
    },
}

/*********************************
             游戏主体类
**********************************/
var Game = {
    //客户端连接
    client : null,
    //棋子数组
    pieces: new Array(4),
    //地图坐标数组
    mapXY : new Array(4),
    //回合
    turn: 0,
    //点击限制
    isCanClick : true,
    //开始游戏
    StartGame: function () {
        this.Init();   
    },
    //连接服务器
    ConnectServer: function () {
        this.client = new Client();
        this.client.Init();
    },
    //初始化数据
    Init: function () {
        //设置先手回合
        if ($(".red-first").attr("checked") == "checked") {
            this.turn = 0;
        } else {
            this.turn = 1;
        }    
        this.isCanClick = true;
        //初始化地图数组
        for (var i = 0; i < this.mapXY.length; i++) {
            this.mapXY[i] = new Array(4);
        }
        //初始化地图坐标
        var index = 0;
        for (var i = 0; i < this.mapXY.length; i++) {
            for (var j = 0; j < this.mapXY[i].length; j++) {
                this.mapXY[i][j] = ".piece" + index;
                $(this.mapXY[i][j]).click(function () {
                    //Game.onclick($(this).data("class"));
                    Game.client.socket.emit("clickPiece", $(this).data("class"),Game.turn)
                });
                index++;
            }
        }
        //初始化棋子数组
        for (var i = 0; i < this.pieces.length; i++) {
            this.pieces[i] = new Array(4);
        }
        //初始化棋子
        for (var i = 0; i < this.pieces.length; i++) {
            for (var j = 0; j < this.pieces[i].length; j++) {
                //蓝方
                if (i >= 0 && i <= 1) {
                    if (i == 1 && j == 1) this.pieces[i][j] = new Piece(-1, this.mapXY[i][j],i,j);
                    else if (i == 1 && j == 2) this.pieces[i][j] = new Piece(-1, this.mapXY[i][j],i,j);
                    else this.pieces[i][j] = new Piece(1, this.mapXY[i][j],i,j);
                }
                //红方
                else {
                    if (i == 2 && j == 1) this.pieces[i][j] = new Piece(-1, this.mapXY[i][j],i,j);
                    else if (i == 2 && j == 2) this.pieces[i][j] = new Piece(-1, this.mapXY[i][j],i,j);
                    else this.pieces[i][j] = new Piece(0, this.mapXY[i][j],i,j);
                }
            }
        }
    },
    //鼠标点击事件
    onclick: function (divClass) {
        if (!Game.isCanClick) {
            return;
        }
        //获取点击的棋子
        var piece = this.GetClickPiece(divClass);
        //点击的是空白区域
        if (piece.ptype == -1) {
            this.move(piece);
        }
        //如果点击的棋子未被选中
        else if (!piece.selected) {
            //其他棋子恢复初始状态
            for (var i = 0; i < this.pieces.length; i++) {
                for (var j = 0; j < this.pieces[i].length; j++) {
                    if (this.pieces[i][j].ptype == this.turn) {
                        this.pieces[i][j].CancelSelected();
                        this.pieces[i][j].selected = false;
                    }
                }
            }
            //点击的是本回合相应的棋子
            if (piece.ptype == this.turn) {
                //改变选中棋子样式
                piece.ChangeSelected();
                piece.selected = true;
            }         
        }
    },
    //棋子移动
    move: function (clickPiece) {
        //获取选中的棋子
        var selectPiece = this.GetSelectedPiece();
        //存在选中棋子
        if (selectPiece != null) {
            var isCanMove = false;
            var direction = null;
            //选中棋子在空白区域的左边
            if (selectPiece.pX == clickPiece.pX && selectPiece.pY + 1 == clickPiece.pY) {
                isCanMove = true;
                direction = "right";
            }
            //选中棋子在空白区域的右边
            else if (selectPiece.pX == clickPiece.pX && selectPiece.pY - 1 == clickPiece.pY) {
                isCanMove = true;
                direction = "left"
            }
            //选中棋子在空白区域的上面
            else if (selectPiece.pX + 1 == clickPiece.pX && selectPiece.pY == clickPiece.pY) {
                isCanMove = true;
                direction = "bottom"
            }
            //选中棋子在空白区域的下面
            else if (selectPiece.pX - 1 == clickPiece.pX && selectPiece.pY == clickPiece.pY) {
                isCanMove = true;
                direction = "top"
            }
            if (isCanMove) {
                //禁止点击
                Game.isCanClick = false;
                //移动棋子
                clickPiece.ptype = selectPiece.ptype;
                selectPiece.ptype = -1;
                selectPiece.selected = false;
                var clickleft = $(clickPiece.mapXY).css("left");
                var clicktop = $(clickPiece.mapXY).css("top");
                var selectleft = $(selectPiece.mapXY).css("left");
                var selecttop = $(selectPiece.mapXY).css("top");
                //移动效果
                $(selectPiece.mapXY).animate({
                    left: clickleft,
                    top: clicktop
                }, 500, function () {
                    clickPiece.Init();
                    selectPiece.Init();
                    //回归原位
                    $(selectPiece.mapXY).css({ left: selectleft, top: selecttop });
                    Game.HitPiece(clickPiece);
                });               
            }
        }
    },
    //攻击棋子
    HitPiece: function (movePiece) {
        //获取对家的棋子type
        var ContraryType = this.GetContraryType(movePiece.ptype);
        //判断左边是否有自己的棋子
        if (movePiece.pY == 0 ? false : Game.pieces[movePiece.pX][movePiece.pY - 1].ptype == movePiece.ptype) {
            if (movePiece.pY == 1) {
                if (Game.pieces[movePiece.pX][movePiece.pY + 1].ptype == ContraryType && Game.pieces[movePiece.pX][movePiece.pY + 2].ptype != ContraryType) {
                    Game.pieces[movePiece.pX][movePiece.pY + 1].ptype = -1;
                    Game.pieces[movePiece.pX][movePiece.pY + 1].Init();
                }
            }
            if (movePiece.pY == 2) {
                if (Game.pieces[movePiece.pX][movePiece.pY - 2].ptype == ContraryType && Game.pieces[movePiece.pX][movePiece.pY + 1].ptype != ContraryType) {
                    Game.pieces[movePiece.pX][movePiece.pY - 2].ptype = -1;
                    Game.pieces[movePiece.pX][movePiece.pY - 2].Init();
                } else if (Game.pieces[movePiece.pX][movePiece.pY + 1].ptype == ContraryType && Game.pieces[movePiece.pX][movePiece.pY - 2].ptype != ContraryType) {
                    Game.pieces[movePiece.pX][movePiece.pY + 1].ptype = -1;
                    Game.pieces[movePiece.pX][movePiece.pY + 1].Init();
                }
            }
            if (movePiece.pY == 3) {
                if (Game.pieces[movePiece.pX][movePiece.pY - 2].ptype == ContraryType && Game.pieces[movePiece.pX][movePiece.pY - 3].ptype != ContraryType) {
                    Game.pieces[movePiece.pX][movePiece.pY - 2].ptype = -1;
                    Game.pieces[movePiece.pX][movePiece.pY - 2].Init();
                }
            }
        }
        //判断右边是否有自己的棋子
        if (movePiece.pY == 3 ? false : Game.pieces[movePiece.pX][movePiece.pY + 1].ptype == movePiece.ptype) {
            if (movePiece.pY == 0) {
                if (Game.pieces[movePiece.pX][movePiece.pY + 2].ptype == ContraryType && Game.pieces[movePiece.pX][movePiece.pY + 3].ptype != ContraryType) {
                    Game.pieces[movePiece.pX][movePiece.pY + 2].ptype = -1;
                    Game.pieces[movePiece.pX][movePiece.pY + 2].Init();
                }
            }
            if (movePiece.pY == 1) {
                if (Game.pieces[movePiece.pX][movePiece.pY + 2].ptype == ContraryType && Game.pieces[movePiece.pX][movePiece.pY - 1].ptype != ContraryType) {
                    Game.pieces[movePiece.pX][movePiece.pY + 2].ptype = -1;
                    Game.pieces[movePiece.pX][movePiece.pY + 2].Init();
                } else if (Game.pieces[movePiece.pX][movePiece.pY - 1].ptype == ContraryType && Game.pieces[movePiece.pX][movePiece.pY + 2].ptype != ContraryType) {
                    Game.pieces[movePiece.pX][movePiece.pY - 1].ptype = -1;
                    Game.pieces[movePiece.pX][movePiece.pY - 1].Init();
                }
            }
            if (movePiece.pY == 2) {
                if (Game.pieces[movePiece.pX][movePiece.pY - 1].ptype == ContraryType && Game.pieces[movePiece.pX][movePiece.pY - 2].ptype != ContraryType) {
                    Game.pieces[movePiece.pX][movePiece.pY - 1].ptype = -1;
                    Game.pieces[movePiece.pX][movePiece.pY - 1].Init();
                }
            }
        }
        //判断上面是否有自己的棋子
        if (movePiece.pX == 0 ? false : Game.pieces[movePiece.pX - 1][movePiece.pY].ptype == movePiece.ptype) {
            if (movePiece.pX == 1) {
                if (Game.pieces[movePiece.pX + 1][movePiece.pY].ptype == ContraryType && Game.pieces[movePiece.pX + 2][movePiece.pY].ptype != ContraryType) {
                    Game.pieces[movePiece.pX + 1][movePiece.pY].ptype = -1;
                    Game.pieces[movePiece.pX + 1][movePiece.pY].Init();
                }
            }
            if (movePiece.pX == 2) {
                if (Game.pieces[movePiece.pX - 2][movePiece.pY].ptype == ContraryType && Game.pieces[movePiece.pX + 1][movePiece.pY].ptype != ContraryType) {
                    Game.pieces[movePiece.pX - 2][movePiece.pY].ptype = -1;
                    Game.pieces[movePiece.pX - 2][movePiece.pY].Init();
                } else if (Game.pieces[movePiece.pX + 1][movePiece.pY].ptype == ContraryType && Game.pieces[movePiece.pX - 2][movePiece.pY].ptype != ContraryType) {
                    Game.pieces[movePiece.pX + 1][movePiece.pY].ptype = -1;
                    Game.pieces[movePiece.pX + 1][movePiece.pY].Init();
                }
            }
            if (movePiece.pX == 3) {
                if (Game.pieces[movePiece.pX - 2][movePiece.pY].ptype == ContraryType && Game.pieces[movePiece.pX - 3][movePiece.pY].ptype != ContraryType) {
                    Game.pieces[movePiece.pX - 2][movePiece.pY].ptype = -1;
                    Game.pieces[movePiece.pX - 2][movePiece.pY].Init();
                }
            }
        }
        //判断下面是否有自己的棋子
        if (movePiece.pX == 3 ? false : Game.pieces[movePiece.pX + 1][movePiece.pY].ptype == movePiece.ptype) {
            if (movePiece.pX == 0) {
                if (Game.pieces[movePiece.pX + 2][movePiece.pY].ptype == ContraryType && Game.pieces[movePiece.pX + 3][movePiece.pY].ptype != ContraryType) {
                    Game.pieces[movePiece.pX + 2][movePiece.pY].ptype = -1;
                    Game.pieces[movePiece.pX + 2][movePiece.pY].Init();
                }
            }
            if (movePiece.pX == 1) {
                if (Game.pieces[movePiece.pX + 2][movePiece.pY].ptype == ContraryType && Game.pieces[movePiece.pX - 1][movePiece.pY].ptype != ContraryType) {
                    Game.pieces[movePiece.pX + 2][movePiece.pY].ptype = -1;
                    Game.pieces[movePiece.pX + 2][movePiece.pY].Init();
                } else if (Game.pieces[movePiece.pX - 1][movePiece.pY].ptype == ContraryType && Game.pieces[movePiece.pX + 2][movePiece.pY].ptype != ContraryType) {
                    Game.pieces[movePiece.pX - 1][movePiece.pY].ptype = -1;
                    Game.pieces[movePiece.pX - 1][movePiece.pY].Init();
                }
            }
            if (movePiece.pX == 2) {
                if (Game.pieces[movePiece.pX - 1][movePiece.pY].ptype == ContraryType && Game.pieces[movePiece.pX - 2][movePiece.pY].ptype != ContraryType) {
                    Game.pieces[movePiece.pX - 1][movePiece.pY].ptype = -1;
                    Game.pieces[movePiece.pX - 1][movePiece.pY].Init();
                }
            }
        }
        this.JudgeVictory();
        //更换回合
        if (this.turn == 0) this.turn = 1;
        else this.turn = 0;
        //允许点击
        Game.isCanClick = true;
    },
    //判断是否胜利
    JudgeVictory: function () {
        var redCount = 0;
        var blueCount = 0;
        for (var i = 0; i < Game.pieces.length; i++) {
            for (var j = 0; j < Game.pieces[i].length; j++) {
                if (Game.pieces[i][j].ptype == 0) {
                    redCount += 1;
                }
                if (Game.pieces[i][j].ptype == 1) {
                    blueCount += 1;
                }
            }
        }
        //弹出胜利框
        if (redCount == 1) {
            InitPanel.DisplayVictory("魏国");
            return;
        }
        else if (blueCount == 1) {
            InitPanel.DisplayVictory("蜀国");
        }
    },
    
    //获取点击的棋子
    GetClickPiece: function (divClass) {
        for (var i = 0; i < this.pieces.length; i++) {
            for (var j = 0; j < this.pieces[i].length; j++) {
                if (this.pieces[i][j].mapXY == divClass) {
                    return this.pieces[i][j];
                }
            }
        }
    },
    //获取选中的棋子
    GetSelectedPiece:function(){
        for (var i = 0; i < this.pieces.length; i++) {
            for (var j = 0; j < this.pieces[i].length; j++) {
                if (this.pieces[i][j].selected) {
                    return this.pieces[i][j];
                }
            }
        }
        return null;
    },
    //获取对家的棋子type
    GetContraryType: function (ptype) {
        if (ptype == 0) {
            return 1;
        } else if (ptype == 1) {
            return 0;
        }
    }
}
/*********************************
            初始化界面类
**********************************/
var InitPanel = {
    //初始化游戏主界面
    InitGamePanel: function () {
        $(".chess").append("<div class='gamepanel'>\
                                <div class='piece0 piece fl' data-class='.piece0'></div>\
                                <div class='piece1 piece fl' data-class='.piece1'></div>\
                                <div class='piece2 piece fl' data-class='.piece2'></div>\
                                <div class='piece3 piece fl' data-class='.piece3'></div>\
                                <div class='piece4 piece fl' data-class='.piece4'></div>\
                                <div class='piece5 piece fl' data-class='.piece5'></div>\
                                <div class='piece6 piece fl' data-class='.piece6'></div>\
                                <div class='piece7 piece fl' data-class='.piece7'></div>\
                                <div class='piece8 piece fl' data-class='.piece8'></div>\
                                <div class='piece9 piece fl' data-class='.piece9'></div>\
                                <div class='piece10 piece fl' data-class='.piece10'></div>\
                                <div class='piece11 piece fl' data-class='.piece11'></div>\
                                <div class='piece12 piece fl' data-class='.piece12'></div>\
                                <div class='piece13 piece fl' data-class='.piece13'></div>\
                                <div class='piece14 piece fl' data-class='.piece14'></div>\
                                <div class='piece15 piece fl' data-class='.piece15'></div>\
                            </div>\
                            <div class='gameConfig'>\
                                <div class='config_button'>\
                                    <input class='btn_start btn' type='button' value='开局'/>\
                                    <input class='btn_help btn' type='button' value='帮助'/>\
                                </div>\
                                <div class='config_radio'>\
                                    <input class='red-first' type='radio' name='firstStart' checked='checked'/>蜀国先手<br />\
                                    <input class='blue-first' type='radio' name='firstStart'/>魏国先手\
                                </div>\
                            </div>\
                            <div class='connect-conver cover'>\
                                <div class='connect-window'></div>\
                                <div class='connect-word'>正在接连服务器…………</div>\
                                <div class='room-window'>\
                                    <div class='room-textArea'>\
                                        房间号：<input class ='input_roomtext' type='number' />\
                                    </div>\
                                    <div class='room-errorWord'>房间已满</div>\
                                    <div class='room-btnArea'>\
                                    <input type='button' class='input_room btn' value='确定' />\
                                    </div>\
                                </div>\
                            </div>");
    },
    //游戏帮助界面
    HelpInfo: function () {
        $(".chess").append("<div class='rule-covery cover'>\
                                <div class='rule-window'>\
                                    <div class='rule-word'>\
                                        <div class='rule-word-point'></div>\
                                        <div class='rule-word-detail'></div>\
                                    </div>\
                                    <div class='rule-btnArea'>\
                                        <input type='button' class='input_rule btn' value='我知道了' />\
                                    </div>\
                                </div>\
                            </div>")
        $(".rule-word-point").text("对弈之法如此：局为九宫格，棋在线上走。每回移一格，步步皆为营。二子连一线，杀敌无形中。孤军难深入，棋子亦复同。一方余独子，胜负亦分晓。");
        $(".rule-word-detail").text("规则详解：在棋盘的交叉点上移动选中的棋子。棋子只能在线上一格一格移动，两个棋子主动连成一线，可以吃掉线上的单独的一个棋子。但是如果对方棋子也是连线的，则不能吃。简单来说就是\"两子吃一子\"。");
        $(".input_rule").unbind();
        $(".input_rule").click(function () {
            $(".rule-covery").remove();
        });
    },
    //游戏胜利界面
    DisplayVictory: function (player) {
    $(".chess").append("<div class='victory-covery cover'>\
                                <div class='victory-window'>\
                                    <div class='victory-word'>\
                                        <span class='victory-player'></span>\
                                        <span class='victory-desc'>获胜</span>\
                                    </div>\
                                    <div class='victory-btnArea'>\
                                        <input type='button' class='input_victory btn' value='继续' />\
                                    </div>\
                                </div>\
                          </div>")
    if (player == "蜀国") {
        $(".victory-player").css("color", "red");
    }
    else {
        $(".victory-player").css("color", "blue");
    }
        $(".victory-player").text(player)
        $(".input_victory").unbind();
        $(".input_victory").click(function () {
            $(".btn_start").trigger('click');
            $(".victory-covery").remove();
        });
    },
}
/*********************************
              客户端
**********************************/
var Client = function () {
    this.socket = null;
};
Client.prototype = {
    Init: function () {
        var that = this;
        //建立到服务器的socket连接
        this.socket = io.connect();
        //监听连接建立
        this.socket.on("connect", function () {
            $(".room-window").css("display", "block");
            $(".connect-word").text("等待其他玩家中…………");
        });
        //断开连接
        this.socket.on("loginOut", function () {
            $(".connect-conver").css("display", "block");
            $(".connect-word").text("等待其他玩家中…………");
        });
        //监听是否可以进入房间
        $(".input_room").click(function () {
            var roomId = $(".input_roomtext").val();
            if (that.JudgeRoomId(roomId)) {
                that.socket.emit("login", roomId);
            } else {
                $(".room-errorWord").css("display", "block");
            }
        }); 
        this.socket.on("loginError", function (errorMessage) {
            $(".room-errorWord").text(errorMessage);
            $(".room-errorWord").css("display", "block");
        });
        this.socket.on("loginWait", function () {
            $(".room-window").css("display", "none");
        });
        //监听玩家成功登陆
        this.socket.on("loginSuccess", function () {
            $(".room-window").css("display", "none");
            $(".connect-conver").css("display", "none");
            Game.StartGame();
        });
        //监听重新开局
        $(".btn_start").click(function () {
            if ($(".red-first").attr("checked") == "checked") {
                that.socket.emit("ReStart", 0);
            } else {
                that.socket.emit("ReStart", 1);
            }
           
        });
        this.socket.on("StartGame", function (firstPlayer) {
            $(".victory-covery").remove();
            if (firstPlayer == 0) {
                $(".red-first").attr("checked", "checked");
            } else {
                $(".blue-first").attr("checked", "checked");
            }
            Game.StartGame();
        });
        //监听点击棋子
        this.socket.on("clickPiece", function (ClickClass) {
            Game.onclick(ClickClass);
        });
    },
    //判断输入的房间号是否正确
    JudgeRoomId: function (roomID) {
        if (roomID < 1 || roomID > 1000) {
            $(".room-errorWord").text("房间号必须在1~1000之间");
            return false;
        }
        return true;
    }
}