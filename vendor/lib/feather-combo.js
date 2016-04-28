(function(){
var Helper = require.Helper, analyseNeedLoadUrls = define.Module.analyseNeedLoadUrls;

function unique(array){
    var obj = {}, ret = [];

    Helper.each(array, function(v){
        if(obj[v]) return;

        obj[v] = true;
        ret.push(v);
    });

    return ret;
}

function dirname(path, onlyDomain){
    var reg, match;

    if(onlyDomain){
        reg = /^(?:https?\:)?\/\/[^\/]+\//;
    }else{
        reg = /.+\/(?=[^\/]+\.[^\.]+?(?:\?|$))/;
    }

    match = path.match(reg);
    return match ? match[0] : '/';
}

define.Module.analyseNeedLoadUrls = function(deps){
    var needLoadUrlStores = analyseNeedLoadUrls(deps);

    if(!require.config('combo')) return needLoadUrlStores;

    var CSSEXP = /\.(?:css|less)(?:\?|$)/, needCombos = {'css': [], 'js': []}, finalNeedLoadUrlStores = [];
    var combo = require.config('combo') || {}, maps = require.config('map');
    var comboLevel = combo.level, comboCssOnlySameBase = combo.cssOnlySameBase, comboMaxUrlLength = combo.maxUrlLength;

    Helper.each(needLoadUrlStores, function(urlStore){
        var url = urlStore.url;

        if(maps[url] && (comboLevel == 0 && maps[url].length == 1 || comboLevel > 0)){
            if(CSSEXP.test(url)){
                needCombos.css.push(urlStore);
            }else{
                needCombos.js.push(urlStore);
            }
        }else{
            finalNeedLoadUrlStores.push(urlStore);
        }
    });

    Helper.each(needCombos, function(combos, type){
        var combosDirGroup = {};

        Helper.each(combos, function(urlStore){
            var url = urlStore.url, dir = dirname(url, !(type == 'css' && comboCssOnlySameBase));
            
            // if(!combosDirGroup[dir]){
            //     combosDirGroup[dir] = {c: [], w: [], p: []};
            // }

            // var mod = mods[urlStore.modules[0]];

            // if(mod.type == 'c'){
            //     combosDirGroup[dir].c.push(url);
            // }else if(mod.type == 'w'){
            //     combosDirGroup[dir].w.push(url);
            // }else{
            //     combosDirGroup[dir].p.push(url);
            // }

            if(!combosDirGroup[dir]){
                combosDirGroup[dir] = [];
            }

            combosDirGroup[dir].push(url);
        });

        Helper.each(combosDirGroup, function(urls, dir){
            //Helper.each(typeUrls, function(urls, type){
                urls = unique(urls);

                if(urls.length > 1){
                    var items = [], tUrlStoreModules = [], dirLength = dir.length, len = 0;

                    Helper.each(urls, function(url){
                        len += url.length - dirLength;

                        var part = parseInt(len / comboMaxUrlLength);

                        if(!items[part]){
                            items[part] = [];
                            tUrlStoreModules[part] = [];
                        }

                        items[part].push(url.substring(dirLength));
                        tUrlStoreModules[part].push(define.Module.getUrlStore(url).modules);
                    });

                    Helper.each(items, function(item, key){
                        var realUrl;

                        if(item.length > 1){
                            realUrl = dir + '??' + item.join(',');
                        }else{
                            realUrl = tUrls[key][0];
                        }

                        var comboUrlStore = define.Module.getUrlStore(realUrl);
                        
                        Helper.each(tUrlStoreModules, function(modules){
                            comboUrlStore.modules = comboUrlStore.modules.concat(modules);
                        });

                        finalNeedLoadUrlStores.push(comboUrlStore);
                    });
                }else if(urls.length == 1){
                    finalNeedLoadUrlStores.push(define.Module.getUrlStore(urls[0]));
                }
            //});   
        });
    });

    return finalNeedLoadUrlStores;
}
})();