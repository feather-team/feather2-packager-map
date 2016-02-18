'use strict';

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
        if(!file.isCssLike && !file.isJsLike && !file.isHtmlLike) return;

        var _ = {}, extras = file.extras;

        if(file.isHtmlLike){
            ['pagelet', 'widget', 'headJs', 'bottomJs', 'css'].forEach(function(type){
                if(extras[type] && extras[type].length){
                    _[type] = extras[type];
                }
            });

            var refs = [];

            if(_.widget){
                refs = refs.concat(_.widget);
                delete _.widget;
            }

            if(_.pagelet){
                refs = refs.concat(_.pagelet);
                delete _.pagelet;
            }

            if(refs.length){
                _.refs = refs;
            }
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
                    _.has = has;
                }
            }

            if(file.requires.length){
                _.deps = file.requires;
            }
        }

        if(extras.async && extras.async.length){
            _.asyncs = extras.async;
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

        if(file.isThird){
            _.isThird = true;
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