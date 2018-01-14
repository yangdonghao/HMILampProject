/************************************************************************/
/* 智能路灯管理网页
*@CSV R&D
/************************************************************************/

//html文件，用户功能选择
var addLampSelect = document.getElementById('addLamp');
var deleteLampSelect = document.getElementById('deleteLamp');
var finishLampSelect = document.getElementById('finishLamp');
var adminOperationSelect = document.getElementsByName('adminOperation');

//定义修改几何图形功能控件
var Modify = {
    init: function() {
        //初始化一个交互选择控件,并添加到地图容器中
        this.select = new ol.interaction.Select({
            condition: function(event) {
                if (addLampSelect.checked) {
                    return ol.events.condition.doubleClick(event);
                } else {
                    return false;
                }
            },
            layers: lampLocalLayer
        });
        map.addInteraction(this.select);
        //初始化一个交互编辑控件，并添加到地图容器中
        this.modify = new ol.interaction.Modify({
            features: this.select.getFeatures(), //选中的要素
        });
        map.addInteraction(this.modify);
        //设置几何图形变更的处理
        this.setEvents();
    },
    setEvents: function() {
        var selectedFeatures = this.select.getFeatures(); //选中的要素
        //添加选中要素变更事件
        this.select.on('change:active', function() {
            selectedFeatures.forEach(selectedFeatures.remove, selectedFeatures);
        });
        this.select.on('select', function() { //如果选中feature,进入
        });
    },
    setActive: function(active) {
        this.select.setActive(active); //激活选择要素控件
        this.modify.setActive(active); //激活修改要素控件
    }
};

var timeINt = self.setInterval("clock()", 5000);

function clock() {
    console.log('click');
}

var hmiIDGlobal = null;

/***********************************调用数据库数据地图显示start*******************************/
var lampLocalLayer = null; /*路灯标记点图层*/
var lampLocalArray = null; //路灯标注数组，用来联系地图上添加的标注与路灯表格数据
var lampMarkerDetailData = null; //记录每个标注的详细信息
function loadLayers() {
    if (tableSort == 0) {
        lampLocal.find({}).sort({ hmiID: tableSortHmiID }).exec(function(err, docs) {
            if (lampLocalLayer == null) {
                lampLocalLayer = new ol.layer.Vector({
                    source: vectorSource
                });
                map.addLayer(lampLocalLayer);
            }
            lampLocalLayer.getSource().clear();
            addMarkers(docs);
            tableIDInforFunc(docs);
        });
    } else if (tableSort == 1) {
        lampLocal.find({}).sort({ Date: tableSortTime }).exec(function(err, docs) {
            if (lampLocalLayer == null) {
                lampLocalLayer = new ol.layer.Vector({
                    source: vectorSource
                });
                map.addLayer(lampLocalLayer);
            }
            lampLocalLayer.getSource().clear();
            addMarkers(docs);
            tableIDInforFunc(docs);
        });
    }
}
//重新加载表格
function retable() {
    if (tableSort == 0) {
        lampLocal.find({}).sort({ hmiID: tableSortHmiID }).exec(function(err, docs) {
            if (lampLocalLayer == null) {
               
                lampLocalLayer = new ol.layer.Vector({
                    source: vectorSource
                });
                map.addLayer(lampLocalLayer);
            }
            tableIDInforFunc(docs);
        });
    } else if (tableSort == 1) {
        lampLocal.find({}).sort({ Date: tableSortTime }).exec(function(err, docs) {
            if (lampLocalLayer == null) {
                
                lampLocalLayer = new ol.layer.Vector({
                    source: vectorSource
                });
                map.addLayer(lampLocalLayer);
            }
            tableIDInforFunc(docs);
        });
    }
}

var addNewLampLayer = null; /*路灯标记点图层*/
var draw; //绘制对象

function addLampFunc() {
    var sourceDraw = new ol.source.Vector({ wrapX: false });
    map.removeInteraction(draw); //移除绘制图形
    if (addLampSelect.checked) {
        if (addNewLampLayer == null) {
            addNewLampLayer = new ol.layer.Vector({
                style: new ol.style.Style({
                    fill: new ol.style.Fill({ color: 'rgba(0, 3, 255, 0.2)' }),
                    stroke: new ol.style.Stroke({ color: '#111133', width: 2 }),
                    image: new ol.style.Circle({ radius: 7, fill: new ol.style.Fill({ color: '#111133' }) })
                })
            });
            addNewLampLayer.setSource(sourceDraw);
            map.addLayer(addNewLampLayer);
        }
        var geometryFunction, maxPoints;
        draw = new ol.interaction.Draw({
            source: sourceDraw, //绘制层数据源
            type: "Point", //几何图形类型
            geometryFunction: geometryFunction, //几何信息变更时调用函数
            maxPoints: maxPoints //最大点数
        });
        map.addInteraction(draw);
        //添加绘制结束事件监听，在绘制结束后保存信息到数据库
        draw.on('drawend', drawEndCallBack, this);
    } else {
        sourceDraw = null;
    }
}

