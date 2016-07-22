'use strict';

var fis3map = require('fis3-packager-map');

module.exports = function(ret, conf, setting, opt){
    //first, call fis3's map
    fis3map(ret, conf, setting, opt);

    //处理urimap
    var uriMap = ret.uriMap = {}, _ = feather.util.merge(feather.util.merge({}, ret.src), ret.pkg);

    feather.util.map(_, function(subpath, item){
        if(item.isJsLike || item.isCssLike){
            uriMap[item.getUrl()] = item.id;
        }
    });

    require('./map.js')(ret, conf, setting, opt);
};