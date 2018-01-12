#Lora智控路灯--网页Demo

##导语
> * 本文使用Sublime Text 3编辑，**OmniMarkupPreviewer / markdownlivepreview** 插件编译 (**ctrl+alt+o / alt+m**)  生成预览。*建议使用markdown preview*

> * Ubuntu下使用:bash ~/sublime 解决中文无法输入问题
> * 如出现错误 "buffer_id(29) is not valid (closed or unsupported file format)"
    Preferences → Package Settings → OmniMarkupPreviewer → Settings - User　复制和粘贴下面的代码。
            {
           "renderer_options-MarkdownRenderer": {
           "extensions": ["tables", "fenced_code", "codehilite"]
           }
           }

##目录

[TOC]


### 版本说明

####V0.1
- 可以手动在地图上随意添加圆点

####V0.2
- 数据库连接正常

####V0.3
- 坐标信息写入数据库

####V037
- 数据表格的淡入淡出
- 数据的可视化界面（柱状图和折线图等）

####V0.4 
- 数据库改为MySQL
- 坐标和ID信息写入数据库

####V0.5
- 数据库读取经纬度，并在地图显示


####20180110
- 完成基础功能

####20180111
- 数据库采用日期排序的nedb，日期前自动补0
- 添加lampBackup数据库,只记录id和坐标，每次操作都会备份到文件夹
- 各个数据库的操作
- 点击table按照编号或者时间排序


