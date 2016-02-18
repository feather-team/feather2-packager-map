'use strict';

var TYPES = ['headJs', 'bottomJs', 'css'];

module.exports = function(ret, conf, setting, opt){
    var uriMap = ret.uriMap, commonMap = feather.commonInfo.map;

    feather.util.map(ret.src, function(path, file){
        if(!file.isHtmlLike) return;

        TYPES.forEach(function(type){
            var links = [];

            (file.extras[type] || []).forEach(function(url){
                var _url = url.replace(/^\/+/, '');

                if(!uriMap[url] && !commonMap[_url] && !ret.map.res[_url] && !feather.util.isRemoteUrl(url)){
                    feather.log.warn(file.id + ':[' + url + '] is not exists!');
                    links.push(url);
                }else{
                    links.push(uriMap[url] || _url);
                }
            });

            file.extras[type] = feather.util.unique(links);
        });
    });
};