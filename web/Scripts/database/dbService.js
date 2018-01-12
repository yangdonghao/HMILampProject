var Datastore = require('nedb');
var lampLocal = new Datastore({ filename: './web/data/lampLocal.db', autoload: true });
var netUidConnect = new Datastore({ filename: './web/data/netUidConnect.db', autoload: true });
var myDate = new Date();
var myyymmdd = myDate.getFullYear().toString() + ('0' + (myDate.getMonth() + 1)).slice(-2).toString() + ('0' + myDate.getDate()).slice(-2).toString();
var dataVandA = new Datastore({ filename: './web/data/dataDate/dataVandA' + myyymmdd + '.db', autoload: true });
var lampBackup = new Datastore({ filename: './web/data/lampBackup.db', autoload: true });
var fs = require('fs'); // 引入fs模块