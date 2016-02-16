'use strict';

var fis3map = require('fis3-packager-map');

module.exports = function(ret, conf, setting, opt){
    //first, call fis3's map
    fis3map(ret, conf, setting, opt);

    var commonMap = {}, modulename = feather.config.get('project.modulename'), ns = feather.config.get('project.name');
    
    //查找是否有common模块
    if(modulename && modulename != 'common'){
        var root = feather.project.getTempPath() + '/release/' + ns + '/common.json';

        if(feather.util.exists(root)){
            commonMap = feather.util.readJSON(root);
        }
    }

    ret.commonMap = commonMap;

    //处理urimap
    var uriMap = ret.uriMap = {}, _ = feather.util.merge(feather.util.merge({}, ret.src), ret.pkg);

    feather.util.map(_, function(subpath, item){
        if(item.isJsLike || item.isCssLike){
            uriMap[item.getUrl()] = item.id;
        }
    });

    //process start
    var process = ['create-commonjs', 'collect-resource'];

    process.forEach(function(process){
        require('./process/' + process + '.js')(ret, conf, setting, opt); 
    });

    require('./map.js')(ret, conf, setting, opt);

    var path = feather.project.getTempPath() + '/release/map.json';
    var content = {
        commonResource: ret.commonResource,
        map: {}
    };

    feather.util.map(ret.src, function(subpath, file){
        content.map[file.id] = file.extras;
    });
    
    feather.util.write(path, JSON.stringify(content));
};