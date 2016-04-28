'use strict';

var fis3map = require('fis3-packager-map');

module.exports = function(ret, conf, setting, opt){
    ret.start = Date.now();
    // feather.util.map(ret.src, function(subpath, file){
    //     console.log(subpath, file._fromCache);
    // });

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

    if(feather.config.get('project.mode') != 'php'){
        require('./basic-map.js')(ret, conf, setting, opt);
    }

    var path = feather.project.getCachePath() + '/info/' + feather.config.get('project.name') + '.json';
    var modulename = feather.config.get('project.modulename');

    if(modulename == 'common' || !modulename){
        var content = {
            config: feather.config.get(),
            components: feather.commonInfo.components,
            map: {},
            moduleInfo: {}
        };

        feather.util.map(ret.src, function(subpath, file){
            content.map[file.id] = file.extras;
        });
    }else{
        var content = feather.commonInfo;
    }

    content.moduleInfo[modulename] = {
        modifyTime: Date.now()
    };

    feather.util.write(path, feather.util.json(content));
};