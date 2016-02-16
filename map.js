function getPkgHas(ret, pkgFile){
    var url = pkgFile.getUrl(), pkgs = ret.map.pkg;

    for(var i in pkgs){
        if(pkgs[i].uri == url){
            return pkgs[i].has;
        }
    }
}

module.exports = function(ret){
    var files = feather.util.merge(feather.util.merge({}, ret.src), ret.pkg);
    var hash = {map: {}}, modulename = feather.config.get('project.modulename');

    feather.util.map(files, function(path, file){
        var _ = {}, extras = file.extras;

        if(file.isHtmlLike){
            ['widget', 'headJs', 'bottomJs', 'css'].forEach(function(type){
                if(extras[type].length){
                    _[type] = extras[type];
                }
            });
        }else{
            _.url = file.getUrl();

            var map = ret.map.res[file.id];

            if(map){
                if(map.pkg){
                    _.pkg = ret.uriMap[ret.map.pkg[map.pkg].uri];
                }
            }else{
                var has = getPkgHas(ret, file);

                if(has){
                    _.isPkg = true;
                    _.has = getPkgHas(ret, file);
                }
            }
        }

        if(extras.async && extras.async.length){
            _.async = extras.async;
        }

        if(file.requires.length){
            _.deps = file.requires;
        }

        if(file.isPagelet){
            _.isPagelet = true;
        }else if(file.isWidget){
            _.isWidget = true;
        }else if(file.isComponent){
            _.isComponent = true;
        }

        if(file.isJsLike){
            _.type = 'js';
        }else if(file.isCssLike){
            _.type = 'css';
        }

        if(!feather.util.isEmptyObject(_)){
            hash.map[file.id] = _;
        }
    });

    var modulename = feather.config.get('project.modulename');

    if(!modulename || modulename == 'common'){
        hash.commonMap = ret.commonResource;
        hash.useRequire = feather.config.get('require.use');
    }

    var file = feather.file.wrap(feather.project.getProjectPath() + '/map/' + (modulename || 'map') + '.php');
    file.setContent("<?php\r\nreturn " + feather.util.toPhpArray(hash) + ";");
    ret.pkg[file.subpath] = file;
}