'use strict';

var fis3map = require('fis3-packager-map');

module.exports = function(ret, conf, setting, opt){
    //first, call fis3's map
    fis3map(ret, conf, setting, opt);

    require('./process/create-commonjs.js')(ret, conf, setting, opt);

    //处理urimap
    var uriMap = ret.uriMap = {}, _ = feather.util.merge(feather.util.merge({}, ret.src), ret.pkg);

    feather.util.map(_, function(subpath, item){
        if(item.isJsLike || item.isCssLike){
            uriMap[item.getUrl()] = item.id;
        }
    });

    require('./map.js')(ret, conf, setting, opt);

    var path = feather.project.getCachePath() + '/info/' + feather.config.get('project.name') + '.json';
    var modulename = feather.config.get('project.modulename');

    if(modulename == 'common' || !modulename){
        var content = {
            config: feather.config.get(),
            components: feather.releaseInfo.components,
            map: {},
            modules: {}
        };

        feather.util.map(ret.src, function(subpath, file){
            content.map[file.id] = file.extras;
        });
    }else{
        var content = feather.releaseInfo;
    }

    content.modules[modulename] = {
        modifyTime: Date.now()
    };

    feather.util.write(path, feather.util.json(content));
};