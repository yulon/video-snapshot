var notFound = document.createElement("p");
notFound.innerText = "The video elements was not found in the visible area.";

function capture(popup) {
	function callOnLoad(func) {
		popup.addEventListener("load", func);
		if (popup.document.readyState === "complete") {
			func();
		}
	}

	crxCS.insert(null, { file: "capture.js" }, function() {
		crxCS.callA(null, "get", function(result) {

			var scrShot, zm;

			function mkImgList() {
				for (var i = 0; i < result.vidShots.length; i++) {
					var bufCav = popup.document.createElement("canvas");

					if (result.vidShots[i].constructor === String) {
						var img = new popup.Image();
						img.onload = function() {
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

					popup.document.body.appendChild(bufCav);
				}
				popup.onclick = function(mouseEvent) {
					if (mouseEvent.target.tagName === "CANVAS") {
						mouseEvent.target.toBlob(function(blob) {
							downloadBlob("chrome_video_capture_" + (new Date()).getTime() + ".png", blob);
						}, "image/png");
					}
				};
				popup.onunload = function(mouseEvent) {
					crxCS.callA(null, "rcy");
				};
			}

			if (result.needScrShot) {
				chrome.tabs.captureVisibleTab({ format: "png" }, function(dataUrl) {
					scrShot = new Image();
					scrShot.onload = function() {
						chrome.tabs.getZoom(function(zoomFactor) {
							zm = zoomFactor;
							callOnLoad(mkImgList);
						});
					};
					scrShot.src = dataUrl;
				});
			} else if (result.vidShots.length) {
				callOnLoad(mkImgList);
			} else {
				popup.document.body.appendChild(notFound);
			}
		});
	});
}

function downloadBlob(fileName, blob) {
	var aLink = document.createElement('a');
	var evt = document.createEvent('MouseEvents');
	evt.initEvent('click', true, true);
	aLink.download = fileName;
	aLink.href = URL.createObjectURL(blob);
	aLink.dispatchEvent(evt);
}
