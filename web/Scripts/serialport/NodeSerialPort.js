const SerialPort = require('serialport');
// const createTable = require('data-table');
const port = new SerialPort('com5', {
    baudRate: 115200,
    autoOpen: false
});


port.open(function(err) {
    if (err) {
        // layer.alert('无对应硬件连接，查看硬件信息');
        setTimeout(function() {
            $('#alertTxt').text("无相应硬件连接，请查看硬件信息");
            $('#alertWindow').modal();
        }, 1000 * 3);

        return console.log('Error opening port: ', err.message);
    }
    // Because there's no callback to write, write errors will be emitted on the port:
    //port.write('main screen turn on');
});

// The open event is always emitted
port.on('open', function() {
    // open logic
});

//Switches the port into "flowing mode"
port.on('data', function(data) {
    // console.log('Data:', data);
    serialNewData(data);
});

function serialNewData(data) {
    var returnData = new Uint8Array(32);
    returnData[0] = 0x6A;
    returnData[1] = 0xA6;
    var newDate = new Date();

    if (data[0] == 0x5A && data[1] == 0xA5) {
        if (data[2] == 0x03) //获得电流电压数据，并存入数据库
        {
            returnData[2] = 0xF3;
            port.write(returnData);
            var actualID = data[3];
            var v = data[4] + data[5] * 256;
            var c = data[6] + data[7] * 256;

            var yymmdd = newDate.getFullYear().toString() +
                ('0' + (myDate.getMonth()) + 1).slice(-2).toString() +
                ('0' + myDate.getDate()).slice(-2);


            lampLocal.update({ actualID: actualID }, { $set: { voltage: v, current: c, upDate: newDate } }, { upsert: true }, function(err, numAffected, upsert) {

                lampLocal.loadDatabase(function(err) {
                    retable();
                    // console.log(upsert);
                });
            });
            if (myyymmdd === yymmdd) {
                // console.log(1);
                dataVandA.insert([{ actualID: actualID, voltage: v, current: c, Date: newDate }], function(err, newDocs) {});

            } else if (myyymmdd !== yymmdd) {
                // console.log(2);
                dataVandA = new Datastore({ filename: './web/data/dataDate/dataVandA' + yymmdd + '.db' });
                dataVandA.loadDatabase(function(err) {
                    dataVandA.insert([{ actualID: actualID, voltage: v, current: c, Date: newDate }], function(err, newDocs) {});
                });
            }
            myyymmdd = yymmdd;
        } else if (data[2] == 0x01) //返回数据库中对应id
        {
            returnData[2] = 0xF1;
            returnData[3] = 0x01; //读取数据库中id
            returnData[4] = data[3];
            returnData[5] = data[4];
            returnNetID(data);
            port.write(returnData);
        } else if (data[2] == 0x02) { //返回时间
            returnData[2] = 0xF2;
            timertemp = newDate.getHours() * 3600 + newDate.getMinutes() * 60 + newDate.getSeconds();

            returnData[3] = timertemp / 256; //读取数据库中id
            returnData[4] = timertemp % 256;
            // console.log('returnData:', returnData);
            port.write(returnData);
        }
    }
}

//发送控制命令start***************************************************************
var allLampSelect = document.getElementById('allLampSelectID');
var groupLampSelect = document.getElementById('groupLampSelectID');
var singleLampSelect = document.getElementById('singleLampSelectID');
var manualOperation = document.getElementById('manualOperationID');
var autoOperation = document.getElementById('autoOperationID');

var numberLampInput = document.getElementById('numberLampInputID');
var brightnessInput = document.getElementById('brightnessInputID');
var CCTInput = document.getElementById('CCTInputID');

function sendCommand() {

    var netID = 0;

    if (brightnessInput.value == "") {
        luminance = 255;
    } else {
        luminance = brightnessInput.value;
    }

    if (CCTInput.value == "") {
        CCT = 255;
    } else {
        CCT = CCTInput.value;
    }

    if (allLampSelectID.checked) {
        netID = 255;
        if (netID >= 1 && netID <= 255 && ((luminance >= 0 && luminance <= 100) || luminance == 255) && ((CCT >= 0 && CCT <= 100) || CCT == 255)) {
            var returnData = new Uint8Array(32);
            returnData[0] = 0x6A;
            returnData[1] = 0xA6;
            returnData[2] = 0xF4;
            returnData[3] = netID;
            returnData[4] = luminance;
            returnData[5] = CCT;
            port.write(returnData);
            console.log('Send Data: ', returnData);
            sendDelay();
        } else {
            alert("输入错误, 数据不在合理范围内");
        }
    }
    if (groupLampSelect.checked) {}
    if (singleLampSelect.checked) {
        if (numberLampInput.value == "") {
            layer.msg("路灯编号未输入");

        } else {

            lampLocal.find({ "actualID": parseInt(numberLampInput.value) }, function(err, docs) {
                // parseInt(numberLampInput.value)
                netID = docs[0].hmiID;
                if (netID >= 1 && netID <= 255 && ((luminance >= 0 && luminance <= 100) || luminance == 255) && ((CCT >= 0 && CCT <= 100) || CCT == 255)) {
                    var returnData = new Uint8Array(32);
                    returnData[0] = 0x6A;
                    returnData[1] = 0xA6;
                    returnData[2] = 0xF4;
                    returnData[3] = netID;
                    returnData[4] = luminance;
                    returnData[5] = CCT;
                    port.write(returnData);
                    console.log('Send Data: ', returnData);
                    sendDelay();
                } else {
                    alert("输入错误, 数据不在合理范围内");
                }
            });
            // netID = numberLampInput.value;
        }
    }
}

