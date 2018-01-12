var wait = 5;
var adminRightEndTimer = 0;
// var adminRightEndTimer = 1;
var layer;

$(function() {
    layui.use('layer', function() {
        layer = layui.layer;
    });
});

function commandDelay(myObject) {
    if (wait == 0) {
        myObject.removeAttribute("disabled");
        myObject.value = "发送命令";
        wait = 5;
    } else {
        myObject.setAttribute("disabled", true);
        myObject.value = wait + "秒后可以重新发送";
        wait--;
        setTimeout(function() { commandDelay(myObject); }, 1000);
    }
}

function tableIDDisplayFunc() {
    $("#tableIDInformation").toggle();
}
$("#activeUserFunc").mouseover(function() {
    $("#lampOnMapFunction").show();
});
$("#activeAdvFunc").mouseover(function() {
    $("#deepInformation").show();
});

$("#activeClose").mouseover(function() {
    $("#closeWindow").show();
});

var showHideTimer2;
$("#closeWindow").mouseout(function() {
    showHideTimer2 = setTimeout(function() {
        $("#closeWindow").hide();
    }, 1000 * 2);
});
$("#closeWindow").mouseover(function() {
    clearTimeout(showHideTimer2);
});

var showHideTimer;
var needPassword;

$("#lampOnMapFunction").mouseout(function() {
    showHideTimer = setTimeout(function() {
        $("#lampOnMapFunction").hide();
    }, 1000 * 60);
    needPassword = setTimeout(function() {
        needPasswordFunc();
    }, 1000 * 60 * 30);
    // 1000 * 60 * 30
});

var showHideTimer1;

$("#deepInformation").mouseout(function() {
    showHideTimer1 = setTimeout(function() { $("#deepInformation").hide(); }, 1000 * 5);
});
$("#deepInformation").mouseover(function() {
    clearTimeout(showHideTimer1);
});

$("#lampOnMapFunction").mouseover(function() {
    clearTimeout(showHideTimer);
    clearTimeout(needPassword);
});
//点开管理员操作后
$("#adminOperaOpen").mouseup(function(event) {
    if (adminRightEndTimer == 0) {
        $('#adminLog').modal();
    } else {
        $("#adminSelect").collapse("toggle");
    }

});

//点开高级功能后
$("#advancedOperation").mouseup(function(event) {
    $("#advancedSelectID").collapse("toggle");
});

function needPasswordFunc() {

    $("#adminSelect").collapse("hide");
    document.getElementById('finishLamp').checked = true;
}

function adminOperationFunc() {
    name = document.getElementById("adminName").value;
    if (document.getElementById("adminName").value == "cz" && document.getElementById("adminPassword").value == "czcz123") {
        layer.msg('密码正确');
        $("#adminSelect").collapse("show");
        adminRightEndTimer = 1;
        if (needControlWin == 1) {
            $('#commandDisplayID').show();
            needControlWin = 0;
        }
        setTimeout(function() {
            adminRightEndTimer = 0;
            $("#adminSelect").collapse("hide");
            $('#adminName').val("");
            $('#adminPassword').val("");
        }, 1000 * 60 * 30);
    } else {
        layer.msg('密码错误');
    }
}

function lockOperation() {
    adminRightEndTimer = 0;
    $("#adminSelect").collapse("hide");
    $('#adminName').val("");
    $('#adminPassword').val("");
    $('#commandDisplayID').hide();
    $("#advancedSelectID").collapse("hide");
}

var closeDelayTime;
var displayTimer;
var timerCloseDisplay;

function closeWinDelay() {
    timerCloseDisplay = 8;
    $("#countDown").text(timerCloseDisplay);
    closeDelayTime = setTimeout(function() { window.close(); }, 1000 * timerCloseDisplay);
    displayTimer = setInterval(function() {
        timerCloseDisplay = timerCloseDisplay - 1;
        $("#countDown").text(timerCloseDisplay);
        //$("#countDown").append(timerCloseDisplay);
    }, 1000);

    $("#closeWinDelayID").modal();
}

function cancelCloseWin() {
    timerCloseDisplay = 8;
    clearInterval(displayTimer);
    clearTimeout(closeDelayTime);
}




// 灯控Start*****************************************************
var sendDelayTimer = 8;

var sendTimer;

function sendDelay() {
    sendDelayTimer = 8;
    $('#sendText').text("等待" + sendDelayTimer + "秒");
    $('#sendButtonID').prop('disabled', true);
    sendTimer = setInterval(function() {
        sendDelayTimer = sendDelayTimer - 1;
        $('#sendText').text("等待" + sendDelayTimer + "秒");
        if (sendDelayTimer <= 0) {
            clearInterval(sendTimer);
            $('#sendText').text("发送");
            $('#sendButtonID').prop('disabled', false);
        }
    }, 1000);
    //sendCommand();
}

var needControlWin = 0;

function Lamptoggle() {
    needControlWin = 1;
    if (adminRightEndTimer == 1) {
        $("#commandDisplayID").toggle();
        sendCommandSelect();
    } else {
        $('#adminLog').modal();
    }
}

// 灯控End*********************************************************
// 


//信道
function changeChannel() {
    $('#channelChangeID').modal();
}