//贴边磁吸效果
var point = null;
var line = null;
var displaySnap = function(coordinate) {
    var closestFeature = vectorSource.getClosestFeatureToCoordinate(coordinate);
    if (closestFeature === null) {
        point = null;
        line = null;
    } else {
        var geometry = closestFeature.getGeometry();
        var closestPoint = geometry.getClosestPoint(coordinate);
        if (point === null) {
            point = new ol.geom.Point(closestPoint);
        } else {
            point.setCoordinates(closestPoint);
        }
        if (line === null) {
            line = new ol.geom.LineString([coordinate, closestPoint]);
        } else {
            line.setCoordinates([coordinate, closestPoint]);
        }
    }
    map.render();
};

var scale = 0.07;
var scale_flag = 0;
function checkZoom() {
    // alert("1");
    // var childId;
    var viewZoom = map.getView().getZoom();
    // console.log(viewZoom);
    if (viewZoom <= 16 && scale_flag != 0) {
        scale = 0.07;
        scale_flag = 0;
        remark();
    } else if (viewZoom <= 17 && scale_flag != 1) {
        scale = 0.12;
        scale_flag = 1;
        remark();
    } else if (viewZoom > 17 && scale_flag != 2) {
        scale = 0.15;
        scale_flag = 2;
        remark();
    }
}


function remark() {
    if (tableSort == 0) {
        lampLocal.find({}).sort({ hmiID: tableSortHmiID }).exec(function(err, docs) {
            if (lampLocalLayer == null) {
                //实时水情标注的矢量图层
                lampLocalLayer = new ol.layer.Vector({
                    source: vectorSource
                });
                map.addLayer(lampLocalLayer);
            }
            lampLocalLayer.getSource().clear();
            addMarkers(docs);
            // console.log("viewZoom");
        });
    } else if (tableSort == 1) {
        lampLocal.find({}).sort({ Date: tableSortTime }).exec(function(err, docs) {
            if (lampLocalLayer == null) {
                //实时水情标注的矢量图层
                lampLocalLayer = new ol.layer.Vector({
                    source: vectorSource
                });
                map.addLayer(lampLocalLayer);
            }
            lampLocalLayer.getSource().clear();
            addMarkers(docs);
            // console.log("viewZoom");
        });
    }

}


/*
 *  
 */
function addMarkers(resInfoArray) {
    if (lampLocalLayer == null) {

        lampLocalLayer = new ol.layer.Vector({
            source: vectorSource
        });
        map.addLayer(lampLocalLayer);
    }

    for (var i = 0; i < resInfoArray.length; i++) {
        var lon = resInfoArray[i].east; //X值
        var lat = resInfoArray[i].north; //Y值
        var coordinate = [parseFloat(lon), parseFloat(lat)]; //坐标点（ol.coordinate）
        var imgURL = "./web/Source/img/lampWhite.png"; //正常类型标注图标
        //新建标注（Vector要素），通过矢量图层添加到地图容器中
        markerFeature = new ol.Feature({
            geometry: new ol.geom.Point(coordinate), //几何信息（坐标点）
            info: resInfoArray[i], //标注的详细信息
            imgURL: imgURL, //标注图标的URL地址
            fid: i.toString(),
            hmiID: resInfoArray[i].hmiID
        });
        markerFeature.setStyle(createLabelTextStyle(markerFeature, imgURL, (scale * 0.8), 0));
        lampLocalLayer.getSource().addFeature(markerFeature);
        if (lampLocalArray == null) {
            lampLocalArray = new Array();
        }
        lampLocalArray.push(markerFeature);
    }
}

function moveTo(feature) {
    var geo = feature.getGeometry();
    var coordinate = geo.getCoordinates(); //获取要素点坐标
    map.getView().setCenter(coordinate); //设置地图中心点
}

var tableSort = 0;
var tableSortHmiID = -1;
var tableSortTime = 1;

