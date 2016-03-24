var require, define;

(function(window, document, undefined){
//判断是否为数组
function isArray(array){
    return Object.prototype.toString.call(array) == '[object Array]';
}

//转换数组
function makeArray(array){
    return array ? isArray(array) ? array : [array] : [];
}

//简单迭代数组
function each(obj, callback){
    if(isArray(obj)){
        for(var i = 0; i < obj.length; i++)
            callback(obj[i], i);
    }else{
        for(var i in obj)
            callback(obj[i], i);
    }
}

//查找元素是否在数组中
function inArray(array, item){
    array = makeArray(array);

    if(array.indexOf){
        return array.indexOf(item) > -1;
    }else{
        for(var i = 0; i < array.length; i++){
            if(array[i] == item) return true;
        }

        return false;
    }
}

function unique(array){
    var obj = {}, ret = [];

    each(array, function(v){
        if(obj[v]) return;

        obj[v] = true;
        ret.push(v);
    });

    return ret;
}

//是否函数
function isFunction(callback){
    return typeof callback == 'function';
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

//模块主类
//modulename 模块名
//callback 执行的函数
//depth 依赖的js文件 ==> 可为数组
function Module(modulename, callback, depth, use){
    if(Module.cache[modulename]){
        console && console.log('module ' + modulename + ' is exists!');
        return;
    }

    var self = this;

    //模块名
    self.modulename = modulename;
    //回调
    self.callback = callback;
    //获取真实的依赖文件列表
    self.depths = Module.getDeps(depth);
    //所需要加载的依赖的模块数
    self.needLoadCount = self.depths.length;
    //当模块所有依赖以及本身全部加载完后, 所通知的主模块列表
    self.notices = Module.noticesCache[modulename] || [];
    //公开出的成员
    self.exports = {};
    //是否执行过，延迟执行的标志
    self.execed = false;
    //是否是require.async
    self.use = use;
    self.init();
}

Module.prototype = {
    init: function(){
        var self = this;

        //当模块类被实例话后表示该模块本身的js已经被成功加载 删除loading表中自身所对应的js
        Module.cache[self.modulename] = self;
        //如果没有依赖 直接complete
        self.needLoadCount ? self.loadDepths() : self.complete();
    },

    loadDepths: function(){
        var self = this, needLoadDepths = [];

        self.status = Module.loadStatus.LOADDEPTH;
        
        each(self.depths, function(depth){
            var module, notices;

            if(module = Module.cache[depth]){
                return module.noticeModule(self);
            }

            if(!Module.noticesCache[depth]){
                Module.noticesCache[depth] = [self];
            }else{
                return Module.noticesCache[depth].push(self);
            }

            needLoadDepths.push(depth);
        });

        needLoadDepths.length && Module.load(needLoadDepths);
    },

    //接受通知
    //此处当依赖本模块的模块加载完后 会执行
    receiveNotice: function(){
        if(!--this.needLoadCount) {
            this.complete();
        }
    },

    //当本身加载完后 通知所依赖本模块的模块
    noticeModule: function(notice){
        var self = this;

        //手动通知某个模块
        if(notice){
            //如果该模块自己的依赖还没加载完，将需要通知的模块添加至通知队列
            if(self.status != Module.loadStatus.LOADED){
                return self.notices.push(notice);
            }

            //通知所依赖本模块的模块
            notice.receiveNotice();
        }else{ 
            //通知所有模块
            each(self.notices, function(notice){
                notice.receiveNotice();
            });

            self.notices.length = 0;
        }
    },

    //完成所有依赖加载后 执行回调
    complete: function(){
        var self = this;

        self.status = Module.loadStatus.LOADED;
        //如果是require.async 立即执行
        self.use && self.exec();
        self.noticeModule();
    },

    exec: function(){
        var self = this;

        if(self.execed) return;

        self.execed = true;

        if(isFunction(self.callback)){
            var exports;

            if(exports = self.callback.call(window, Module.require, self.exports, self)){
                self.exports = exports;
            }
        }
    }
};

//模块的加载状态
Module.loadStatus = {
    LOADDEPTH: 1,   //正在努力加载依赖文件
    LOADED: 2       //已全部加载完毕
};

Module.cache = {};      //当模块的js文件加载完后 会存放在此处 不管依赖是否加载完  这里是存放实例module
Module.noticesCache = {};       //缓存每个模块所需要通知被依赖模块的实例
Module.loadingSource = {};  //正在加载中的资源  
Module.loadedSource = {};   //已经加载的资源   
Module.mapSource = {};  //url与模块对应表

//加载一个模块的js文件
Module.load = function(depths){
    var CSSEXP = /\.(?:css|less)(?:\?|$)/, needCombos = {'css': [], 'js': []}, resources = {}, config = require.config;
    var comboLevel = config.combo.level, comboCssOnlySameBase = config.combo.cssOnlySameBase, comboMaxUrlLength = config.combo.maxUrlLength;
    var maps = config.map, deps = config.deps;

    each(depths, function(modulename){
        //获取该模块的url
        var url = Module.getUrl(modulename), map;

        //模块有可能被合并至一个大文件中，即一个文件中可能包含多个模块，或者非模块。
        if(!Module.mapSource[url]){
            Module.mapSource[url] = [modulename];
        }else{
            Module.mapSource[url].push(modulename);
        }

        if(Module.loadedSource[url]){//如果加载完毕，尝试初始化
            Module.init(modulename);
            return;
        }

        if(!Module.loadingSource[url]){
            Module.loadingSource[url] = 1;

            if(maps[url] && deps[modulename]){
                if(comboLevel == 0 && maps[url].length == 1 || comboLevel > 0){
                    if(CSSEXP.test(url)){
                        needCombos.css.push(url);
                    }else{
                        needCombos.js.push(url);
                    }
                }else{
                    resources[url] = url;
                }
            }else{
                resources[url] = url;
            }
        }
    });

    each(needCombos, function(combos, type){
        var combosDirGroup = {};

        each(combos, function(url){
            var dir = dirname(url, !(type == 'css' && comboCssOnlySameBase));
            
            if(!combosDirGroup[dir]){
                combosDirGroup[dir] = [url];
            }else{
                combosDirGroup[dir].push(url);
            }
        });

        each(combosDirGroup, function(urls, dir){
            urls = unique(urls);

            if(urls.length > 1){
                var items = [], tUrls = [], dirLength = dir.length, len = 0;

                each(urls, function(url){
                    len += url.length - dirLength;

                    var part = parseInt(len / comboMaxUrlLength);

                    if(!items[part]){
                        items[part] = [];
                        tUrls[part] = [];
                    }

                    items[part].push(url.substring(dirLength));
                    tUrls[part].push(url);
                });

                each(items, function(item, key){
                    var realUrl;

                    if(item.length > 1){
                        realUrl = dir + '??' + item.join(',');
                    }else{
                        realUrl = tUrls[key][0];
                    }

                    resources[realUrl] = tUrls[key];
                });
            }else{
                resources[urls[0]] = urls;
            }
        });
    });

    each(resources, function(urls, realUrl){
        Module._load(realUrl, CSSEXP.test(realUrl), function(){
            each(makeArray(urls), function(url){
                Module.loadedSource[url] = 1;
                //手动触发已加载方法，防止文件是非模块，require.async之类，导致无法通知依赖模块执行，也有可能是多个文件合并，需要挨个通知
                each(Module.mapSource[url], function(modulename){
                    Module.init(modulename);
                });
                
                Module.mapSource[url].length = 0;
            })
        });
    });
};

Module._load = function(url, isCss, callback){
    var  
    isLoaded = 0,
    isOldWebKit = +navigator.userAgent.replace(/.*(?:Apple|Android)WebKit\/(\d+).*/, "$1") < 536,
    type = isCss ? 'link' : 'script',
    source = document.createElement(type),
    supportOnload = 'onload' in source;

    //支持css加载
    if(isCss){
        source.rel = 'stylesheet';
        source.type = 'text/css';
        source.href = url;
    }else{
        source.type = 'text/javascript';
        source.src = url;
    }

    each(require.config.attrs || {}, function(v, k){
        if(isFunction(v)){
            v = v({
                type: type,
                url: url
            });
        }

        v !== undefined && source.setAttribute(k, v);
    });

    function onload(){
        //这边放置css中存在@import  import后会多次触发onload事件
        if(isLoaded) return;

        if(!source.readyState || /loaded|complete/.test(source.readyState)){
            source.onload = source.onerror = source.onreadystatechange = null;
            //已加载
            isLoaded = true;
            callback();
        }
    }

    source.onload = source.onerror = source.onreadystatechange = onload;
    source.charset = require.config.charset;
    document.getElementsByTagName('head')[0].appendChild(source);

    //有些老版本浏览器不支持对css的onload事件，需检查css的sheet属性是否存在，如果加载完后，此属性会出现
    if(isCss && (isOldWebKit || !supportOnload)){
        var id = setTimeout(function(){
            if(source.sheet){
                clearTimeout(id);
                return onload();
            }

            setTimeout(arguments.callee);
        });
    }
};

//尝试初始化
Module.init = function(modulename){
    !Module.cache[modulename] && new Module(modulename);
};

//require
Module.require = function(modulename){
    var cache = Module.cache[Module.getModuleName(modulename)];
    cache.exec();
    return cache.exports;
};

//或者模块真实的路径
Module.getModuleName = function(path){
    if(/:\/\//.test(path)) return path;

    var config = require.config, baseurl = config.baseurl || '';

    each(config.rules || [], function(item){
        path = path.replace(item[0], item[1]);
    }); 

    if(baseurl && path.charAt(0) != '/') path = baseurl.replace(/\/+$/, '') + '/' + path;

    return path.replace(/\/+/g, '/');
};

//获取全路径
Module.getUrl = function(path){
    var config = require.config, map = config.map || {}, domain = config.domain || '';

    for(var i in map){
        if(map.hasOwnProperty(i) && inArray(map[i], path)){
            path = i; break;
        }
    }
    
    return !/^(?:https?\:)?\/\//.test(path) ? domain + path : path;
};

//获取依赖
Module.getDeps = function(deps){
    var d = [];

    each(makeArray(deps), function(dep){
        dep = Module.getModuleName(dep);
        d.push(dep);
        d.push.apply(d, Module.getDeps(require.config.deps[dep]));
    });

    return d;
};


var requireid = 0;

//require, 可直接获取已加载完的模块
require = Module.require;

require.config = {
    domain: '',
    baseurl: '',
    rules: [],
    charset: 'utf-8',
    deps: {},
    map: {},
    attrs: {},
    combo: {
        level: -1,
        maxUrlLength: 2000,
        cssOnlySameBase: false
    }
};

require.async = function(paths, callback){
    new Module('_r_' + requireid++, function(){
        var modules = [];

        each(makeArray(paths), function(path){
            modules.push(Module.require(path));
        });

        isFunction(callback) && callback.apply(window, modules);
    }, paths, true);
};

require.mergeConfig = function(config){
    var _config = require.config;

    each(config, function(c, i){
        var tmp = _config[i];

        if(i == 'map'){
            each(c, function(map, name){
                var yMap = tmp[name];

                if(!yMap){
                    yMap = map;
                }else{
                    each(makeArray(map), function(item){
                        !inArray(yMap, item) && yMap.push(item);
                    });
                }

                tmp[name] = yMap;
            });
        }else if(i == 'deps'){
            each(c, function(dep, name){
                tmp[name] = dep;
            });
        }else if(isArray(c)){
            tmp.push.apply(tmp, c);
        }else{
            tmp = c;
        }

        _config[i] = tmp;
    });
};

//define方法
define = function(modulename, callback, depth){
    if(isFunction(depth)){
        var s = callback;
        callback = depth;
        depth = s;
    }
    
    modulename = Module.getModuleName(modulename);
    depth = depth || require.config.deps[modulename];

    new Module(modulename, callback, depth);
};
})(window, document);