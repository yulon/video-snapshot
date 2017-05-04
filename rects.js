var ves = document.querySelectorAll('video, [type="application/x-shockwave-flash"]');
var rects = new Array();

for (var i = 0; i < ves.length; i++) {
	var rect = ves[i].getBoundingClientRect();
	if (
		window.innerWidth > rect.left &&
		rect.left + rect.width > 0 &&
		window.innerHeight > rect.top &&
		rect.top + rect.height > 0
	) {
		rects.push({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
	}
}

chrome.runtime.sendMessage(null, rects);
