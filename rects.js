var videos = document.querySelectorAll('video');
var flashs = document.querySelectorAll('object[type="application/x-shockwave-flash"]');

var rects = new Array();

function getRects(eles) {
	for (var i = 0; i < eles.length; i++) {
		var rect = eles[i].getBoundingClientRect();
		if (
			window.innerWidth > rect.left &&
			rect.left + rect.width > 0 &&
			window.innerHeight > rect.top &&
			rect.top + rect.height > 0
		) {
			rects.push({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
		}
	}
}
getRects(videos);
getRects(flashs);

chrome.runtime.sendMessage(null, rects);
