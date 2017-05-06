var sels = {
	"dilidili.": ".player_main"
}
var sel;

for (var i in sels) {
	if (window.location.host.search(i) !== -1) {
		sel = sels[i];
		break;
	}
}
if (!sel) {
	sel = 'video, object, embed';
}

var rects = new Array();

function cpyPos(src) {
	if (src) {
		return { left: src.left, top: src.top };
	} else {
		return null;
	}
}

(function(wnd, basePos) {
	try {
		for (var i = 0; i < wnd.frames.length; i++) {
			var fBasePos = cpyPos(basePos);

			if (wnd.frames[i].frameElement) {
				var fRect = wnd.frames[i].frameElement.getBoundingClientRect();
				if (!fBasePos) {
					fBasePos = { left: 0, top: 0 };
				}
				fBasePos.left += fRect.left + wnd.frames[i].frameElement.clientLeft;
				fBasePos.top += fRect.top + wnd.frames[i].frameElement.clientTop;
			}

			arguments.callee(wnd.frames[i], fBasePos, sel);
		}
	} catch (e) {
		console.error("[Video Capture]", e);
	}

	////////////////////////////////////////////////////////////////////////////

	var ves = wnd.document.querySelectorAll(sel);

	for (var i = 0; i < ves.length; i++) {
		var nRect = ves[i].getBoundingClientRect();
		var rect = { left: nRect.left, top: nRect.top, width: nRect.width, height: nRect.height };

		if (basePos) {
			rect.left += basePos.left;
			rect.top += basePos.top;
		}

		if (
			window.innerWidth > rect.left &&
			rect.left + rect.width > 0 &&
			window.innerHeight > rect.top &&
			rect.top + rect.height > 0
		) {
			rects.push(rect);
		}
	}
})(window, null);

chrome.runtime.sendMessage(null, rects);