$("#commandDisplayID").mousedown(function() {
    //加延时，checked变化过慢
    setTimeout(function() {
        sendCommandSelect();
    }, 300);
});

function sendCommandSelect() {
    if (allLampSelectID.checked) {
        $('#numberLampInputID').prop('disabled', true);
        $("#numberLampInputID").val("");
    }
    if (groupLampSelect.checked) {
        layer.msg("分组操作暂未开放，将在迭代产品中完成此功能！");
        document.getElementById('allLampSelectID').checked = true;
    }
    if (singleLampSelect.checked) {
        $('#numberLampInputID').prop('disabled', false);
    }

    if (autoOperation.checked) {
        layer.msg("自动操作暂未开放，将在迭代产品中完成此功能！");
        document.getElementById('manualOperationID').checked = true;
    }
}
// $('#sendButtonID').prop('disabled', true);




//发送控制命令end***************************************************************



function returnNetID(data) {
    netUidConnect.find({ firstUID: data[3], secondUID: data[4] }, function(err, docs) {
        if (docs.length == 0) {
            netUidConnect.find({}, function(err, docs) {
                var netID = new Uint8Array(docs.length);
                var netIDNew;
                for (var i = 0; i < docs.length; i++) { //提取已有ID
                    netID[i] = docs[i].netID;
                }

                netID.sort(NumAscSort); //排序已有ID
                netIDNew = docs.length + 1;
                for (var i = 0; i < docs.length; i++) { //查询是否有空余ID，有则更新ID
                    if (netID[i] < (i + 1)) {
                        alert("注册ID有重复, 无法注册新ID，请查看数据库");
                    } else if (netID[i] > (i + 1)) {
                        netIDNew = i + 1;
                        break;
                    }
                }
                netUidConnect.insert([{ netID: netIDNew, firstUID: data[3], secondUID: data[4], Date: new Date() }], function(err, newDocs) {});
            });
        } else if (docs.length == 1) {
            alert("UID已存入，无需重复");
        } else {
            alert("接收UID在数据库中重复，请查看");
        }

    });

    //netUidConnect.insert([{ netID: 2, firstUID: data[3], secondUID: data[4], Date: new Date() }], function(err, newDocs) {});

    // netUidConnect.find({}, function(err, docs) {
    //  netID=docs.netID;
    //  //netID.sort(NumDescSort);
    // });       


}

function NumAscSort(a, b) {
    return a - b;
}
// function toHex(num) { //将一个数字转化成16进制字符串形式
//     return num < 16 ? "0" + num.toString(16).toUpperCase() : num.toString(16).toUpperCase();
// }
// 

function informationSerial() {
    SerialPort.list((err, ports) => {
        console.log('ports', ports);
        if (err) {
            document.getElementById('error').textContent = err.message;
            return;
        } else {
            document.getElementById('error').textContent = '';
        }

        if (ports.length === 0) {
            document.getElementById('error').textContent = 'No ports discovered';
        }
        var headers = Object.keys(ports[0]);
        var tmpHtml = '<table class="table table-bordered table-condensed"><thead>';
        for (var i = 0; i < headers.length; i++) {
            tmpHtml += '<th class="text-center">' + headers[i] + '</th>';
        }
        tmpHtml += '</tr></thead>';

        tmpHtml += "<tbody>";
        for (var j = 0; j < ports.length; j++) {
            var rowData = ports[j];
            tmpHtml += "<tr class='tableTr'><td>" + rowData.comName + "</td><td>" + rowData.locationId + "</td><td>" + rowData.manufacturer + "</td><td>" +
                rowData.pnpId + "</td><td>" + rowData.productId + "</td><td>" + rowData.serialNumber + "</td><td>" + rowData.vendorId + "</td></tr>";
        }

        tmpHtml += "</tbody></table>";
        // <tr><td>Tanmay</td><td>Bangalore</td><td>560001</td><td>Sachin</td></tr></tbody></table>";
        $("#ports").text("");
        $("#ports").append(tmpHtml);
        //表格操作显示
        $('#serialModal').modal();
    });
}

// 信道控制
var channelInput = document.getElementById('channelInputID');

function changeChannelSend() {
    var channel = channelInput.value;
    if (channel == "") {
        alert("未输入任何数字");
    } else {
        var returnData = new Uint8Array(32);
        returnData[0] = 0x6A;
        returnData[1] = 0xA6;
        returnData[2] = 0xF5;
        returnData[3] = channel;
        port.write(returnData);
        console.log('Send Data: ', returnData);
    }

}