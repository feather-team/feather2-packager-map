;(function(window, document){
	var head = document.getElementsByTagName('head')[0];

	function $(id){
		return document.getElementById(id);
	}

	function append(target, string){
		if(typeof string == 'object'){
			target.appendChild(string);
		}else{
			var parent = createElement('div');
			var isScript = /script/i, isStyle = /style/i, isJsLike = /text\/javascript/i;

			parent.innerHTML = string;

			for(var i = 0; i < parent.childNodes.length; i++){
				var child = parent.childNodes[i--], tagName = child.tagName, text = child.innerHTML, element;

				if(isScript.test(tagName)){
					if(child.src){
						element = createElement('script');
						element.src = child.src;
						append(head, element);
					}else if(!child.type || isJsLike.test(child.type)){
						(new Function(text))();
					}
				}else if(isStyle.test(tagName)){
					element = createElement('style');
					element.type = 'text/css';

					if(element.styleSheet){
						element.styleSheet.cssText = text;
					}else{
						append(element, createElement(text, true));
					}

					append(head, element);
				}

				append(target, child);
			}

			parent = null;
		}
	}

	function createElement(tagName, isText){
		return isText ? document.createTextNode(tagName) : document.createElement(tagName);
	}

	function getXhr(){
		if(window.XMLHttpRequest){
			return new window.XMLHttpRequest;
		}else{
			return new window.ActiveXObject('Microsoft.XMLHTTP');
		}
	}

	function queryString(params){
		if(typeof params == 'object'){
			var arr = [];

			for(var i in params){
				params.hasOwnProperty(i) && arr.push(i + '=' + encodeURIComponent(params[i]));
			}

			return arr.join('&');
		}

		return params;
	}

	function load(url, params, callback){
		params = queryString(params);

		if(/\?/.test(url)){
			url += '&' + params;
		}else{
			url += '?' + params;
		}

		var xhr = getXhr();
		xhr.open('GET', url, true);
		xhr.onreadystatechange = function(){
			if(xhr.readyState == 4){
				xhr.onreadystatechange = null;

				var text;

				if((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304){
					text = xhr.responseText;

					var element = createElement('div'), id = 'pagelet' + (+(new Date));
					element.id = id;
					element.setAttribute('data-pagelet-temp-container', true);
					element.style.display = 'none';
					append(document.body, element);
					append(element, text);
				}else{
					text = xhr.statusText || (xhr.status ? 'error' : 'abort');
				}

				callback && callback(text);
			}
		};
		xhr.send();

		return xhr;
	}

	function init(id, pid){
		var dom = $(id), type = dom.tagName;
		var reg = new RegExp('<\\\\/' + type + '>', 'gi');
		var html = (dom.value || dom.innerHTML).replace(reg, '</' + type + '>');
		pid = pid || dom.getAttribute('data-pid');

		append($(pid), html);

		var parent = dom.parentNode;

		// if(parent.getAttribute('data-pagelet-temp-container')){
		// 	parent.parentNode.removeChild(parent);
		// }else{
		// 	dom.parentNode.removeChild(dom);
		// }
	}

	define('static/pagelet.js', function(){
		return {
			load: load,
			init: init
		};
	});
})(window, document);