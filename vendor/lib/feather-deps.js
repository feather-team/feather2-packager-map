(function(){
var Helper = require.Helper;

function getDeps(deps){
    var _ = [];

    Helper.each(deps, function(dep){
        var selfDeps = require.config('deps')[dep] || [];
        
        _.push(dep);
        _.unshift.apply(_, getDeps(selfDeps));
    });

    return _;
}

var oldDefine = define;

window.define = function(name, callback){
    name = require.getRealModuleName(name);
    new define.Module(name, callback);
};

Helper.extend(define, oldDefine);

var rid = 0;

require.async = function(deps, callback){
    deps = Helper.makeArray(require.getRealModuleName(deps));

    var realDeps = getDeps(deps);

    new define.Module('_r_' + rid++, function(){   
        var modules = [];

        Helper.each(deps, function(dep){
            modules.push(require(dep));
        });

        Helper.is(callback, 'Function') && callback.apply(window, modules);
    }, realDeps, true);
};
})();