//地图初始化Start**********************************
var map; //地图容器

//图层初始化Start**********************
//底层图层
var basicLayer = new ol.layer.Tile({
    //source: new ol.source.OSM()
    source: new ol.source.XYZ({
        url: './web/Source/offlineTile/{z}/{x}/{y}.png'
    })
});
//矢量图层
var markerFeature; //标注（矢量要素）
var vectorSource = new ol.source.Vector({
    features: markerFeature,
    wrapX: false
});
//图层初始化End**********************

//操作元素
var preFeature = null; //鼠标选中的前一要素
var feature = null;
//初始化地图容器
map = new ol.Map({
    layers: [basicLayer],
    view: new ol.View({
        extent: ol.proj.transformExtent([118.2885, 32.2739258051, 118.316, 32.2822528613], 'EPSG:4326', 'EPSG:3857'),
        center: ol.proj.transform([118.308, 32.27737], 'EPSG:4326', 'EPSG:3857'),
        zoom: 16,
        minZoom: 16,
        maxZoom: 21
    }),
    logo: false,
    target: 'map',
    interactions: ol.interaction.defaults({
        doubleClickZoom: false,
    }).extend([])
});
/*
 *  页面初始化，在页面加载完成之后执行
 */
$(function() {
    initMap(); //初始化地图容器
    loadLayers();
});

function initMap() {
    Modify.init(); //初始化几何图形修改控件
    Modify.setActive(true); //激活几何图形修改控件;
}

//地图初始化End**********************************

//map调用事件Start************************************

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

map.on('dblclick', function(evt) {
    if (addLampSelect.checked) {
        feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, lampLocalLayer) { return feature; });
        if (feature) {
            //mark
            if (hmiIDGlobal == null)
                hmiIDGlobal = feature.get('hmiID');
        }
    }
});

//获取图层等级
map.getView().on('change:resolution', checkZoom);

map.on('singleclick', function(evt) {
    if (addLampSelect.checked) {
        var coordinate = evt.coordinate;
        drawEndCallBack(coordinate);
    } else if (addLampSelect.checked == 0 && deleteLampSelect.checked == 0) { //弹窗,历史数据
        //判断当前单击处是否有要素，捕获到要素时弹出   popup
        feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) { return feature; });
        if (feature) {
            var actualID = parseInt(feature.get('info').actualID); //转换为整数
            dataToDraw(parseInt(feature.get('info').actualID), parseInt(feature.get('info').hmiID));
            $("#drawDataID").show();
        }
    } else if (deleteLampSelect.checked) {
        //判断当前单击处是否有要素，捕获到要素时删除灯
        feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) { return feature; });
        if (feature) {
            var deletehmiID = feature.get('hmiID');
            lampLocal.remove({
                    hmiID: deletehmiID
                },
                function(err, newDocs) {
                    loadLayers();
                }
            );
            lampBackup.remove({
                    hmiID: deletehmiID
                },
                function(err, newDocs) {
                    backupLamp();
                }
            );
        }
    }
});

var isDragging = null;
map.on('pointermove', function(evt) {

    var pixel = map.getEventPixel(evt.originalEvent);
    var hit = map.hasFeatureAtPixel(pixel);
    if (addLampSelect.checked == true) {
        map.getTargetElement().style.cursor = hit ? "pointer" : "url('./web/Source/img/cursor.ico'),auto";
    } else if (addLampSelect.checked == false) {
        map.getTargetElement().style.cursor = hit ? "pointer" : "";
    }


    if (evt.dragging == true) {
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
                if (feature.get('hmiID') != hmiIDGlobal) {
                    // console.log('hmiID不同');
                    hmiIDGlobal = null;
                    return;
                }
                // console.log('移动结束', parseInt(hmiIDGlobal));
                var geo = feature.getGeometry(); //获取标注要素点的几何
                var coordinate = geo.getCoordinates(); //获取要素点坐标
                lampLocal.update({ hmiID: parseInt(hmiIDGlobal) }, { $set: { east: coordinate[0], north: coordinate[1] } }, { upsert: true },
                    function(err, numAffected) {
                        lampLocal.loadDatabase(function(err) {
                            remark();
                        });
                    });
                lampBackup.update({ hmiID: parseInt(hmiIDGlobal) }, { $set: { east: coordinate[0], north: coordinate[1] } }, { upsert: true },
                    function(err, numAffected) {
                        lampBackup.loadDatabase(function(err) {
                            backupLamp();
                        });
                    });
                hmiIDGlobal = null;
            }
        }
        //判断当前鼠标悬停位置处是否有要素，捕获到要素时设置图标样式
        feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) { return feature; });
        if (feature) {
            if ((preFeature != null) && (preFeature !== feature)) { //如果当前选中要素与前一选中要素不同，恢复前一要素样式，放大当前要素图标
                feature.setStyle(createLabelTextStyle(feature, feature.get('imgURL'), (scale * 1.3), 1)); //0.2  0.15
                preFeature.setStyle(createLabelTextStyle(preFeature, preFeature.get('imgURL'), (scale * 0.8), 0));
                preFeature = feature;
            }
            if (preFeature == null) { //如果前一选中要素为空，即当前选中要素为首次选中要素，放大当前要素图标
                feature.setStyle(createLabelTextStyle(feature, feature.get('imgURL'), (scale * 1.3), 1));
                preFeature = feature;
            }
        } else {
            if (preFeature != null) { //如果鼠标移出前一要素，恢复要素图标样式
                preFeature.setStyle(createLabelTextStyle(preFeature, preFeature.get('imgURL'), (scale * 0.8), 0));
                preFeature = null;
            }
        }
    }
    // 调用磁吸效果
    // var coordinateTemp = map.getEventCoordinate(evt.originalEvent);
    // displaySnap(coordinateTemp);
});
//map调用事件End************************************

