module.exports = function(ret, conf, setting, opt){
    var modulename = feather.config.get('project.modulename');
    var isPd = /^(?:pd|production)$/.test(feather.project.currentMedia());

    if(!modulename || modulename == 'common'){
        ['feather.js', 'pagelet.js'].forEach(function(item){
            var file = feather.file.wrap(feather.project.getProjectPath() + '/static/' + item);
            var content = feather.util.read(__dirname + '/../vendor/lib/' + item);

            delete file.useJsWraper;

            if(item == 'feather.js'){
                var _config = 'require.mergeConfig(' + feather.util.json(feather.config.get('require.config')) + ')';
                content += ';' + _config;
            }

            if(isPd){
                content = require('uglify-js').minify(content, {fromString: true}).code;
            }

            file.setContent(content);
            ret.pkg[file.subpath] = file;
            ret.map.res[file.id] = {
                uri: file.getUrl()
            };  
        });
    }

    ret.commonResource = {bottomJs: [], css: []};

    if(feather.config.get('require.use')){
        ret.commonResource.headJs = ['static/feather.js'];
    }

    opt.live && ret.commonResource.bottomJs.push('http://127.0.0.1:8132/livereload.js');
};