define('/static/pagelet.js', function(require, exports, module){
var doc = document, head = doc.getElementsByTagName('head')[0];

function _(_id){
	return doc.getElementById(_id);
}

function append(_parent, childNode){
	_parent.appendChild(childNode);
}

function createElement(tagName, isText){
	return isText ? doc.createTextNode(tagName) : doc.createElement(tagName);
}

module.exports = function(id, targetId, type){
	var parent = createElement('div'), frame = document.createDocumentFragment();
	var isScript = /script/i, isStyle = /style/i, isJsLike = /text\/javascript/i, reg = new RegExp('<\\\\\\\/' + type + '>', 'g');
	
	id = _(id);

	parent.innerHTML = (id.value || id.innerHTML).replace(reg, '</' + type + '>');

	for(var i = 0; i < parent.childNodes.length; i++){
		var child = parent.childNodes[i--], tagName = child.tagName, text = child.innerHTML, element;

		if(isScript.test(tagName) && isScript.test(type)){
			if(child.src){
				element = createElement('script');
				element.src = child.src;
				append(head, element);
			}else if(!child.type || isJsLike.test(child.type)){
				(new Function(text)).call(window);
			}
		}else if(isStyle.test(tagName) && isStyle.test(type)){
			element = createElement('style');
			element.type = 'text/css';

			if(element.styleSheet){
				element.styleSheet.cssText = text;
			}else{
				append(element, createElement(text, true));
			}

			append(head, element);
		}

		append(frame, child);
	}
		
	append(_(targetId), frame);
	
	id.parentNode.removeChild(id);
};
});