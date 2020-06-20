var notFound = document.createElement("p");
notFound.innerText = "Nothing.";

function capture(viewWnd) {
	function download(fileName, url) {
		var aLink = viewWnd.document.createElement('a');
		var evt = viewWnd.document.createEvent('MouseEvents');
		evt.initEvent('click', true, true);
		aLink.download = fileName;
		aLink.href = url;
		aLink.dispatchEvent(evt);
	}

	function downloadBlob(fileName, blob) {
		download(fileName, URL.createObjectURL(blob));
	}

	function callOnLoad(func) {
		viewWnd.addEventListener("load", func);
		if (viewWnd.document.readyState === "complete") {
			func();
		}
	}

	bext.insert(null, { file: "capture.js" }, function () {
		bext.callA(null, "get", function (result) {

			var scrShot, zm;

			function mkImgList() {
				for (var i = 0; i < result.vidShots.length; i++) {
					var bufCav = viewWnd.document.createElement("canvas");

					if (result.vidShots[i].constructor === String) {
						var img = new viewWnd.Image();
						img.onload = function () {
							bufCav.width = this.naturalWidth;
							bufCav.height = this.naturalHeight;
							bufCav.style.height = this.naturalHeight / (this.naturalWidth / 400) + "px";
							bufCav.getContext("2d").drawImage(this, 0, 0);
						};
						img.src = result.vidShots[i];
					} else {
						bufCav.width = result.vidShots[i].width * zm;
						bufCav.height = result.vidShots[i].height * zm;
						bufCav.style.height = result.vidShots[i].height / (result.vidShots[i].width / 400) + "px";
						bufCav.getContext("2d").drawImage(scrShot, -result.vidShots[i].left * zm, -result.vidShots[i].top * zm);
					}

					viewWnd.document.body.appendChild(bufCav);
				}
				viewWnd.onclick = function (mouseEvent) {
					if (mouseEvent.target.tagName === "CANVAS") {
						mouseEvent.target.toBlob(function (blob) {
							downloadBlob("web_video_snapshot_" + (new Date()).getTime() + ".png", blob);
						}, "image/png");
					}
				};
				viewWnd.onunload = function (mouseEvent) {
					bext.callA(null, "rcy");
				};
			}

			if (result.needScrShot) {
				browser.tabs.captureVisibleTab({ format: "png" }, function (dataUrl) {
					scrShot = new Image();
					scrShot.onload = function () {
						browser.tabs.getZoom(function (zoomFactor) {
							zm = zoomFactor;
							callOnLoad(mkImgList);
						});
					};
					scrShot.src = dataUrl;
				});
			} else if (result.vidShots.length) {
				callOnLoad(mkImgList);
			} else {
				viewWnd.document.body.appendChild(notFound);
			}
		});
	});
}
