/**
 * 绘制结束事件的回调函数，
 * @param {ol.interaction.DrawEvent} evt 绘制结束事件
 */
var coordinates;

function drawEndCallBack(coord) {
    // inputHandUserid();
    $("#lampInputInform").modal();
    coordinates = coord;
}
/**
 * 提交数据到后台保存
 * @param {string} geoData 几何数据
 */
function saveData(hmiID, actualID, east, north, lampModel, lampInformation) {

    lampBackup.count({ $or: [{ hmiID: hmiID }, { actualID: actualID }] }, function(err, count) {
        if (count == 0) {
            // dataNow.insert([{ hmiID: hmiID, voltage: null, current: null, Date: null }], function(err) {});
            //添加信息
            lampLocal.insert([{ hmiID: hmiID, actualID: actualID, east: east, north: north, lampModel: lampModel, lampInformation: lampInformation, Date: new Date(), voltage: null, current: null, upDate: null }], function(err, newDocs) {
                loadLayers(); //重新加载一次
                // if (fs.existsSync('./web/dataTool/dataID/' + hmiID) == false) {
                //     fs.mkdir('./web/dataTool/dataID/' + hmiID, function(err) {}); //创建hmiID目录
                // }
            });
            lampBackup.insert([{ hmiID: hmiID, actualID: actualID, east: east, north: north, lampModel: lampModel, lampInformation: lampInformation, Date: new Date() }], function(err, newDocs) {
                backupLamp();

            });

        } else {
            console.log('ID已存在');
        }
    });
}

/**
 * 将绘制的几何数据与对话框设置的属性数据提交到后台处理
 */
function submitData() {
    var hmiID = $.trim($("#txthmiID").val()); //获取输入数据，$.trim是去掉空格 
    var actualID = $.trim($("#txtactualID").val()); //获取输入数据，$.trim是去掉空格
    var lampModel = $.trim($("#lampModel").val());
    var lampInformation = $.trim($("#lampInformation").val());
    if (hmiID != "" && hmiID != null && actualID != "" && actualID != null && coordinates[0] != null && coordinates[1] != null) {
        hmiID = parseInt(hmiID);
        actualID = parseInt(actualID);
        saveData(hmiID, actualID, coordinates[0], coordinates[1], lampModel, lampInformation); //将数据提交到后台处理（保存到数据库中）
    }
}