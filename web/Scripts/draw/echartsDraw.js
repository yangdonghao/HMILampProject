var echarts = require('echarts');
require("amd-loader");
var ecStat = require('echarts-stat');

function dataToDraw(actID, hmID) {


    // dataVandA.find({}).sort({ Date: 1 }).exec(function(err, docs) {
    //     if (lampLocalLayer == null) {
    //         //实时水情标注的矢量图层
    //         lampLocalLayer = new ol.layer.Vector({
    //             source: new ol.source.Vector()
    //         });
    //         map.addLayer(lampLocalLayer);
    //     }
    //     lampLocalLayer.getSource().clear();
    //     addMarkers(docs);
    //     tableIDInforFunc(docs);
    //     // addResInfoToTable(docs); //第二个操作：将数据填到实时水情表格中，并将表格和标注联系起来
    // });


    // var needDataBase = new Datastore({ filename: './web/dataTool/dataVandA20171221.db', autoload: true });
    //needDataBase.find({ "actualID": 1 }, function(err, docs) { drawData1(docs); });
    dataVandA.find({ "actualID": parseInt(actID) }).sort({ Date: 1 }).exec(function(err, docs) { drawData(docs, actID, hmID); });
    // parseInt(actID)
}

function drawData(ArrayData, actID, hmID) {
    var DataArray = new Array();
    var dataTime = new Array();
    document.getElementById('singleLampSelectID').checked = true;
    $("#numberLampInputID").val(hmID);
    if (ArrayData.length == 0) {
        alert("无此ID数据记录");
    } else {
        for (var i = 0; i < ArrayData.length; i++) {
            //dateData = [ArrayData[i].Date.getFullYear(), ArrayData[i].Date.getMonth() + 1, ArrayData[i].Date.getDate()].join('/') + '\n' + [ArrayData[i].Date.getHours(), ArrayData[i].Date.getMinutes()].join(':')
            DataArray[i] = new Array();
            //DataArray[i][0]=new Array();
            dataTime[i] = ArrayData[i].Date;
            DataArray[i][0] = ArrayData[i].Date;
            DataArray[i][1] = ArrayData[i].current;
            DataArray[i][2] = ArrayData[i].voltage;
            //DataArray.push(dateData, ArrayData[i].current, ArrayData[i].voltage);
        }
        var startXPoint;
        if (dataTime.length > 10) {
            startXPoint = dataTime.length - 5;
        } else {
            startXPoint = 0;
        }
        var myChart = echarts.init(document.getElementById('history'));
        option = {
            title: {
                text: '历史记录',
                subtext: hmID + '号路灯',
                x: 'center',
                align: 'right'
            },
            grid: {
                bottom: 80
            },
            toolbox: {
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none'
                    },
                    restore: {},
                    saveAsImage: {}
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    animation: false,
                    label: {
                        backgroundColor: '#505765'
                        //backgroundColor: '#040705'
                    }
                }
            },
            dataZoom: [{
                    show: true,
                    realtime: true,
                    startValue: dataTime[startXPoint],
                    end: 100
                },
                {
                    type: 'inside',
                    realtime: true,

                    startValue: dataTime[startXPoint],
                    end: 100
                }
            ],
            legend: {
                data: ['电流', '电压'],
                x: 'left'
            },
            xAxis: {
                data: dataTime,
                type: 'time',
                splitLine: {
                    lineStyle: {
                        type: 'dashed'
                    }
                }
            },

            yAxis: [{
                    name: '电流(A)',
                    type: 'value',
                    splitLine: {
                        lineStyle: {
                            type: 'dashed'
                        }
                    }
                },
                {
                    name: '电压(V)',
                    nameLocation: 'start',
                    type: 'value',
                    inverse: true
                }
            ],

            series: [{
                    name: '电流',
                    type: 'bar',
                    barWidth: '5%',
                    data: DataArray,
                    encode: {
                        x: 0,
                        y: 1,
                    }
                },
                {
                    name: '电压',
                    yAxisIndex: 1,
                    type: 'bar',
                    barWidth: '5%',
                    data: DataArray,
                    encode: {
                        x: 0,
                        y: 2,
                    }
                }
            ]
        };
        myChart.setOption(option);
    }
}

function closedrawData() {
    $("#drawDataID").hide();
}


$(function() {
    //失去焦点自动隐藏
    $(".map").click(function() {
        document.getElementById("drawDataID").style.zIndex = -1;
    });
});