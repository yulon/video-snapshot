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

			var scrShot, zm, bufCav, bufCavCtx;

			function mkImgList() {
				for (var i = 0; i < result.vidShots.length; i++) {
					var img = new popup.Image();
					img.onload = function() {
						this.style.height = this.naturalHeight / (this.naturalWidth / 400) + "px";
					};

					if (result.vidShots[i].constructor === String) {
						img.src = result.vidShots[i];
					} else {
						bufCav.width = result.vidShots[i].width * zm;
						bufCav.height = result.vidShots[i].height * zm;
						bufCavCtx.drawImage(scrShot, -result.vidShots[i].left * zm, -result.vidShots[i].top * zm);
						img.src = bufCav.toDataURL('image/png');
					}

					popup.document.body.appendChild(img);
				}
				popup.onclick = function(mouseEvent) {
					if (mouseEvent.target.tagName === "IMG") {
						chrome.downloads.download({ url: mouseEvent.target.src, saveAs: true, filename: "chrome_video_capture_" + (new Date()).getTime() + ".png" });
					}
				};
				popup.onunload = function(mouseEvent) {
					crxCS.callA(null, "rcy");
				};
			}

			if (result.needScrShot) {
				bufCav = popup.document.createElement("canvas");
				bufCavCtx = bufCav.getContext("2d");

				chrome.tabs.captureVisibleTab({ format: "png" }, function(dataUrl) {
					scrShot = new Image();
					scrShot.onload = function() {
						chrome.tabs.getZoom(function(zoomFactor) {
							zm = zoomFactor;
							callOnLoad(function() {
								mkImgList(zoomFactor);
							});
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
