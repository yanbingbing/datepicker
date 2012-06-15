/**
 * datepicker plugin
 *
 *  this plugin use pure javascript.
 *  you can find some code like jQuery, yes! jQuery is a good job,
 *  i learn and use some hack from jQuery.
 *
 * @author     kakalong
 * @copyright  2011 (c) firebing.cn
 * @version    $Id$
 */

(function(window, undefined){
// supports
var document = window.document,
	slice = [].slice,
	rexclude = /z-?index|font-?weight|opacity|zoom|line-?height/i,
	rspace = /\s+/,
	rzero = /^0/,
	rhastime = /([Hhms])\1*/,
	rroot = /^body|html$/i, boxModel = document.compatMode == 'CSS1Compat', ie6 = /MSIE 6/.test(navigator.userAgent),
	expando = "expando" + (new Date).getTime(), cached = {}, windowData = {}, uuid = 0;
boxModel || (function(fn){
	var isFired = 0;
	function fireReady(){
		if (isFired) {
			return;
		}
		if (!document.body) {
			return setTimeout(fireReady, 1);
		}
		isFired = 1;
		fn();
	}
	if (document.readyState == 'complete') {
		return setTimeout(fireReady, 1);
	}

	if (document.addEventListener) {
		function DOMContentLoaded(){
			document.removeEventListener('DOMContentLoaded', DOMContentLoaded, false);
			fireReady();
		}
		document.addEventListener('DOMContentLoaded', DOMContentLoaded, false);
		window.addEventListener('load', fireReady, false);
	} else if (document.attachEvent) {
		function DOMContentLoaded(){
			if (document.readyState == 'complete') {
				document.detachEvent('onreadystatechange', DOMContentLoaded);
				fireReady();
			}
		}
		document.attachEvent('onreadystatechange', DOMContentLoaded);
		window.attachEvent('onload', fireReady);

		var toplevel = false;

		try {
			toplevel = window.frameElement == null;
		} catch(e) {}

		if (toplevel && document.documentElement.doScroll) {
			function doScrollCheck(){
				try {
					document.documentElement.doScroll('left');
				} catch(e) {
					setTimeout(doScrollCheck, 1);
					return;
				}
				fireReady();
			}
			doScrollCheck();
		}
	}
})(function(){
	var div = document.createElement("div");
	div.style.width = div.style.paddingLeft = "1px";

	document.body.appendChild(div);
	boxModel = div.offsetWidth === 2;
	document.body.removeChild(div);
	div = null;
});
function pad(v, l){
	return (Math.pow(10, l - (v+'').length) + '').substr(1) + v;
}
function toInt(v){
	return v && parseInt(v.replace(rzero, '')) || 0;
}
function each(list, fn){
	for (var i = 0, l = list.length,t = list[0];i < l && fn.call(t, t, i) !== false; t = list[++i]){}
}
function extend(target, source){
	for (var key in source) {
		target[key] = source[key];
	}
	return target;
}
// simple computedStyle
var curCSS = function(){
	var rupper = /([A-Z])/g, rnumpx = /^\d+(?:px)?$/i, rnum = /^\d/;
	return document.defaultView && document.defaultView.getComputedStyle
	? function(elem, name) {
		var computedStyle = elem.ownerDocument.defaultView.getComputedStyle(elem, null);
		return computedStyle
				&& computedStyle.getPropertyValue(name.replace(rupper, "-$1").toLowerCase());
	} : function(elem, name) {
		var ret = elem.currentStyle[name],
			style = elem.style;
		if (!rnumpx.test(ret) && rnum.test(ret)) {
			// Remember the original values
			var left = style.left, rsLeft = elem.runtimeStyle.left;
			// Put in the new values to get a computed value out
			elem.runtimeStyle.left = elem.currentStyle.left;
			style.left = ret || 0;
			ret = style.pixelLeft + "px";
			// Revert the changed values
			style.left = left;
			elem.runtimeStyle.left = rsLeft;
		}
		return ret;
	};
}();

var offset = function(){
// start offset
	var doesNotAddBorder, doesAddBorderForTableAndCells, supportsFixedPosition,
		subtractsBorderForOverflowNotVisible, doesNotIncludeMarginInBodyOffset;
	function initialize() {
		var body = document.body,
			div = document.createElement('div'),
			innerDiv, checkDiv, td,
			bodyMarginTop = parseFloat(curCSS(body, 'marginTop', true)) || 0;

		extend(div.style, {position: 'absolute', top: 0, left: 0, margin: 0, border: 0, width: '1px', height: '1px', visibility: 'hidden'});

		div.innerHTML = '<div style="position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;"><div></div></div><table style="position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;" cellpadding="0" cellspacing="0"><tr><td></td></tr></table>';
		body.insertBefore( div, body.firstChild);
		innerDiv = div.firstChild;
		checkDiv = innerDiv.firstChild;
		td = innerDiv.nextSibling.firstChild.firstChild;

		doesNotAddBorder = (checkDiv.offsetTop !== 5);
		doesAddBorderForTableAndCells = (td.offsetTop === 5);

		checkDiv.style.position = 'fixed', checkDiv.style.top = '20px';
		// safari subtracts parent border width here which is 5px
		supportsFixedPosition = (checkDiv.offsetTop === 20 || checkDiv.offsetTop === 15);
		checkDiv.style.position = checkDiv.style.top = '';

		innerDiv.style.overflow = 'hidden', innerDiv.style.position = 'relative';
		subtractsBorderForOverflowNotVisible = (checkDiv.offsetTop === -5);

		doesNotIncludeMarginInBodyOffset = (body.offsetTop !== bodyMarginTop);

		body.removeChild(div);
		body = div = innerDiv = checkDiv = td = null;
		initialize = null;
	}
	function bodyOffset(body) {
		var top = body.offsetTop, left = body.offsetLeft;

		initialize && initialize();

		if (doesNotIncludeMarginInBodyOffset) {
			top  += parseFloat(curCSS(body, 'marginTop',  true)) || 0;
			left += parseFloat(curCSS(body, 'marginLeft', true)) || 0;
		}
		return { top: top, left: left };
	}
	return ( "getBoundingClientRect" in document.documentElement )
	? function(elem) {
		if ( elem === elem.ownerDocument.body ) {
			return bodyOffset(elem);
		}

		var box = elem.getBoundingClientRect(), doc = elem.ownerDocument, body = doc.body, docElem = doc.documentElement,
			clientTop = docElem.clientTop || body.clientTop || 0, clientLeft = docElem.clientLeft || body.clientLeft || 0,
			top  = box.top  + (self.pageYOffset || boxModel && docElem.scrollTop  || body.scrollTop ) - clientTop,
			left = box.left + (self.pageXOffset || boxModel && docElem.scrollLeft || body.scrollLeft) - clientLeft;
		return { top: top, left: left };
	} : function(elem) {
		if ( elem === elem.ownerDocument.body ) {
			return bodyOffset(elem);
		}
		initialize && initialize();

		var offsetParent = elem.offsetParent, prevOffsetParent = elem,
			doc = elem.ownerDocument, computedStyle, docElem = doc.documentElement,
			body = doc.body, defaultView = doc.defaultView,
			prevComputedStyle = defaultView.getComputedStyle( elem, null ),
			top = elem.offsetTop, left = elem.offsetLeft;

		while ( (elem = elem.parentNode) && elem !== body && elem !== docElem ) {
			if (supportsFixedPosition && prevComputedStyle.position === "fixed" ) { break; }

			computedStyle = defaultView.getComputedStyle(elem, null);
			top  -= elem.scrollTop;
			left -= elem.scrollLeft;

			if ( elem === offsetParent ) {
				top  += elem.offsetTop;
				left += elem.offsetLeft;

				if ( doesNotAddBorder && !(doesAddBorderForTableAndCells && /^t(able|d|h)$/i.test(elem.nodeName)) ) {
					top  += parseFloat(computedStyle.borderTopWidth) || 0;
					left += parseFloat(computedStyle.borderLeftWidth) || 0;
				}

				prevOffsetParent = offsetParent, offsetParent = elem.offsetParent;
			}

			if ( subtractsBorderForOverflowNotVisible && computedStyle.overflow !== "visible" ) {
				top  += parseFloat(computedStyle.borderTopWidth) || 0;
				left += parseFloat(computedStyle.borderLeftWidth) || 0;
			}
			prevComputedStyle = computedStyle;
		}

		if ( prevComputedStyle.position === "relative" || prevComputedStyle.position === "static" ) {
			top  += body.offsetTop;
			left += body.offsetLeft;
		}

		if (supportsFixedPosition && prevComputedStyle.position === "fixed") {
			top  += Math.max( docElem.scrollTop, body.scrollTop );
			left += Math.max( docElem.scrollLeft, body.scrollLeft );
		}
		return { top: top, left: left };
	};
// end offset
}();

var position = function(){
// start position
	function getOffsetParent(elem) {
		elem = elem.offsetParent || document.body;
		while ( elem && (!rroot.test(elem.nodeName) && curCSS(elem, 'position') === 'static'))
		{
			elem = elem.offsetParent;
		}
		return elem;
	}
	return function(elem){
		var parentElem = getOffsetParent(elem),
		// Get correct offsets
		pos = offset(elem),
		parentPos = rroot.test(parentElem.nodeName) ? { top: 0, left: 0 } : offset(parentElem);

		pos.top  -= parseFloat(curCSS(elem, 'marginTop')) || 0;
		pos.left -= parseFloat(curCSS(elem, 'marginLeft')) || 0;

		parentPos.top  += parseFloat(curCSS(parentElem, 'borderTopWidth')) || 0;
		parentPos.left += parseFloat(curCSS(parentElem, 'borderLeftWidth')) || 0;

		// Subtract the two offsets
		return {
			top:  pos.top  - parentPos.top,
			left: pos.left - parentPos.left
		};
	};
// end position
}();
function css(elem, name, value) {
	if (typeof name == 'object') {
		for (var k in name) {
			css(elem, k, name[k]);
		}
		return elem;
	}
	if (!elem || elem.nodeType === 3 || elem.nodeType === 8) {
		return elem;
	}
	if (typeof value === "number" && !rexclude.test(name)) {
		value += "px";
	}
	if ((name === "width" || name === "height") && parseFloat(value) < 0) {
		value = undefined;
	}

	if (value !== undefined) {
		elem.style[name] = value;
	}
	return elem;
}
function addClass(elem, value) {
	if (elem.className) {
		var className = " " + elem.className + " ",
			classNames = (value || "").split(rspace);
		for (var c = 0, cl = classNames.length; c < cl; c++) {
			if ( className.indexOf( " " + classNames[c] + " " ) < 0 ) {
				elem.className += " " + classNames[c];
			}
		}
	} else {
		elem.className = value;
	}
	return elem;
}
function hasClass(elem, value) {
	return (" " + elem.className + " ").indexOf(" " + value + " ") > -1;
}
function removeClass(elem, value) {
	if (elem.className) {
		if (value) {
			var className = " " + elem.className + " ",
				classNames = (value || "").split(rspace);
			for ( var c = 0, cl = classNames.length; c < cl; c++ ) {
				className = className.replace(" " + classNames[c] + " ", " ");
			}
			elem.className = className.substring(1, className.length - 1);
		} else {
			elem.className = "";
		}
	}
	return elem;
}
var toElement = function() {
	var div = document.createElement('div');
	return function(html) {
		if (html.nodeType) return html;
		div.innerHTML = html;
		html = div.firstChild;
		div.removeChild(html);
		return html;
	};
}();
function append(elem, value) {
	elem = toElement(elem);
	elem.appendChild(toElement(value));
	return elem;
}
function appendTo(elem, node) {
	elem = toElement(elem);
	node.appendChild(elem);
	return elem;
}
function data(elem, name, value){
	elem = elem == window ? windowData : elem;
	var id = elem[ expando ], thisCache;
	if (!name && !id) {
		return null;
	}
	if (!id) { 
		id = ++uuid;
	}
	if (cached[id]) {
		thisCache = cached[id];
	} else if (typeof value === "undefined") {
		thisCache = {};
	} else {
		thisCache = cached[id] = {};
	}
	if (value !== undefined) {
		elem[expando] = id;
		thisCache[name] = value;
	}
	return name ? thisCache[name] : thisCache;
}
function removeData(elem, name) {
	elem = elem == window ? windowData : elem;

	var id = elem[expando], thisCache = cached[id];

	if (name) {
		if (thisCache) {
			delete thisCache[name];
		}
	} else {
		try {
			delete elem[expando];
		} catch(e) {
			elem.removeAttribute && elem.removeAttribute(expando);
		}
		delete cached[id];
	}
}
var Event = function(){
	var guid = 0, inTrigger = 0;
	function Evt(src){
		if (src && src.type) {
			this.originalEvent = src;
			this.type = src.type;
			this.target = src.target || src.srcElement || document;
			if (this.target.nodeType === 3) {
				this.target = this.target.parentNode;
			}
			this.which = src.which || src.charCode || src.keyCode;
		} else {
			this.type = src;
			this.target = document;
		}
		this[expando] = true;
	}
	Evt.prototype = {
		preventDefault:function(){
			var e = this.originalEvent;
			if (!e) {
				return;
			}
			if (e.preventDefault) {
				e.preventDefault();
			}
			e.returnValue = false;
		},
		stopPropagation:function(){
			var e = this.originalEvent;
			if (!e) {
				return;
			}
			if (e.stopPropagation) {
				e.stopPropagation();
			}
			e.cancelBubble = true;
		},
		halt:function(){
			this.preventDefault();
			this.stopPropagation();
		}
	}
	function fix(event) {
		if (event[expando]) {
			return event;
		}
		return new Evt(event);
	}
	function oHandle() {
		var event = fix(arguments[0] || window.event),
			handlers = (data(this, "events") || {})[event.type];
		arguments[0] = event;
		for (var j in handlers) {
			handlers[j].apply(this, arguments);
		}
	}
	var Event = {
		add:function(elem, type, fn){
			if (elem.nodeType === 3 || elem.nodeType === 8) {
				return;
			}

			if (elem.setInterval && (elem !== window && !elem.frameElement)) {
				elem = window;
			}

			if (!fn.guid) {
				fn.guid = guid++;
			}

			var events = data(elem, "events") || data(elem, "events", {}),
				handle = data(elem, "handle") || data(elem, "handle", function(){
					inTrigger || oHandle.apply(arguments.callee.elem, arguments);
				});
			
			handle.elem = elem;

			var handlers = events[type];

			if (!handlers) {
				handlers = events[type] = {};
				if (elem.addEventListener) {
					elem.addEventListener(type, handle, false);
				} else if (elem.attachEvent) {
					elem.attachEvent("on" + type, handle);
				}
			}

			handlers[fn.guid] = fn;
			elem = null;
			return fn.guid;
		},
		trigger: function(event, elem){
			var type = event.type || event,
				oEvent = typeof event === "object" ? (event.originalEvent || event) : null,
				handle = data(elem, "handle");
			if (!handle) {
				return;
			}
			inTrigger = 1;
			event = new Evt(type);
			event.originalEvent = oEvent;
			event.target = elem;
			handle.apply(elem, event);
			inTrigger = 0;
		},
		remove:function(elem, type, fn){
			if (elem.nodeType === 3 || elem.nodeType === 8) {
				return;
			}

			var events = data(elem, "events"), ret;
			if (!events) {
				return;
			}
			if (events[type]) {
				if (fn) {
					delete events[type][typeof fn == 'function' ? fn.guid : fn];
				} else {
					for (var handle in events[type]) {
						delete events[type][handle];
					}
				}

				for (ret in events[type]) {
					break;
				}
				if (!ret) {
					if (elem.removeEventListener) {
						elem.removeEventListener(type, data(elem, "handle"), false);
					} else if (elem.detachEvent) {
						elem.detachEvent("on" + type, data(elem, "handle"));
					}
					ret = null;
					delete events[type];
				}
			}

			for (ret in events) {
				break;
			}
			if (!ret) {
				var handle = data(elem, "handle");
				if (handle) {
					handle.elem = null;
				}
				removeData(elem, "events");
				removeData(elem, "handle");
			}
		}
	};
	Event.add(window, 'unload', function(){
		for (var id in cached) {
			if (id != 1 && cached[id].handle) {
				Event.remove(cached[id].handle.elem);
			}
		}
	});
	return Event;
}();
function mousewheel(elem, fn){
	function handle(event){
		event.type = "mousewheel";
		var oEvent = event.originalEvent;
		event.delta = oEvent
			? (oEvent.wheelDelta
				? oEvent.wheelDelta/120
				: (oEvent.detail ? (-oEvent.detail/3) : 0)
			) : 0;
		fn.apply(this, arguments);
	}
	Event.add(elem, 'mousewheel', handle);
	elem.addEventListener && Event.add(elem, 'DOMMouseScroll', handle);
}
var Expr = {
	match:{
		CLASS: /\.([\w\-]+)/,
		DATE: /@([\w\-]+)/,
		TAG: /^([\w\-]+)/
	},
	find:{
		TAG:function(match, context){
			return context.getElementsByTagName(match);
		}
	},
	filter:function(results, type, match) {
		var tmp = [], f = Expr.filters[type];
		for (var i = 0, t; t = results[i++];) {
			t.nodeType === 1 && f(t, match) && tmp.push(t);
		}
		return tmp;
	},
	filters:{
		TAG:function(elem, match){
			return (match === "*" && elem.nodeType === 1) || elem.nodeName === match;
		},
		CLASS:function(elem, match){
			return (" " + (elem.className || elem.getAttribute("class")) + " ").indexOf(" "+match+" ") > -1;
		},
		DATE:function(elem, match){
			return elem.getAttribute('date') == match;
		}
	},
	nth:function(cur, dir, nth, type, match){
		var n = 0, f = type && Expr.filters[type];
		if (f) {
			while (cur = cur[dir]) {
				if (f(cur, match) && ++n == nth) {
					return cur;
				}
			}
		} else {
			while (cur = cur[dir]) {
				if (++n == nth) {
					return cur;
				}
			}
		}
		cur = null;
		return null;
	},
	exec:function(expr) {
		if (!expr) {
			return null;
		}
		for (var type in Expr.match) {
			var match = Expr.match[type].exec(expr);
			if (match) {
				return [type, match[1]];
			}
		}
		return null;
	}
}
function find(context, expr) {
	var match = Expr.exec(expr);
	if (match) {
		if (match[0] in Expr.find) {
			return Expr.find[match[0]](match[1], context);
		} else {
			return Expr.filter(context.getElementsByTagName("*"), match[0], match[1]);
		}
	}
	return context.getElementsByTagName("*");
}
function filter(results, expr) {
	var match = Expr.exec(expr);
	if (match) {
		return Expr.filter(results, match[0], match[1]);
	}
	return results;
}
function children(elem, expr) {
	var tmp = [];
	elem = elem.firstChild;
	if (!elem) {
		return tmp;
	}
	do {
		elem.nodeType === 1 && tmp.push(elem);
	} while (elem = elem.nextSibling);
	return expr ? filter(tmp, expr) : tmp;
}
function next(elem, expr, nth) {
	var match = Expr.exec(expr);
	if (match) {
		return Expr.nth(elem, "nextSibling", nth||1, match[0], match[1]);
	} else {
		return Expr.nth(elem, "nextSibling", nth||1);
	}
}
function prev(elem, expr, nth) {
	var match = Expr.exec(expr);
	if (match) {
		return Expr.nth(elem, "previousSibling", nth||1, match[0], match[1]);
	} else {
		return Expr.nth(elem, "nextSibling", nth||1);
	}
}
(function(){
	var div = document.createElement("div");
	if (document.getElementsByClassName && document.documentElement.getElementsByClassName) {
		div.innerHTML = "<div class='test e'></div><div class='test'></div>";

		if ( div.getElementsByClassName("e").length === 0 )
			return;

		div.lastChild.className = "e";

		if ( div.getElementsByClassName("e").length === 1 )
			return;

		find.CLASS = function(match, context) {
			if (typeof context.getElementsByClassName !== "undefined") {
				return context.getElementsByClassName(match[1]);
			}
		};
	};
})();
/**
 * simple animate for style : top, left, width, height
 */
function animate(elem, props, speed, callback){
	speed == undefined && (speed = 200);
	var step = parseInt(speed/13),
		style = elem.style,
		timerid = null;
	for (var name in props) {
		props[name] = item(name, props[name], step);
	}
	function item(name, end, step){
		var now = parseFloat(curCSS(elem, name)) || 0;
		var unit = (end - now) / step;
		return {now:now,unit:unit,end:end};
	}
	function update(name, item) {
		item.now = item.now + item.unit;
		style[name] = item.now + 'px';
	}
	function end(name, item) {
		style[name] = item.end + 'px';
	}
	timerid = setInterval(function(){
		if (--step < 1) {
			stop();
		} else {
			for (var name in props) {
				update(name, props[name]);
			}
		}
	}, 13);
	function stop() {
		if (!timerid) return;
		clearInterval(timerid);
		timerid = null;
		for (var name in props) {
			end(name, props[name]);
		}
		typeof callback == 'function' && callback.call(elem);
	}
	this.stop = stop;
}

/**
 * date parse and format
 */
var iDate = function(){

	var rquote = /[.\\+*?\[\^\]$(){}=!<>,|:\-]/g, rabc = /([a-zA-Z])\1*/, rabcg = /([a-zA-Z])\1*/g, rwhite = /\s+/g,
	name2mon = {
		jan:0,
		feb:1,
		mar:2,
		apr:3,
		may:4,
		jun:5,
		jul:6,
		aug:7,
		sep:8,
		oct:9,
		nov:10,
		dec:11
	}, mon2name = {
		0:'January',
		1:'February',
		2:'March',
		3:'April',
		4:'May',
		5:'June',
		6:'July',
		7:'August',
		8:'September',
		9:'October',
		10:'November',
		11:'December'
	}, week2name = {
		0:'Sunday',
		1:'Monday',
		2:'Tuesday',
		3:'Wednesday',
		4:'Thursday',
		5:'Friday',
		6:'Saturday'
	}, FORMAT = {
		// ------year
		// 4 位数字完整表示的年份 例如：1999 或 2003 
		Y:{
			r:'\\d{4}',
			s:function(v, i){i.setYear(parseInt(v));},
			g:function(d){return d.getFullYear();}
		},
		yyyy:{
			r:'\\d{4}',
			s:function(v, i){i.setYear(parseInt(v));},
			g:function(d){return d.getFullYear();}
		},
		// 2 位数字表示的年份 例如：99 或 03 
		yy:{
			r:'\\d{2}',
			s:function(v, i){i.setYear(parseInt(((new Date()).getFullYear()+'').substring(0, 2) + v));},
			g:function(d){return (d.getFullYear()+'').substr(-2, 2);}
		},

		// ------month
		// 数字表示的月份，没有前导零 1 到 12
		M:{
			r:'\\d{1,2}',
			s:function(v, i){i.setMonth(toInt(v) - 1);},
			g:function(d){return d.getMonth() + 1;}
		},
		// 数字表示的月份，有前导零 01 到 12
		MM:{
			r:'\\d{1,2}',
			s:function(v, i){i.setMonth(toInt(v) - 1);},
			g:function(d){return pad(d.getMonth() + 1, 2);}
		},
		// 三个字母缩写表示的月份 Jan 到 Dec 
		MMM:{
			r:'[a-z]{3}',
			s:function(v, i){i.setMonth(name2mon[v.toLowerCase()]);},
			g:function(d){return mon2name[d.getMonth()].substring(0, 3);}
		},
		// 月份，完整的文本格式，例如 January 或者 March January 到 December
		MMMM:{
			r:'\\w{3,9}',
			s:function(v, i){i.setMonth(name2mon[v.substring(0, 3).toLowerCase()]);},
			g:function(d){return mon2name[d.getMonth()];}
		},

		// ------date
		// 月份中的第几天，没有前导零 1 到 31
		d:{
			r:'\\d{1,2}',
			s:function(v, i){i.setDate(toInt(v));},
			g:function(d){return d.getDate();}
		},
		// 月份中的第几天，有前导零的 2 位数字 01 到 31 
		dd:{
			r:'\\d{1,2}',
			s:function(v, i){i.setDate(toInt(v));},
			g:function(d){return pad(d.getDate(), 2);}
		},

		// --- am pm
		// 上午和下午值 am 或 pm
		tt:{
			r:'[ap]m',
			s:function(v, i){i.pm == v.toLowerCase() == 'pm';},
			g:function(d){return d.getHours() >= 12 ? 'pm' : 'am';}
		},

		// --- hour
		// 小时，24 小时格式，没有前导零 0 到 23
		H:{
			r:'\\d{1,2}',
			s:function(v, i){i.setHours(toInt(v));},
			g:function(d){return d.getHours();}
		},
		// 小时，24 小时格式，有前导零 00 到 23
		HH:{
			r:'\\d{1,2}',
			s:function(v, i){i.setHours(toInt(v));},
			g:function(d){return pad(d.getHours(), 2);}
		},
		// 小时，12 小时格式，没有前导零 1 到 12
		h:{
			r:'\\d{1,2}',
			s:function(v, i){i.setHours(toInt(v) + (i.pm ? 12 : 0));},
			g:function(d){return d.getHours()%12 || 12;}
		},
		// 小时，12 小时格式，有前导零 01 到 12
		hh:{
			r:'\\d{1,2}',
			s:function(v, i){i.setHours(toInt(v) + (i.pm ? 12 : 0));},
			g:function(d){return pad(d.getHours()%12 || 12, 2);}
		},
		
		m:{
			r:'\\d{1,2}',
			s:function(v, i){i.setMinutes(toInt(v));},
			g:function(d){return d.getMinutes();}
		},
		// 有前导零的分钟数 00 到 59
		mm:{
			r:'\\d{1,2}',
			s:function(v, i){i.setMinutes(toInt(v));},
			g:function(d){return pad(d.getMinutes(), 2);}
		},

		s:{
			r:'\\d{1,2}',
			s:function(v, i){i.setSeconds(toInt(v));},
			g:function(d){return d.getSeconds();}
		},
		// 秒数，有前导零 00 到 59
		ss:{
			r:'\\d{1,2}',
			s:function(v, i){i.setSeconds(toInt(v));},
			g:function(d){return pad(d.getSeconds(), 2);}
		},

		// 星期：
		// 星期中的第几天，数字表示 0（表示星期天）到 6（表示星期六） 
		w:{
			r:'\\d',
			g:function(d){return d.getDay();}
		},
		// 1（表示星期一）到 7（表示星期天）
		N:{
			r:'\\d',
			g:function(d){return d.getDay() || 7;}
		},
		// 星期几，完整的文本格式 Sunday 到 Saturday
		DD:{
			r:'[a-z]{3,9}',
			g:function(d){return week2name[d.getDay()];}
		},
		// 星期中的第几天，文本表示，3 个字母 Mon 到 Sun
		D:{
			r:'[a-z]{3}',
			g:function(d){return week2name[d.getDay()].substring(0, 3);}
		},
		// 与格林威治时间相差的小时数 例如：+0200
		O:{
			r:'[+-]\\d{2}:?\\d{2}',
			g:function(d){return pad(-d.getTimezoneOffset()/60, 2) + '00';}
		}
	};
	function quote(str){
		return str.replace(rquote, '\\$&').replace(rwhite, '\\s+');
	}
	function iDate(match){
		this.date = new Date();
		for (var k in FORMAT) {
			(k in match) && FORMAT[k].s && FORMAT[k].s(match[k], this);
		}
	}
	iDate.format = function(format, date){
		return format.replace(rabcg, function(flag){
			return (flag in FORMAT) ? FORMAT[flag].g(date) : flag;
		});
	};
	iDate.parse = function(format, input){
		var match = {}, i=1, regex = '', m, flag, rets;
		while (format) {
			m = rabc.exec(format);
			if (!m) {
				regex += quote(format);
				break;
			}
			flag = m[0];
			regex += quote(format.substring(0, m.index));
			if (flag in FORMAT) {
				match[flag] = i++;
				regex += '('+FORMAT[flag].r+')';
			} else {
				regex += flag;
			}
			format = format.substr(m.index+flag.length);
		}
		if (!(rets = (new RegExp(regex, 'i')).exec(input))) {
			return null;
		}
		for (var k in match) {
			match[k] = rets[match[k]];
		}
		return (new iDate(match)).getDate();
	};
	iDate.prototype = {
		setYear:function(v){v > 0 && this.date.setFullYear(v);},
		setMonth:function(v){v > -1 && this.date.setMonth(v);},
		setDate:function(v){v > 0 && this.date.setDate(v);},
		setHours:function(v){this.date.setHours(v);},
		setMinutes:function(v){this.date.setMinutes(v);},
		setSeconds:function(v){this.date.setSeconds(v);},
		getDate:function(){return this.date;}
	};
	return iDate;
}();
// ---- end support

var CLASSES = {
	PANEL:'datepanel',
	WRAPPER:'datepanel-wrapper',
	HEAD:'datepanel-head',
	BODY:'datepanel-body',
	FOOT:'datepanel-foot',
	PREV:'datepanel-prev',
	UP:'datepanel-up',
	NEXT:'datepanel-next',
	FOCUS:'datepanel-focus',
	ENTRY:'datepanel-entry',
	ITEM:'datepanel-item',
	DECADE:'datepanel-decade',
	YEAR:'datepanel-year',
	MONTH:'datepanel-month',
	WEEK:'datepanel-week',
	DATE:'datepanel-date',
	TODAY:'datepanel-today',
	TIME:'datepanel-time',
	BUTTON:'datepanel-button'
};
var EVENT = {
	DECADE_CHANGED:1,
	YEAR_CHANGED:2,
	MONTH_CHANGED:3,
	VIEW_CHANGED:4,
	DATE_FOCUSED:5,
	ITEM_CLICKED:6,
	DATE_CLICKED:7,
	YEAR_PREPARED:8,
	MONTH_PREPARED:9
};
var LOCALE = {
	WEEKNAME:['日','一','二','三','四','五','六'],
	MONTHNAME:['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
	FORMAT:'yyyy年M月',
	TIME:'时间',
	OK:'确定',
	TODAY:'今天',
	NOW:'现在',
	EMPTY:'清空'
	
	/*
	WEEKNAME:['Su','Mo','Tu','We','Th','Fr','Sa'],
	MONTHNAME:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
	FORMAT:'MMMM yyyy',
	TIME:'TIME',
	OK:'OK',
	TODAY:'TODAY',
	NOW:'NOW',
	EMPTY:'EMPTY'
	*/
};
var COMMON_FORMAT = [
	'Y-M-d H:m:s', 'Y/M/d H:m:s', 'Y年M月d日 H:m:s',
	'd MMMM Y H:m:s', 'Y-M-d', 'Y/M/d', 'M/d/Y',
	'Y年M月d日', 'd MMMM Y'
];

var DatePanel = function(){

	var FX_TIME = 160;
	var OPTIONS = {
		/*
		minDate:,
		maxDate:,
		*/
		switchOnClick:true,
		format:'yyyy-MM-dd',
		value:null,
		startDay:0,
		place:null,
		buttons:null
	};
	var compareDate = function(){
		function toFloat(d, x) {
			if (typeof d == 'number') {
				return d;
			}
			x || (x = 100);
			d = d.split('-');
			var s = 0;
			for (var i=0, l=d.length; i<l; i++) {
				s += parseInt(d[i]) / Math.pow(x, i);
			}
			return s;
		}
		return function(d1, d2, x){
			d1 = toFloat(d1, x);
			d2 = toFloat(d2, x);
			return d1 == d2 ? 0 : (d1 > d2 ? 1 : -1);
		}
	}();
	function parseDate(value, format){
		if (!value || typeof value != 'string') {
			return new Date();
		}
		var date;
		return iDate.parse(format, value)
		|| ((date = Date.parse(value)) && (new Date(date)))
		|| (each(COMMON_FORMAT, function(f){
			date = iDate.parse(f, value);
			return date ? false : 1;
		}), date) || new Date();
	}
	function DatePanel(options) {
		this._events = {};
		this._options = {};
		extend(this._options, OPTIONS);
		options && extend(this._options, options);
	}
	DatePanel.prototype = {
		create:function(){
			if (this._created) {
				return;
			}
			var t = this, o = t._options;
			t._created = true;
			t._startDay = (parseInt(o.startDay) || 0)%7;
			
			var week = ['<div class="'+CLASSES.WEEK+'">'];
			for (var i=0,w;i<7;i++) {
				w = (i + t._startDay) % 7;
				week.push('<b class="'+CLASSES.WEEK+'-'+w+'">'+LOCALE.WEEKNAME[w]+'</b>');
			}
			week.push('</div>');
			t._weekday = week.join('');
			week = null;

			var d = parseDate(o.value, o.format),
				year = d.getFullYear(),
				month = d.getMonth(),
				date = d.getDate(),
				hours = d.getHours(),
				minutes = d.getMinutes(),
				seconds = d.getSeconds();

			t._hasTime = rhastime.test(o.format);

			t._switchOnClick = t._hasTime || o.switchOnClick;

			t._curYear = year;
			t._curMonth = month;
			t._curDate = date;

			t._focusedYear = null;
			t._focusedMonth = null;
			t._focusedDate = null;

			
			var wrapper = appendTo('<div class="'+CLASSES.WRAPPER+'"></div>', o.place || document.body);
			var head = appendTo(
				'<div class="'+CLASSES.HEAD+'">'+
					'<a href="" hideFocus class="'+CLASSES.PREV+'">&#x00AB;</a>'+
					'<a href="" hideFocus class="'+CLASSES.UP+'"></a>'+
					'<a href="" hideFocus class="'+CLASSES.NEXT+'">&#x00BB;</a>'+
				'</div>', wrapper);
			var body = appendTo(
				'<div class="'+CLASSES.BODY+'">'+
					'<div class="'+CLASSES.DECADE+'"></div>'+
					'<div class="'+CLASSES.YEAR+'"></div>'+
					'<div class="'+CLASSES.MONTH+'"></div>'+
				'</div>', wrapper);
			var foot = appendTo('<div class="'+CLASSES.FOOT+'"></div>', wrapper);

			if (t._hasTime) {
				t._timeBox = find(appendTo(
					'<div class="'+CLASSES.TIME+'">'+
						'<span class="'+CLASSES.TIME+'-label">'+LOCALE.TIME+'</span>'+
						'<span class="'+CLASSES.TIME+'-value">'+
							'<a class="'+CLASSES.TIME+'-h">'+hours+'</a><b>&#x2236;</b>'+
							'<a class="'+CLASSES.TIME+'-m">'+minutes+'</a><b>&#x2236;</b>'+
							'<a class="'+CLASSES.TIME+'-s">'+seconds+'</a>'+
						'</span>'+
					'</div>', foot),
				'input');
			}
			if (o.buttons) {
				var buttonArea = appendTo('<div class="'+CLASSES.BUTTON+'"></div>', foot), buttons = [];
				for (var name in o.buttons) {
					buttons.unshift('<a name="'+name+'" hideFocus class="'+CLASSES.ITEM+'" href="">'+name+'</a>');
				}
				buttonArea.innerHTML = buttons.join('');
				Event.add(buttonArea, 'click', function(e){
					var elem = e.target;
					if (elem && elem.nodeName == 'A') {
						e.halt();
						var name = elem.getAttribute('name');
						name && (name in o.buttons) && o.buttons[name].call(t);
					}
				});
			}
			
			Event.add(head, 'click', function(e){
				var elem = e.target;
				if (elem && elem.nodeName == 'A') {
					e.halt();
					if (hasClass(elem, CLASSES.UP)) {
						var d = elem.getAttribute('date');
						if (t._viewmode == 1) {
							t._setYear(d);
						} else if (t._viewmode == 2) {
							t._setDecade(d);
						}
					} else {
						t.go(hasClass(elem, CLASSES.PREV) ? -1 : 1);
					}
				}
			});
			Event.add(body, 'click', function(e){
				var elem = e.target;
				if (elem.nodeName == 'A') {
					e.halt();
					var v = elem.getAttribute('date'), l = v.split('-');
					if (l.length == 3) {
						if (t._switchOnClick) {
							t.setMonth(v);
						} else {
							if (t._focusedDate != elem) {
								t._focusedDate && removeClass(t._focusedDate, CLASSES.FOCUS);
								t._focusedDate = addClass(elem, CLASSES.FOCUS);
							}
							t._trigger(EVENT.DATE_FOCUSED, l[0], l[1], l[2]);
						}
						t._trigger(EVENT.DATE_CLICKED, v, elem);
					} else {
						l.length == 2 ? t.setMonth(v) : t._setYear(v);
					}
					t._trigger(EVENT.ITEM_CLICKED, v, elem);
				}
			});
			mousewheel(body, function(e){
				t.go(e.delta * -1);
				e.halt();
			});
			var headup = find(head, '.'+CLASSES.UP)[0];
			t.bind('VIEW_CHANGED', function(mode, args){
				var txt, val;
				if (mode == 1) {
					txt = iDate.format(LOCALE.FORMAT, new Date(args[0], args[1]));
					val = args.join('-');
				} else if (mode == 2) {
					txt = args[0];
					val = args[0];
				} else {
					txt = args[0]+'-'+args[1];
					val = txt;
				}
				headup.innerHTML = txt;
				headup.setAttribute('date', val);
			});
			var holders = children(body);
			t._decadeWrapper = holders[0];
			t._yearWrapper = holders[1];
			t._monthWrapper = holders[2];
			holders = null;
			t._inAnimate = [];
			t._viewmode = 1;

			var test = appendTo(t._renderMonthEntry(year, month), t._monthWrapper);
			css(t._monthWrapper, 'display', 'block');
			var dim = {
				width:test.offsetWidth,
				height:test.offsetHeight
			};
			css(wrapper, 'width', dim.width);
			css(body, dim);
			css(t._decadeWrapper, dim);
			css(t._yearWrapper, dim);
			css(t._monthWrapper, dim);

			t._wrapper = wrapper;
			t._dim = dim;
			t.setMonth(year+'-'+month+'-'+date);
		},
		_renderDateItem:function(year, month, date, flag) {
			var cls = CLASSES.ITEM, val = year+'-'+month+'-'+date;
			if (flag) {
				cls += ' '+(flag > 0 ? CLASSES.NEXT : CLASSES.PREV);
			}
			var now = new Date();
			if ([now.getFullYear(), now.getMonth(), now.getDate()].join('-')== val) {
				cls += ' '+CLASSES.TODAY;
			}
			return '<a href="" hideFocus class="'+cls+'" date="'+val+'">'+date+'</a>';
		},
		_renderMonthItem:function(year, month) {
			return '<a href="" hideFocus class="'+CLASSES.ITEM+'" date="'+year+'-'+month+'">'+LOCALE.MONTHNAME[month]+'</a>';
		},
		_renderYearItem:function(year){
			return '<a href="" hideFocus class="'+CLASSES.ITEM+'" date="'+year+'">'+year+'</a>';
		},
		_renderDecadeEntry:function(start, end){
			var entry = toElement('<div class="'+CLASSES.ENTRY+'" date="'+start+'-'+end+'"></div>'), html = [];
			for (var i=0,s = start-1; i<12; i++) {
				html.push(this._renderYearItem(s+i));
				i%4 == 3 && i != 11 && html.push('<br />');
			}
			entry.innerHTML = html.join('');
			return entry;
		},
		_renderYearEntry:function(year) {
			var entry = toElement('<div class="'+CLASSES.ENTRY+'" date="'+year+'"></div>'), html = [];
			for (var i=0; i<12; i++) {
				html.push(this._renderMonthItem(year, i));
				i%4 == 3 && i != 11 && html.push('<br />');
			}
			entry.innerHTML = html.join('');
			this._trigger(EVENT.YEAR_PREPARED, entry, year);
			return entry;
		},
		_renderMonthEntry:function(year, month) {
			var t = this, d = new Date(year, month, 1),
				diffWeek = d.getDay() - t._startDay,
				entry = toElement('<div class="'+CLASSES.ENTRY+'" date="'+year+'-'+month+'"></div>'),
				html = [t._weekday],
				datepos = (diffWeek < 0 ? -6 : 1) - diffWeek,
				realDate, realMonth, realYear, base = year + month/100, i = 1;
			(ie6 || !boxModel) && html.push('<br />');
			html.push('<div class="'+CLASSES.DATE+'">');
			do {
				d.setDate(datepos);
				realYear = d.getFullYear();
				realDate = d.getDate();
				realMonth = d.getMonth();
				html.push(t._renderDateItem(realYear, realMonth, realDate, (realYear+realMonth/100) - base));
				i%7 == 0 && i != 42 && html.push('<br />');
				datepos = realDate + 1;
			} while (i++ < 42);
			html.push('</div>');
			entry.innerHTML = html.join('');
			t._trigger(EVENT.MONTH_PREPARED, entry, year, month);
			return entry;
		},
		_clearAnimate:function(){
			each(this._inAnimate, function(){
				this.stop();
			});
			this._inAnimate = [];
		},
		_setDecade:function(year) {
			var t = this,
				year = (year && parseInt(year.toString().split('-')[0])) || t._curYear,
				start = year - year%10, end = start + 9,
				dW = t._decadeWrapper,
				yW = t._yearWrapper, mW = t._monthWrapper,
				dim = t._dim,
				entrys = children(dW, '.'+CLASSES.ENTRY), entry;
			if (start < 1900) {
				return;
			}
			if (!entrys.length || !(entry = filter(entrys, '@'+start+'-'+end)[0])) {
				entry = appendTo(t._renderDecadeEntry(start, end), dW);
				css(entry, dim);
			}
			
			t._clearAnimate();

			if (t._viewmode == 3) {
				var focused = filter(entrys, '.'+CLASSES.FOCUS)[0];
				if (focused) {
					var cet = compareDate(focused.getAttribute('date'), start+'-'+end, 10000);
					if (cet) {
						t._inAnimate.push(new animate(removeClass(css(focused, 'position', 'absolute'), CLASSES.FOCUS), {
							left:cet * dim.width
						}, FX_TIME, function(){
							css(focused, {
								display:'none',
								position:'',
								left:0
							});
						}));

						t._inAnimate.push(new animate(addClass(css(entry, {
							position:'absolute',
							left:-cet * dim.width,
							display:'block'
						}), CLASSES.FOCUS), {
							left:0
						}, FX_TIME, function(){
							css(entry, 'position', '');	
						}));
					}
				} else {
					addClass(entry, CLASSES.FOCUS);
				}
			} else {
				var from = t._viewmode == 2 ? yW : mW,
					fyear = children(from, '.'+CLASSES.FOCUS)[0].getAttribute('date').split('-')[0];
				each(filter(entrys, '.'+CLASSES.FOCUS), function(t){
					removeClass(css(t, 'display', 'none'), CLASSES.FOCUS);
				});
				css(addClass(entry, CLASSES.FOCUS), 'display', 'block');
				css(dW, extend({
					position:'absolute',
					left:0,top:0,zIndex:0,
					display:'block'
				}, dim));

				var m = children(entry, '@'+fyear)[0], pos = position(m);
				t._inAnimate.push(new animate(css(from, {
					position:'absolute',
					zIndex:1
				}), {
					width:m.offsetWidth,
					height:m.offsetHeight,
					top:pos.top,
					left:pos.left
				}, FX_TIME, function(){
					css(from, {
						display:'none',
						position:''
					});
					css(dW, 'position', '');
				}));
			}
			t._viewmode = 3;
			t._curYear = year;
			var elem = find(entry, '@'+year)[0];
			if (t._focusedYear != elem) {
				t._focusedYear && removeClass(t._focusedYear, CLASSES.FOCUS);
				t._focusedYear = addClass(elem, CLASSES.FOCUS);
			}
			t._trigger(EVENT.DECADE_CHANGED, start, end, year);
			t._trigger(EVENT.VIEW_CHANGED, t._viewmode, [start, end, year]);
		},
		_setYear:function(value) {
			value = value ? value.toString().split('-') : [];
			var t = this,
				year = parseInt(value[0]) || t._curYear, month = parseInt(value[1]) || t._curMonth,
				yW = t._yearWrapper, mW = t._monthWrapper, dW = t._decadeWrapper,
				dim = t._dim,
				entrys = children(yW, '.'+CLASSES.ENTRY), entry;
			if (year < 1900) {
				return;
			}
			if (!entrys.length || !(entry = filter(entrys, '@'+year)[0])) {
				entry = appendTo(t._renderYearEntry(year), yW);
				css(entry, dim);
			}
			
			t._clearAnimate();
			
			if (t._viewmode == 1) {
				each(filter(entrys, '.'+CLASSES.FOCUS), function(t){
					removeClass(css(t, 'display', 'none'), CLASSES.FOCUS);
				});
				css(addClass(entry, CLASSES.FOCUS), 'display', 'block');
				css(yW, extend({
					display:'block',
					position:'absolute',
					left:0,top:0,zIndex:0
				}, dim));
				var m = children(entry, '@'+year+'-'+month)[0], pos = position(m);
				t._inAnimate.push(new animate(css(mW, {
					position:'absolute',
					zIndex:1
				}), {
					width:m.offsetWidth,
					height:m.offsetHeight,
					top:pos.top,
					left:pos.left
				}, FX_TIME, function(){
					css(mW, {
						display:'none',
						position:''
					});
					css(yW, 'position', '');
				}));
			} else if (t._viewmode == 2) {
				var focused = filter(entrys, '.'+CLASSES.FOCUS)[0];
				if (focused) {
					var cret = compareDate(focused.getAttribute('date'), year);
					if (cret) {
						t._inAnimate.push(new animate(removeClass(css(focused, 'position', 'absolute'), CLASSES.FOCUS), {
							left:cret * dim.width
						}, FX_TIME, function(){
							css(focused, {
								position:'',
								display:'none',
								left:0
							});
						}));

						t._inAnimate.push(new animate(addClass(css(entry, {
							position:'absolute',
							left:-cret * dim.width,
							display:'block'
						}), CLASSES.FOCUS), {
							left:0
						}, FX_TIME, function(){
							css(entry, 'position', '');
						}));
					}
				} else {
					addClass(entry, CLASSES.FOCUS);
				}
			} else {
				each(filter(entrys, '.'+CLASSES.FOCUS), function(t){
					removeClass(css(t, 'display', 'none'), CLASSES.FOCUS);
				});
				css(addClass(entry, CLASSES.FOCUS), 'display', 'block');

				var focused = children(dW, '.'+CLASSES.FOCUS)[0],
					start = year - year%10,
					cet = compareDate(focused.getAttribute('date'), start+'-'+(start+9), 10000);
				if (cet) {
					t._inAnimate.push(new animate(css(dW, 'position', 'absolute'), {
						left:cet * dim.width
					}, FX_TIME, function(){
						css(dW, {
							display:'none',
							position:'',
							left:0
						});
					}));
					t._inAnimate.push(new animate(css(yW,{
						width:dim.width,
						height:dim.height,
						position:'absolute',
						top:0,
						left:-cet * dim.width,
						display:'block'
					}), {
						left:0
					}, FX_TIME,function(){
						css(yW, 'position', '');	
					}));
				} else {
					var m = children(focused, '@'+year)[0], pos = position(m);
					css(dW, {
						position:'absolute',
						zIndex:0
					});
					t._inAnimate.push(new animate(css(yW, {
						width:m.offsetWidth,
						height:m.offsetHeight,
						position:'absolute',
						top:pos.top,
						left:pos.left,
						zIndex:1,
						display:'block'
					}), extend({
						top:0,
						left:0
					}, dim), FX_TIME, function(){
						css(dW, {
							display:'none',
							position:''
						});
						css(yW, 'position', '');
					}));
				}
			}
			t._viewmode = 2;
			t._curYear = year;
			t._curMonth = month;
			var elem = find(entry, '@'+year+'-'+month)[0];
			if (t._focusedMonth != elem) {
				t._focusedMonth && removeClass(t._focusedMonth, CLASSES.FOCUS);
				t._focusedMonth = addClass(elem, CLASSES.FOCUS);
			}
			t._trigger(EVENT.YEAR_CHANGED, year);
			t._trigger(EVENT.VIEW_CHANGED, t._viewmode, [year]);
		},
		setMonth:function(value, quick){
			value = value ? value.toString().split('-') : [];
			var t = this,
				year = parseInt(value[0]) || t._curYear,
				month = parseInt(value[1]),
				date = parseInt(value[2]),
				mW = t._monthWrapper, yW = t._yearWrapper, dW = t._decadeWrapper,
				dim = t._dim,
				entrys = children(mW, '.'+CLASSES.ENTRY), entry;
			month == undefined && (month = t._curMonth);
			if (year < 1900) {
				return;
			}
			if (!entrys.length || !(entry = filter(entrys, '@'+year+'-'+month)[0])) {
				entry = appendTo(t._renderMonthEntry(year, month), mW);
				css(entry, dim);
			}

			t._clearAnimate();

			if (t._viewmode == 1) {
				var focused = filter(entrys, '.'+CLASSES.FOCUS)[0];
				if (!quick && focused) {
					var cet = compareDate(focused.getAttribute('date'), year+'-'+month);
					if (cet) {
						t._inAnimate.push(new animate(removeClass(css(focused, 'position', 'absolute'), CLASSES.FOCUS), {
							left:cet * dim.width
						}, FX_TIME, function(){
							css(focused, {
								position:'',
								display:'none',
								left:0
							});
						}));
						
						addClass(css(entry, {
							left:-cet * dim.width,
							position:'absolute',
							display:'block'
						}), CLASSES.FOCUS);

						t._inAnimate.push(new animate(entry, {
							left:0
						}, FX_TIME, function(){
							css(entry, 'position', '');
						}));
					}
				} else {
					focused && removeClass(css(focused, 'display', 'none'), CLASSES.FOCUS);
					addClass(css(entry, extend({display:'block',left:0,top:0}, dim)), CLASSES.FOCUS);
				}
			} else {
				each(filter(entrys, '.'+CLASSES.FOCUS), function(t){
					removeClass(css(t, 'display', 'none'), CLASSES.FOCUS);
				});
				css(addClass(entry, CLASSES.FOCUS), 'display', 'block');

				var wrapper, focused, cet, gval;
				if (t._viewmode == 2) {
					wrapper = yW;
					focused = children(yW, '.'+CLASSES.FOCUS)[0];
					cet = compareDate(focused.getAttribute('date'), year);
					gval = year+'-'+month;
				} else {
					wrapper = dW;
					focused = children(dW, '.'+CLASSES.FOCUS)[0];
					var start = year - year%10;
					cet = compareDate(focused.getAttribute('date'), start+'-'+(start+9), 10000);
					gval = year;
				}
				if (quick) {
					css(wrapper, 'display', 'none');
					css(mW, extend({display:'block',left:0,top:0}, dim));
				} else if (cet) {
					t._inAnimate.push(new animate(css(wrapper, 'position', 'absolute'), {
						left:cet * dim.width
					}, FX_TIME, function(){
						css(wrapper, {
							position:'',
							left:0,
							display:'none'
						});
					}));
					t._inAnimate.push(new animate(css(mW, {
						width:dim.width,
						height:dim.height,
						position:'absolute',
						top:0,
						left:-cet * dim.width,
						display:'block'
					}), {
						left:0
					}, FX_TIME, function(){
						css(mW, 'position', '');	
					}));
				} else {
					var m = children(focused, '@'+gval)[0], pos = position(m);
					css(wrapper, {
						zIndex:0,
						position:'absolute'
					});
					t._inAnimate.push(new animate(css(mW, {
						width:m.offsetWidth,
						height:m.offsetHeight,
						position:'absolute',
						top:pos.top,
						left:pos.left,
						zIndex:1,
						display:'block'
					}), extend({
						top:0,
						left:0
					}, dim), FX_TIME, function(){
						css(mW, 'position', '');
						css(wrapper, {
							display:'none',
							position:''
						});
					}));
				}
			}
			t._curYear = year;
			t._curMonth = month;
			if (!date && (!t._focusedDate || t._switchOnClick)) {
				date = t._curDate;
			}
			if (date) {
				var d1 = year+'-'+month+'-'+date, d2;
				var elems = find(entry, '.'+CLASSES.ITEM), l = elems.length, elem;
				while (elem = elems[--l]) {
					if (compareDate((d2 = elem.getAttribute('date')), d1) <= 0) {
						date = parseInt(d2.split('-')[2]);
						break;
					}
				}
				if (t._focusedDate != elem) {
					t._focusedDate && removeClass(t._focusedDate, CLASSES.FOCUS);
					t._focusedDate = addClass(elem, CLASSES.FOCUS);
				}
				t._curDate = date;
				t._trigger(EVENT.DATE_FOCUSED, year, month, date);
			}
			t._viewmode = 1;
			t._trigger(EVENT.MONTH_CHANGED, year, month);
			t._trigger(EVENT.VIEW_CHANGED, t._viewmode, [year, month]);
		},
		_trigger:function(event){
			var handlers, t = this, args = slice.call(arguments, 1);
			if (event && (handlers = t._events[event])) {
				each(handlers, function(fn){
					fn.apply(t, args);
				});
			}
		},
		bind:function(event, fn){
			if (event = EVENT[event]) {
				if (!this._events[event]) {
					this._events[event] = [];
				}
				this._events[event].push(fn);
			}
			return this;
		},
		go:function(flag){
			var t = this;
			if (t._viewmode == 1) {
				var d = new Date(t._curYear, t._curMonth + flag, 1);
				t.setMonth(d.getFullYear()+'-'+d.getMonth());
			} else if (t._viewmode == 2) {
				t._setYear((t._curYear + flag));
			} else {
				t._setDecade(t._curYear + flag * 10);
			}
		},
		setTime:function(value){
			var t = this, d = parseDate(value, t._options.format);
			t.setMonth(d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate(), true);
			if (t._hasTime) {
				t._timeBox[0].value = d.getHours();
				t._timeBox[1].value = d.getMinutes();
				t._timeBox[2].value = d.getSeconds();
			}
		},
		getDate:function(){
			var t = this, d = t._focusedDate.getAttribute('date').split('-'), now = new Date(), h, m, s;
			if (t._hasTime) {
				h = toInt(t._timeBox[0].value);
				m = toInt(t._timeBox[1].value);
				s = toInt(t._timeBox[2].value);
			} else {
				h = now.getHours();
				m = now.getMinutes();
				s = now.getSeconds();
			}
			return new Date(d[0], d[1], d[2], h, m, s);
		},
		format:function(format, date){
			return iDate.format(format||this._options.format, date || this.getDate());
		},
		formatNow:function(format){
			return this.format(format, new Date());
		},
		toString:function(){
			return this.format();
		}
	};
	return DatePanel;
}();

var DatePicker = function(){
	var rinput = /INPUT|TEXTAREA/;
	var OPTIONS = {
		format:'yyyy-MM-dd',
		value:null,
		hideOnClick:true,
		startDay:0
	};
	var contains = document.compareDocumentPosition ?  function(a, b){
		return a.compareDocumentPosition(b) & 16;
	} : function(a, b){
		return a !== b && (a.contains ? a.contains(b) : true);
	};
	function pos(block, box) {
		var sT = ('pageYOffset' in window) ? window.pageYOffset :
				boxModel && document.documentElement.scrollTop || document.body.scrollTop,
			sL = ('pageXOffset' in window) ? window.pageXOffset :
				boxModel && document.documentElement.scrollLeft || document.body.scrollLeft,
			iH = boxModel && document.documentElement.clientHeight || document.body.clientHeight,
			iW = boxModel && document.documentElement.clientWidth || document.body.clientWidth,
			off = offset(block), box;


		if (off.left - sL + box.offsetWidth > iW) {
			box.style.left = Math.max(off.left + block.offsetWidth - box.offsetWidth, sL) + 'px';
		} else {
			box.style.left = off.left + 'px';
		}

		if (off.top - sT + block.offsetHeight + box.offsetHeight > iH) {
			box.style.top = Math.max(sT, off.top - box.offsetHeight) + 'px';
		} else {
			box.style.top = off.top + block.offsetHeight + 'px';
		}
	}
	function DatePicker(button, options){
		if (!button || button.nodeType !== 1) {
			throw 'Expert DOMElement NODETYPE:1';
		}
		var inst = data(button, 'datepicker');
		if (inst) {
			return inst.show();
		}
		if ('_init' in this) {
			this._init(button, options);
		} else {
			new DatePicker(button, options);
		}
	}
	DatePicker.prototype = {
		_init:function(button, options){
			var t = this, dp = null;
			var panel = appendTo('<div class="'+CLASSES.PANEL+'"></div>', document.body);
			var o = extend({}, OPTIONS);
			options && extend(o, options);
			var hastime = rhastime.test(o.format);
			var hideOnClick = (!hastime) && o.hideOnClick;
			var buttons = {};
			
			if (o.value) {
				if (typeof o.value != 'function') {
					var elem = o.value, attr = rinput.test(elem.nodeName) ? 'value' : 'innerHTML';
					o.value = function(v){
						if (v !== undefined) {
							elem[attr] = v;
						} else {
							return elem[attr];
						}
					};
				}
			} else {
				o.value = rinput.test(button.nodeName) ? function(v){
					if (v !== undefined) {
						button.value = v;
					} else {
						return button.value;
					}
				} : function(){};
			}
			function call_input_func(){
				o.value.call(dp, dp.format());
				t.hide();
			}
			hideOnClick || (buttons[LOCALE.OK] = call_input_func);
			buttons[hastime ? LOCALE.NOW : LOCALE.TODAY] = function(){
				o.value.call(dp, dp.formatNow());
				t.hide();
			};
			buttons[LOCALE.EMPTY] = function(){
				o.value.call(dp, '');
				t.hide();
			};
			css(panel, {
				visibility:'hidden',
				display:'block',
				position:'absolute',
				left:-500,
				top:-500,
				width:500,
				height:500
			});
			dp = new DatePanel({
				switchOnClick:!hideOnClick,
				format:o.format || 'yyyy-MM-dd',
				startDay:o.startDay,
				place:panel,
				buttons:buttons
			});
			hideOnClick && dp.bind('DATE_CLICKED', call_input_func);
			dp.create();
			css(panel, {
				width:'',
				height:''
			});
			data(button, 'datepicker', t);
			t._dp = dp;
			t._hid = null;
			t._panel = panel;
			t._button = button;
			t._options = o;
			t._visible = false;
			t.show();
		},
		_getCapture:function(e){
			var w = this._panel, t = e.target;
			return t && (t == w || contains(w, t) || t == this._button);
		},
		hide:function(){
			var t = this;
			t._visible = false;
			t._hid && Event.remove(document, 'mousedown', t._hid);
			t._hid = null;
			t._panel.style.display = 'none';
		},
		show:function(){
			var t = this;
			if (t._visible) {
				return;
			}
			t._visible = true;
			setTimeout(function(){
				t._hid = Event.add(document, 'mousedown', function(e){
					t._getCapture(e) || t.hide();
				});
			}, 0);
			extend(t._panel.style, {
				visibility:'hidden',
				display:'block'
			});
			pos(t._button, t._panel);
			t._panel.style.visibility = 'visible';
			t._dp.setTime(t._options.value());
		}
	};
	return DatePicker;
}();

DatePanel.setLocale = DatePicker.setLocale = function(locale){
	LOCALE = locale;
};
window.DatePanel = DatePanel;
window.DatePicker = DatePicker;

if ('jQuery' in window) {
	jQuery.fn.DatePicker = function(options){
		this.bind(options.event||'click', function(){
			DatePicker(this, options);
		});
	}
}
})(window);