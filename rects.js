var confs = {
	"youtube.com": {
		barSel: '.ytp-player-content.ytp-iv-player-content, .ytp-chrome-bottom, .ytp-button.ytp-cards-button, ytp-cards-teaser, #iv-drawer',
		parent: 2
	},
	"twitter.com": {
		barSel: '.all-controls.player-controls.bg-play-pause.visible-controls, .poster-image-container, .duration-badge.duration-badge-without-view-counts',
		parent: 3,
		stAttr: "display",
		stVal: "none"
	},
	"dilidili.": {
		videoSel: ".player_main"
	},
	"bilibili.com": {
		barSel: '.bilibili-player-video-state',
		parent: 2
	},
	"iqiyi.com": {
		videoSel: 'video',
		barSel: '[data-cupid="container"]'
	},
	"weibo.com": {
		barSel: '.con-3, .con-4.hv-pos.hv-center',
		parent: 3
	}
}

var conf;

for (var i in confs) {
	if (window.location.host.search(i) !== -1) {
		conf = confs[i];
		break;
	}
}

if (!conf) {
	conf = { videoSel: 'video, object, embed' };
} else {
	if (!("videoSel" in conf)) {
		conf.videoSel = 'video, object, embed';
	}
	if ("barSel" in conf) {
		if (!("stAttr" in conf)) {
			conf.stAttr = "visibility";
			conf.stVal = "hidden";
		}
		if (!("parent" in conf)) {
			conf.parent = 1;
		}
	}
}

var rects = new Array();
var bars = new Array();

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
			var fPos = cpyPos(basePos);

			if (wnd.frames[i].frameElement) {
				var fRect = wnd.frames[i].frameElement.getBoundingClientRect();
				if (!fPos) {
					fPos = { left: 0, top: 0 };
				}
				fPos.left += fRect.left + wnd.frames[i].frameElement.clientLeft;
				fPos.top += fRect.top + wnd.frames[i].frameElement.clientTop;
			}

			arguments.callee(wnd.frames[i], fPos, conf.videoSel);
		}
	} catch (e) {
		console.error("[Video Capture]", e);
	}

	////////////////////////////////////////////////////////////////////////////

	var videoEles = wnd.document.querySelectorAll(conf.videoSel);

	for (var i = 0; i < videoEles.length; i++) {
		var nRect = videoEles[i].getBoundingClientRect();
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

			if ("barSel" in conf) {
				var parentEles = videoEles[i];
				for (var j = 0; j < conf.parent; j++) {
					parentEles = parentEles.parentElement;
				}

				var barEles = parentEles.querySelectorAll(conf.barSel);
				for (var j = 0; j < barEles.length; j++) {
					if (barEles[j].style[conf.stAttr] !== conf.stVal) {
						var bar = { ele: barEles[j], oldStyle: barEles[j].style[conf.stAttr] };
						barEles[j].style[conf.stAttr] = conf.stVal;
						bars.push(bar);
					}
				}
			}
		}
	}
})(window, null);

chrome.runtime.sendMessage(null, rects, null, function() {
	for (var i = 0; i < bars.length; i++) {
		bars[i].ele.style[conf.stAttr] = bars[i].oldStyle;
	}
});
