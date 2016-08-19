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
    var hash = {};
    var uriMap = ret.uriMap;

    feather.util.map(files, function(path, file){
        if(!file.isCssLike && !file.isJsLike && !file.isHtmlLike || !file.release) return;

        var _ = {}, extras = file.extras;

        if(!file.isHtmlLike){
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

                    var notWraper = has.every(function(item){
                        return ret.ids[item].useJsWraper === false;
                    });

                    if(notWraper){
                        _.useJsWraper = false;
                    }else{
                        delete file.useJsWraper;
                    }
                }
            }

            if(file.requires.length){
                extras.deps = file.requires;
            }
        }

        //check ref is exists and unique
        var types;

        if(file.isHtmlLike){
            types = ['pagelet', 'widget', 'extends', 'headJs', 'bottomJs', 'css', 'async'];
        }else if(file.isJsLike){
            types = ['deps', 'async'];
        }else if(file.isCssLike){
            types = ['deps'];
        }

        types.forEach(function(type){
            if(extras[type] && extras[type].length){
                var links = [];

                extras[type].forEach(function(url){
                    var id = url.replace(/^\/([^\/]+)/, '$1');

                    if(!uriMap[url] && !ret.map.res[id] && !feather.util.isRemoteUrl(url)){
                        feather.log.warn(file.id + ':[' + url + '] is not exists!');
                        links.push(url);
                    }else{
                        links.push(uriMap[url] || id);
                    }
                });

                _[type] = feather.util.unique(links);
            }
        });
        //check end

        if(_.async){
            _.asyncs = _.async;
            delete _.async;
        }

        //if is html, merge widget and pagelet to refs
        if(file.isHtmlLike){
            var refs = [];

            if(_.widget){
                refs = refs.concat(_.widget);
                delete _.widget;
            }

            if(_.pagelet){
                refs = refs.concat(_.pagelet);
                delete _.pagelet;
            }

            if(_['extends']){
                refs = refs.concat(_['extends']);
                delete _['extends'];
            }

            if(refs.length){
                _.refs = refs;
            }
        }

        //add type
        if(file.isPagelet){
            _.isPagelet = true;
        }else if(file.isWidget){
            _.isWidget = true;
        }else if(file.isComponent){
            _.isComponent = true;
        }

        if(file.isJsLike){
            _.type = 'js';

            if(file.useJsWraper === false){
                _.useJsWraper = false;
            }
        }else if(file.isCssLike){
            _.type = 'css';
        }

        if(file.isThird){
            _.isThird = true;
        }

        if(!feather.util.isEmptyObject(_)){
            hash[file.id] = _;
        }
    })

    ret.map = hash;
        
    var mapFile = feather.file.wrap(feather.project.getProjectPath() + '/map.json');
    mapFile.setContent(JSON.stringify(ret.map, null, 4));
    ret.pkg[mapFile.subpath] = mapFile;
};