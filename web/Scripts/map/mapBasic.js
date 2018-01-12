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