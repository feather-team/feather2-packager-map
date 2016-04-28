'use strict';

var Maps, PkgUrlCache = {}, UrlCache = {};
var CONCATS_TYPE = ['headJs', 'bottomJs', 'css', 'deps', 'asyncs'];
var RESOURCES_TYPE = ['headJs', 'bottomJs', 'css'];

function getSelfMap(id){
	var selfMap = Maps.map[id] || {}, refsMaps = {};

	(selfMap.refs || []).forEach(function(ref){
		var refMap = getSelfMap(ref);

		for(var type in refMap){
			if(CONCATS_TYPE.indexOf(type) == -1){
				delete refMap[type];
			}
		}

		feather.util.extend(refsMaps, refMap);
	});

	return feather.util.extend(refsMaps, selfMap);
}

function getUrls(resources, returnHash, includeNotFound, hash, pkgHash){
	hash = hash || {};
	pkgHash = pkgHash || {};

	var urls = [];

	resources.forEach(function(resource){
		var url = hash[resource];

		if(!url){
			var info = Maps.map[resource];

			if(info){
				var pkgName, pkgInfo;

				if(pkgName = info.pkg){
					if(!pkgHash[pkgName]){
						pkgInfo = Maps[pkgName];
						PkgUrlCache[pkgHash[pkgName] = pkgInfo.url] = pkgName;
						UrlCache[pkgInfo.url] = pkgInfo;
					}

					url = hash[resource] = pkgHash[resource];
				}else{
					url = hash[resource] = info.url;
					UrlCache[url] = info;
				}

				if(info.deps){
					urls.unshift(getUrls(info.deps, false, includeNotFound, hash, pkgHash));
				}

				if(info.asyncs){
					urls.unshift(getUrls(info.asyncs, false, includeNotFound, hash, pkgHash));
				}

				if(pkgInfo && (pkgInfo.useJsWraper || Maps.useRequire)){
					var noWraperHas = [];

					pkgInfo.has.forEach(function(has){
						!hash[has] && noWraperHas.push(has);
					});

					if(noWraperHas.length){
						urls.unshift(getUrls(noWraperHas, false, includeNotFound, hash, pkgHash));
					}
				}
			}else{
				url = resource;

				if(includeNotFound){
					hash[resource] = resource;
				}
			}
		}

		urls.push(url);
	});

	return returnHash ? hash : feather.util.unique(urls);
}

function getSelfResource(id){
	var selfMap = getSelfMap(id);
	var finalResources = [], finalRequires = {};
	var tmpCss = [];

	if(selfMap.isPagelet){
		selfMap.asyncs = selfMap.asyncs || [];
		
		if(selfMap.css){
			selfMap.asyncs.unshift(selfMap.css);
		}

		finalResources.pageletCss = selfMap.css;
		delete selfMap.css;
	}else if(Maps.useRequire){
		selfMap = feather.util.extend(Maps.commonMap, selfMap);
	}

	RESOURCES_TYPE.forEach(function(type){
		var resources;

		if(resources = selfMap[type]){
			var urls = getUrls(resources, false, true);

			if(type != 'css'){
				var finalUrls = [];

				urls.forEach(function(url){
					if(/\.css($|\?)/.test(url)){
						tmpCss.push(url);
					}else{
						finalUrls.push(url);
					}
				});

				finalResources[type] = finalUrls;
			}else{
				finalResources[type] = urls;
			}
		}else{
			finalResources[type] = [];
		}
	});

	finalResources.css = finalResources.css.concat(tmpCss);

	if(selfMap.asyncs){
		finalRequires = getUrls(selfMap.asyncs, true);
	}

	var finalMap = {}, finalDeps = {};

	feather.util.map(finalRequires, function(key, item){
		if(!finalMap[item]){
			finalMap[item] = [key];
		}else{
			finalMap[item].push(key);
		}

		var info = Maps.map[key];

		if(info && info.deps){
			finalDeps[key] = info.deps;
		}
	});

	feather.util.map(finalMap, function(key, item){
		finalMap[key] = feather.util.unique(item);
	});

	

	feather.util.map(finalResources, function(type, urls){
		if(urls.length){
			if(combo.level > -1){
				urls = analyseCombo(urls);
			}else if(autoCombine){
				urls = analyseAutoCombine(urls);
			}else{
				urls = feather.util.unique(urls);
			}
		}

		finalResources[type] = urls;
	});


	//if combo
	var combo = feather.config.get('combo'), comboCssOnlySameBase = feather.config.get('cssA2R');
	//if auto combine

	//else

	return selfMap;
	/*
		

		//get require info
		$finalMap = array();
		$finalDeps = array();

		foreach($finalRequires as $key => $value){
			if(!isset($finalMap[$value])){
				$finalMap[$value] = array();
			}

			$finalMap[$value][] = $key;

			if(isset($maps[$key])){
				$info = $maps[$key];

				if(isset($info['deps'])){
					$finalDeps[$key] = $info['deps'];
				}
			}
		}

		foreach($finalMap as $k => &$v){
			$v = array_values(array_unique($v));
		}

		unset($v);

		//get real url
		$comboOption = $this->getOption('combo');
		$comboCssOnlySameBase = $comboOption['cssOnlySameBase'];
		$comboLevel = $comboOption['level'];
		$comboMaxUrlLength = $comboOption['maxUrlLength'];

		foreach($finalResources as &$resources){
			//do comboLevel
			if($comboLevel > -1 && !empty($resources)){
				$combos = array();
				$remotes = array();

				foreach($resources as $url){
					if(isset($this->urlCache[$url])){
						if($comboLevel == 0 && !isset($this->pkgUrlCache[$url]) || $comboLevel > 0){
							$combos[] = $url;
						}else{
							$remotes[] = $url;
						}
					}else{
						$remotes[] = $url;
					}
				}

				$resources = $remotes;
				$combosDirGroup = array();

				foreach($combos as $url){
					if($this->urlCache[$url]['type'] == 'css' && $comboCssOnlySameBase){
						$baseurl = dirname($url) . '/';
					}else{
						preg_match('#^(?:(?:https?:)?//)?[^/]+/#', $url, $data);
						$baseurl = $data[0];
					}

					$combosDirGroup[$baseurl][] = $url;
				}

				foreach($combosDirGroup as $dir => $urls){
					$urls = array_unique($urls);
					
					if(count($urls) > 1){
						$baseNames = array();
						$dirLength = strlen($dir);
						$len = 0;

						foreach($urls as $url){
							$url = substr($url, $dirLength);
							$baseNames[] = $url;

							if(strlen($url) + $len >= $comboMaxUrlLength){
								$len = 0;
								$resources[] = $dir . '??' . implode(',', $baseNames); 
								$baseNames = array();
							}else{
								$len += strlen($url);
							}
						}

						if(count($baseNames)){
							$resources[] = $dir . '??' . implode(',', $baseNames); 
						}
					}else{
						$resources[] = $urls[0];
					}	
				}	
			}else{
				$resources = array_unique(array_values($resources));
			}
		}

		unset($resources);
		//end
		
		$requires = array(
			'map' => $finalMap,
			'deps' => $finalDeps
		);
		
		$finalResources['requires'] = $requires;

		return $finalResources;*/
}

module.exports = function(ret, conf, setting, opt){
	Maps = ret.hash;

	feather.util.map(ret.src, function(subpath, file){
		if(file.isHtmlLike){
			getSelfResource(file.id);
		}
	});
};