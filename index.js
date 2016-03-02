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

    if(feather.config.get('project.modulename') == 'common'){
        var path = feather.project.getCachePath() + '/info/' + feather.config.get('project.name') + '.json';
        var content = {
            config: feather.config.get(),
            components: feather.commonInfo.components,
            map: {}
        };

        feather.util.map(ret.src, function(subpath, file){
            content.map[file.id] = file.extras;
        });

        feather.util.write(path, feather.util.json(content));
    }
};