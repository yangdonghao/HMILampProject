/************************************************************************/
/* 智能路灯管理网页
*@CSV R&D
/************************************************************************/

var map; //地图容器
var winHeight; //屏幕当前高度
var winWidth; //屏幕当前宽度

var popup; //弹出的Popup
var popupElement = $("#popup");
var popupContent = $("#popup-content");
var popupCloser = $("#popup-closer");

var preFeature = null; //鼠标选中的前一要素
//矢量图层资源
var vectorSource = new ol.source.Vector({
    features: markerFeature,
    wrapX: false
});
/*
 *  页面初始化，在页面加载完成之后执行
 */
$(function() {
    // adminRightEndTimer = 1;
    // dbInit();
    initMap(); //初始化地图容器
    loadLayers();

    winWidth = $(window).width();
    winHeight = $(window).height();
    // $("#map").animate({ width: winWidth, height: winHeight });
});

//html文件，用户功能选择
var addLampSelect = document.getElementById('addLamp');
var deleteLampSelect = document.getElementById('deleteLamp');
var finishLampSelect = document.getElementById('finishLamp');
var adminOperationSelect = document.getElementsByName('adminOperation');


/*
 *  地图容器初始化
 */
var basicLayer;
var isDragging = null;
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
/********************
删除文件夹及其文件夹下的所有文件
*********************/
function deleteFile(path) {
    if (fs.existsSync(path)) {
        var files = [];
        files = fs.readdirSync(path);
        files.forEach(function(file, index) {
            var curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

//地图初始化Start**********************************
//底层图层
basicLayer = new ol.layer.Tile({
    //source: new ol.source.OSM()
    source: new ol.source.XYZ({
        url: './web/Source/offlineTile/{z}/{x}/{y}.png'
    })
});

//初始化地图容器
map = new ol.Map({
    // controls: ol.control.defaults().extend([
    //     new ol.control.FullScreen()
    // ]),
    layers: [basicLayer],
    view: new ol.View({
        //extent: [118.2821989059, 32.2739258051, 118.3194923401, 32.2822528613],
        //extent: ol.proj.transform([118.2821989059, 32.2739258051, 118.3194923401, 32.2822528613],'EPSG:4326', 'EPSG:3857'),
        extent: ol.proj.transformExtent([118.2885, 32.2739258051, 118.316, 32.2822528613], 'EPSG:4326', 'EPSG:3857'),
        // 32.2817086326,118.2821989059
        // 32.2744156531,118.2827782631
        // 32.2739258051,118.3194923401
        // 32.2822528613,118.3177757263
        center: ol.proj.transform([118.308, 32.27737], 'EPSG:4326', 'EPSG:3857'),
        zoom: 16,
        minZoom: 16,
        maxZoom: 21

    }),
    // logo: {src: '../img/face_monkey.png', href: 'http://www.openstreetmap.org/'},
    logo: false,
    // logo: {src: './web/Source/img/logo.ico'},
    target: 'map',
    interactions: ol.interaction.defaults({
        doubleClickZoom: false,
    }).extend([])
});


function initMap() {

    Modify.init(); //初始化几何图形修改控件
    Modify.setActive(true); //激活几何图形修改控件;
    /**
     * 为map添加鼠标移动事件监听，当指向标注时改变鼠标光标状态
     */
    map.on('pointermove', function(e) {
        var pixel = map.getEventPixel(e.originalEvent);
        var hit = map.hasFeatureAtPixel(pixel);
        if (addLampSelect.checked == true) {
            map.getTargetElement().style.cursor = hit ? "pointer" : "url('./web/Source/img/cursor.ico'),auto";
        } else if (addLampSelect.checked == false) {
            map.getTargetElement().style.cursor = hit ? "pointer" : "";
        }
    });
    /**
     * 在地图容器中创建一个Overlay
     */
    /** @type {olx.OverlayOptions} */
    popup = new ol.Overlay(({
        element: document.getElementById('popup'), // popupElement,
        autoPan: true,
        positioning: 'bottom-center',
        stopEvent: false,
        autoPanAnimation: {
            duration: 250
        }
    }));
    map.addOverlay(popup);

    var feature;
    /**
     * 为map添加点击事件监听，渲染弹出popup
     */
    map.on('singleclick', function(evt) {

        // var adminOperation = document.getElementsByName("adminOperation");
        if (addLampSelect.checked) {
            var coordinate = evt.coordinate;
            drawEndCallBack(coordinate);
        } else if (addLampSelect.checked == 0 && deleteLampSelect.checked == 0) { //弹窗,历史数据
            // var coordinate = evt.coordinate;
            //判断当前单击处是否有要素，捕获到要素时弹出   popup
            feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) { return feature; });
            if (feature) {
                var type = feature.get('featureType');
                if (type == undefined) {
                    return;
                }
                var actualID = parseInt(feature.get('info').actualID); //转换为整数
                // console.log('ok', actualID);
                dataToDraw(parseInt(feature.get('info').actualID), parseInt(feature.get('info').hmiID));
                $("#drawDataID").show();


            }
        } else if (deleteLampSelect.checked) {
            // var coordinate = evt.coordinate; //此为点击时的坐标，用法：coordinate[0],coordinate[1]
            //判断当前单击处是否有要素，捕获到要素时删除   灯
            feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) { return feature; });
            if (feature) {
                var type = feature.get('featureType');
                if (type == undefined) {
                    return;
                }
                // var geo = feature.getGeometry(); //获取标注要素点的几何
                // var coordinate = geo.getCoordinates(); //获取要素点坐标
                var deletehmiID = feature.get('hmiID');
                // var lon = coordinate[0]; //经度
                // var lat = coordinate[1]; //纬度
                // 删除单项
                lampLocal.remove({
                        // east: lon,
                        // north: lat
                        hmiID: deletehmiID
                    },
                    function(err, newDocs) {
                        // map.removeOverlay(lampLocalLayer);
                        // deleteFile("./web/dataTool/dataID/" + deletehmiID);
                        loadLayers();
                    }
                );
                lampBackup.remove({
                        // east: lon,
                        // north: lat
                        hmiID: deletehmiID
                    },
                    function(err, newDocs) {
                        backupLamp();
                    }
                );
            }
        }
    });
    /**
     * 为map添加move事件监听，变更图标大小实现选中要素的动态效果
     */
    map.on('pointermove', function(evt) {
        if (evt.dragging == true) {
            // console.log('dragging');
            if (addLampSelect.checked) {
                isDragging = true;
                Modify.setActive(true); //激活几何图形修改控件;
            }

        } else if (evt.dragging == false) {
            if (isDragging == true && addLampSelect.checked) {
                // console.log('not');
                isDragging = false;
                Modify.setActive(false);
                Modify.setActive(true);
                //判断当前鼠标悬停位置处是否有要素，捕获到要素时设置图标样式
                feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) { return feature; });
                if (feature) {
                    var type = feature.get('featureType');
                    if (type == undefined) {
                        hmiIDGlobal = null;
                        return;
                    }
                    if (feature.get('hmiID') != hmiIDGlobal) {
                        console.log('hmiID不同');
                        hmiIDGlobal = null;
                        return;
                    }
                    // if(feature.get('hmiID')==)
                    console.log('移动结束', parseInt(hmiIDGlobal));
                    var geo = feature.getGeometry(); //获取标注要素点的几何
                    var coordinate = geo.getCoordinates(); //获取要素点坐标
                    // console.log('coordinate:', coordinate);
                    // console.log('hmiIDGlobal:', hmiIDGlobal);
                    lampLocal.update({ hmiID: parseInt(hmiIDGlobal) }, { $set: { east: coordinate[0], north: coordinate[1] } }, { upsert: true },
                        function(err, numAffected) {
                            // console.log('ok', numAffected);
                            lampLocal.loadDatabase(function(err) {
                                // console.log(err);
                                remark();
                            });
                        });
                    lampBackup.update({ hmiID: parseInt(hmiIDGlobal) }, { $set: { east: coordinate[0], north: coordinate[1] } }, { upsert: true },
                        function(err, numAffected) {
                            // console.log('ok', numAffected);
                            lampBackup.loadDatabase(function(err) {
                                backupLamp();
                            });
                        });
                    hmiIDGlobal = null;
                }
            }
            // var coordinate = evt.coordinate;
            //判断当前鼠标悬停位置处是否有要素，捕获到要素时设置图标样式
            feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) { return feature; });
            if (feature) {
                // console.log('feature', feature);
                var type = feature.get('featureType');
                if (type == undefined) {
                    return;
                }
                // console.log('feature2');
                if ((preFeature != null) && (preFeature !== feature)) { //如果当前选中要素与前一选中要素不同，恢复前一要素样式，放大当前要素图标
                    var curImgURL = feature.get('imgURL');
                    var preImgURL = preFeature.get('imgURL');
                    feature.setStyle(createLabelTextStyle(feature, curImgURL, (scale * 1.3), 1)); //0.2  0.15
                    preFeature.setStyle(createLabelTextStyle(preFeature, preImgURL, (scale * 0.8), 0));
                    preFeature = feature;
                }
                if (preFeature == null) { //如果前一选中要素为空，即当前选中要素为首次选中要素，放大当前要素图标
                    var curImgURL = feature.get('imgURL');
                    feature.setStyle(createLabelTextStyle(feature, curImgURL, (scale * 1.3), 1));
                    preFeature = feature;
                }
            } else {
                if (preFeature != null) { //如果鼠标移出前一要素，恢复要素图标样式
                    var imgURL = preFeature.get('imgURL');
                    preFeature.setStyle(createLabelTextStyle(preFeature, imgURL, (scale * 0.8), 0));
                    preFeature = null;
                }
            }
        }
        // 磁吸效果
        var coordinateTemp = map.getEventCoordinate(evt.originalEvent);
        displaySnap(coordinateTemp);
    });
    map.on('dblclick', function(evt) {
        if (addLampSelect.checked) {
            feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, lampLocalLayer) { return feature; });
            if (feature) {
                var type = feature.get('featureType');
                if (type == undefined) {
                    return;
                }
                //mark
                if (hmiIDGlobal == null)
                    hmiIDGlobal = feature.get('hmiID');
            }
        }
    });
    map.on('click', function(evt) {
        // console.log('click');
    });
    //checkZoom为调用的函数
    map.getView().on('change:resolution', checkZoom);
}
<<<<<<< HEAD
var timeINt = self.setInterval("clock()", 5000);

