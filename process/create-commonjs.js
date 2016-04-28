module.exports = function(ret, conf, setting, opt){
    var modulename = feather.config.get('project.modulename');
    var isPd = /^(?:pd|production)$/.test(feather.project.currentMedia());

    if(!modulename || modulename == 'common'){
        ['feather.js', 'pagelet.js'].forEach(function(item){
            var content = feather.util.read(__dirname + '/../vendor/lib/' + item, true);
            var file = feather.file.wrap(feather.project.getProjectPath() + '/static/' + item);

            if(item == 'feather.js'){
                if(feather.config.get('combo'))

                feather.config.set('require.config.combo', {
                    onlyUnPackFile: feather.config.get('combo.onlyUnPackFile'),
                    maxUrlLength: feather.config.get('combo.maxUrlLength'),
                    cssOnlySameBase: feather.config.get('cssA2R')
                });

                var _config = 'require.config(' + feather.util.json(feather.config.get('require.config')) + ')';
                content += ';' + _config;
                content += ';' + feather.util.read(__dirname + '/../vendor/lib/feather-deps.js', true);

                if(feather.config.get('combo.level') > -1){
                    content += ';' + feather.util.read(__dirname + '/../vendor/lib/feather-combo.js', true);
                }

                delete file.useJsWraper;
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