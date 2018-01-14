var Datastore = require('nedb');
var lampLocal = new Datastore({ filename: './web/data/lampLocal.db', autoload: true });
var netUidConnect = new Datastore({ filename: './web/data/netUidConnect.db', autoload: true });
var myDate = new Date();
var myyymmdd = myDate.getFullYear().toString() + ('0' + (myDate.getMonth() + 1)).slice(-2).toString() + ('0' + myDate.getDate()).slice(-2).toString();
var dataVandA = new Datastore({ filename: './web/data/dataDate/dataVandA' + myyymmdd + '.db', autoload: true });
var lampBackup = new Datastore({ filename: './web/data/lampBackup.db', autoload: true });
var fs = require('fs'); // 引入fs模块

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