function clock() {

    console.log('click');
}
=======

var stroke = new ol.style.Stroke({
    color: 'rgba(255,255,0,0.9)',
    width: 3
});
var styleMagnetism = new ol.style.Style({
    stroke: stroke,
    image: new ol.style.Circle({
        radius: 10,
        stroke: stroke
    })
});

map.on('postcompose', function(evt) {
    var vectorContext = evt.vectorContext;
    vectorContext.setStyle(styleMagnetism);
    if (point !== null) {
        vectorContext.drawGeometry(point);
    }
    if (line !== null) {
        vectorContext.drawGeometry(line);
    }
});


>>>>>>> 99c7314bb465f5e81c445ed3e00c34f4c063197d
var hmiIDGlobal = null;

/***********************************调用数据库数据地图显示start*******************************/
var lampLocalLayer = null; /*路灯标记点图层*/
var lampLocalArray = null; //路灯标注数组，用来联系地图上添加的标注与路灯表格数据
var lampMarkerDetailData = null; //记录每个标注的详细信息
function loadLayers() {
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
            tableIDInforFunc(docs);
            // addResInfoToTable(docs); //第二个操作：将数据填到实时水情表格中，并将表格和标注联系起来
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
            tableIDInforFunc(docs);
            // addResInfoToTable(docs); //第二个操作：将数据填到实时水情表格中，并将表格和标注联系起来
        });
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

function retable() {

    if (tableSort == 0) {
        lampLocal.find({}).sort({ hmiID: tableSortHmiID }).exec(function(err, docs) {
            if (lampLocalLayer == null) {
                //实时水情标注的矢量图层
                lampLocalLayer = new ol.layer.Vector({
                    source: vectorSource
                });
                map.addLayer(lampLocalLayer);
            }
            // lampLocalLayer.getSource().clear();
            tableIDInforFunc(docs);
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
            // lampLocalLayer.getSource().clear();
            tableIDInforFunc(docs);
            // console.log("viewZoom");
        });
    }
}

<<<<<<< HEAD
=======
var markerFeature; //标注（矢量要素）
>>>>>>> 99c7314bb465f5e81c445ed3e00c34f4c063197d
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
<<<<<<< HEAD
            featureType: "lamp", //类型（河流）
=======
            type: "river",
>>>>>>> 99c7314bb465f5e81c445ed3e00c34f4c063197d
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