function tableIDInforFunc(resInfoArray) {
    var tmpHtml = '<table class="table table-bordered table-condensed"><thead><tr><th class="text-center table-num">编号</th><th class="text-center table-current">电流</th><th class="text-center table-voltage">电压</th><th class="text-center table-time">更新时间</th></tr></thead>';
    tmpHtml += "<tbody>";
    for (var i = 0; i < resInfoArray.length; i++) {
        var rowData = resInfoArray[i];
        var upDate = new Date(rowData.upDate);
        // var myYear = upDate.getFullYear().toString().substr(parseInt(upDate.getFullYear().toString().length) - 2);
        // var myMon = ('0' + (upDate.getMonth() + 1)).slice(-2);
        // var myDay = ('0' + upDate.getDate()).slice(-2);
        var myHour = ('0' + upDate.getHours()).slice(-2);
        var myMin = ('0' + upDate.getMinutes()).slice(-2);
        var mySec = ('0' + upDate.getSeconds()).slice(-2);
        // substr(parseInt(filesDb[j].length) - 3)
        var myTime = /*myYear + "-" + myMon + "-" + myDay + "-" +*/ myHour + ":" + myMin + ":" + mySec;
        // console.log(myYear);
        if (upDate.getFullYear() < 2018) {
            myTime = null;
        }
        tmpHtml += "<tr class='tableTr'><td>" + rowData.hmiID + "</td><td>" + rowData.current + "</td><td>" + rowData.voltage + "</td><td>" +
            myTime + "</td></tr>";
    }

    tmpHtml += "</tbody></table>";
    $("#tableIDInformation").text("");
    $("#tableIDInformation").append(tmpHtml);
    //表格操作显示
    $(".tableTr").hover(function() {
        $(this).css("cursor", " pointer");
        $(this).addClass("b");
    }, function() {
        $(this).removeClass("b");
    });
    $(".tableTr").click(function() {
        $(this).addClass("a").siblings("tr").removeClass("a");
        var index = $(".tableTr").index($(this));
        moveTo(lampLocalArray[index]); //以当前要素为中心点移动地图
        dataToDraw(parseInt(lampLocalArray[index].get('info').actualID), parseInt(lampLocalArray[index].get('info').hmiID));
        $("#drawDataID").show();
    });

    /******编号排序********/
    $(".table-num").hover(function() {
        $(this).css("cursor", " pointer");
        $(this).addClass("b");
    }, function() {
        $(this).removeClass("b");
    });
    $(".table-num").click(function() {
        $(this).addClass("a").siblings("th").removeClass("a");
        tableSort = 0;
        tableSortHmiID = (tableSortHmiID == 1) ? (-1) : 1;
        // // tableSortTime = 1;
        // // console.log("num");
        // if (tableSortHmiID) {console.log("num");}
        retable();
    });

    /******时间排序********/
    $(".table-time").hover(function() {
        $(this).css("cursor", " pointer");
        $(this).addClass("b");
    }, function() {
        $(this).removeClass("b");
    });
    $(".table-time").click(function() {
        $(this).addClass("a").siblings("th").removeClass("a");
        tableSort = 1;
        tableSortTime = (tableSortTime == 1) ? (-1) : 1;
        retable();
    });
    /*为了保持能刷新后保持颜色*/
    if (tableSort) {
        $(".table-time").addClass("a").siblings("th").removeClass("a");

    } else {
        $(".table-num").addClass("a").siblings("th").removeClass("a");
    }

}


function showApplyContainer() {

    if (document.getElementById("imgApply").name == "show") {
        document.getElementById("imgApply").name = "hide";
        $("#comApply").hide("slow");
        $(".closeDiv").hide("slow");
    } else {
        document.getElementById("imgApply").name = "show";
        $("#comApply").show("slow");
        $(".closeDiv").show("slow");
    }

}

function showDataInfo() {
    if ($("#datainfo").get(0).checked)
        $(".sqDiv").show("slow");
    else
        $(".sqDiv").hide("slow");
}

/**
 * 创建标注样式函数
 * @param {ol.Feature} feature 要素
 * @param {string} imgURL image图标URL
 * @param {number} image图标缩放比
 */
var createLabelTextStyle = function(feature, imgURL, scale, text) {
    var myText = "";
    if (text) {
        myText = feature.get('hmiID').toString();
    }

    return new ol.style.Style({
        image: new ol.style.Icon( /** @type {olx.style.IconOptions} */ ({
            anchor: [0.5, 0.5],
            // anchorOrigin: 'top-right',
            // anchorXUnits: 'fraction',
            // anchorYUnits: 'pixels',
            // offsetOrigin: 'top-right',
            // offset:[-7.5,-15],
            scale: scale, //图标缩放比例
            opacity: 1, //透明度
            src: imgURL //图标的url
        })),
        text: new ol.style.Text({
            text: myText,
            font: 'normal normal bold 50px arial,sans-serif',
            offsetY: -30,
            fill: new ol.style.Fill({ color: '#000000' })
        }),

    });
};
/*备份地图id和坐标*/
function backupLamp() {
    var saveDate = new Date();
    var myYear = saveDate.getFullYear().toString().substr(parseInt(saveDate.getFullYear().toString().length) - 2);
    var myMon = ('0' + (saveDate.getMonth() + 1)).slice(-2);
    var myDay = ('0' + saveDate.getDate()).slice(-2);
    var myHour = ('0' + saveDate.getHours()).slice(-2);
    var myMin = ('0' + saveDate.getMinutes()).slice(-2);
    var mySec = ('0' + saveDate.getSeconds()).slice(-2);
    var myTime = myYear + "-" + myMon + "-" + myDay + "   " + myHour + "-" + myMin + "-" + mySec;
    fs.writeFileSync('./web/data/lampBackups/lampBackup.db', fs.readFileSync('./web/data/lampBackup.db'));
    fs.renameSync('./web/data/lampBackups/lampBackup.db', './web/data/lampBackups/lampBackup' + myTime + '.db');

}