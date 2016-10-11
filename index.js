'use strict';

var fis3map = require('fis3-packager-map');

module.exports = function(ret, conf, setting, opt){
    //first, call fis3's map
    fis3map(ret, conf, setting, opt);

    //处理urimap
    var uriMap = ret.uriMap = ret.uriMap || {}, _ = feather.util.merge(feather.util.merge({}, ret.src), ret.pkg);

    feather.util.map(_, function(subpath, item){
        if(item.isJsLike || item.isCssLike){
            uriMap[item.getUrl()] = item.id;
        }
    });

    require('./map.js')(ret, conf, setting, opt);


    //save engine config
    var config = {
        suffix: feather.config.get('template.suffix'),
        mustache: feather.config.get('template.mustache')
    };

    if(feather.config.get('autoPack.type') == 'combo'){
        config.combo = feather.config.get('autoPack.options');
    }
    
    var configFile = feather.file.wrap(feather.project.getProjectPath() + '/conf/engine.json');
    configFile.setContent(JSON.stringify(config));
    ret.pkg[configFile.subpath] = configFile;
};