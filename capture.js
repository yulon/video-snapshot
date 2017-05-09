var confs = {
	"twitter.com": {
		ptrSel: '.poster-image',
		vidFrame: 3
	},
	"dilidili.": {
		vidSel: ".player_main"
	},
	"iqiyi.com": {
		vidSel: 'video'
	},
	"weibo.com": {
		ptrSel: '.con-1.hv-pos > img',
		uiSel: '.con-3, .con-4.hv-pos.hv-center',
		vidFrame: 3
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
	conf = { vidSel: 'video, object, embed' };
} else {
	if (!("vidSel" in conf)) {
		conf.vidSel = 'video, object, embed';
	}
	if ("uiSel" in conf) {
		if (!("stAttr" in conf)) {
			conf.stAttr = "visibility";
			conf.stVal = "hidden";
		}
		if (!("vidFrame" in conf)) {
			conf.vidFrame = 1;
		}
	} else if ("ptrSel" in conf) {
		if (!("vidFrame" in conf)) {
			conf.vidFrame = 1;
		}
	}
}

var uis = { length: 0 };

function rcy() {
	for (var i = 0; i < uis.length; i++) {
		uis[i].ele.style[conf.stAttr] = uis[i].oldStyle;
	}
};

function get(cb) {
	var result = { needScrShot: false, vidShots: new Array() }
	uis = new Array();

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

				arguments.callee(wnd.frames[i], fPos, conf.vidSel);
			}
		} catch (e) {
			console.error("[Video Capture] (traversing iframes)", e);
		}

		////////////////////////////////////////////////////////////////////////////

		var vidElmts = wnd.document.querySelectorAll(conf.vidSel);

		var bufCav, bufCavCtx, bufVid;

		for (var i = 0; i < vidElmts.length; i++) {
			var nRect = vidElmts[i].getBoundingClientRect();
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
				if (vidElmts[i].tagName === "VIDEO") {
					try {
						var imgUrl;

						if (!bufCav) {
							bufCav = wnd.document.createElement("canvas");
							bufCavCtx = bufCav.getContext("2d");
						}
						vidElmts[i].crossOrigin = "anonymous";
						bufCav.width = vidElmts[i].videoWidth;
						bufCav.height = vidElmts[i].videoHeight;
						bufCavCtx.drawImage(vidElmts[i], 0, 0);
						imgUrl = bufCav.toDataURL('image/png');

						if (imgUrl === "data:,") {
							if ("ptrSel" in conf) {
								var vidFrameElmts = vidElmts[i];
								for (var j = 0; j < conf.vidFrame; j++) {
									vidFrameElmts = vidFrameElmts.parentElement;
								}

								ptrElmt = vidFrameElmts.querySelector(conf.ptrSel);
								switch (ptrElmt.tagName) {
									case "IMG":
										imgUrl = ptrElmt.src;
										break;
									case "CANVAS":
										imgUrl = ptrElmt.toDataURL('image/png');
										break;
									default:
										imgUrl = ptrElmt.style.backgroundImage.match(/\s*url\s*\(\"*\'*(.*?)\"*\'*\)\s*/)[1];
								}
								if (imgUrl !== "data:,") {
									result.vidShots.push(imgUrl);
								}
							} else if (vidElmts[i].poster) {
								result.vidShots.push(vidElmts[i].poster);
							}
						} else {
							result.vidShots.push(imgUrl);
						}
						continue;
					} catch (e) {
						console.error("[Video Capture] (capturing video element)", e);

						if ("uiSel" in conf) {
							var vidFrameElmts = vidElmts[i];
							for (var j = 0; j < conf.vidFrame; j++) {
								vidFrameElmts = vidFrameElmts.parentElement;
							}

							var uiElmts = vidFrameElmts.querySelectorAll(conf.uiSel);
							for (var j = 0; j < uiElmts.length; j++) {
								if (uiElmts[j].style[conf.stAttr] !== conf.stVal) {
									var ui = { ele: uiElmts[j], oldStyle: uiElmts[j].style[conf.stAttr] };
									uiElmts[j].style[conf.stAttr] = conf.stVal;
									uis.push(ui);
								}
							}
						}
					}
				}

				result.vidShots.push(rect);
				if (!result.needScrShot) {
					result.needScrShot = true;
				}
			}
		}
	})(window, null);

	if (uis.length) {
		requestAnimationFrame(function() {
			cb(result);
		});
	} else {
		cb(result);
	}
}
