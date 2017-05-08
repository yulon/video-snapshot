var notFound = document.createElement("p");
notFound.innerText = "The video elements was not found in the visible area.";

function capture(popup) {
	crxCS.insert(null, { file: "rects.js" }, function() {
		crxCS.callA(null, "get", function(rects) {
			if (rects.length) {
				chrome.tabs.captureVisibleTab({ format: "png" }, function(dataUrl) {
					var img = new Image();
					img.src = dataUrl;

					chrome.tabs.getZoom(function(zoomFactor) {
						popup.onload = function() {
							function vc(rect) {
								var cav = popup.document.createElement("canvas");
								cav.setAttribute("width", rect.width * zoomFactor);
								cav.setAttribute("height", rect.height * zoomFactor);
								cav.style.height = rect.height / (rect.width / 400) + "px";
								cav.getContext("2d").drawImage(img, -rect.left * zoomFactor, -rect.top * zoomFactor);
								popup.document.body.appendChild(cav);
							}
							for (var i = 0; i < rects.length; i++) {
								vc(rects[i]);
							}
							popup.onclick = function(mouseEvent) {
								if (mouseEvent.target.tagName === "CANVAS") {
									chrome.downloads.download({ url: mouseEvent.target.toDataURL('image/png'), saveAs: true, filename: "chrome_video_capture_" + (new Date()).getTime() + ".png" });
								}
							};
							popup.onunload = function(mouseEvent) {
								crxCS.call(null, "rcy");
							};
						}
						if (popup.document.readyState === "complete") {
							popup.onload();
						}
					});
				});
			} else {
				popup.document.body.appendChild(notFound);
			}
		});
	});
}
