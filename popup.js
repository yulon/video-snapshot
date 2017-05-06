chrome.runtime.onMessage.addListener(function(rects, sder, resp) {
	if (rects.length) {
		chrome.tabs.captureVisibleTab({ format: "png" }, function(dataUrl) {
			resp();

			var img = new Image();
			img.src = dataUrl;

			chrome.tabs.getZoom(function(zoomFactor) {
				function mk() {
					function vc(rect) {
						var cav = document.createElement("canvas");
						cav.setAttribute("width", rect.width * zoomFactor);
						cav.setAttribute("height", rect.height * zoomFactor);
						cav.style.width = "400px";
						cav.style.height = rect.height / (rect.width / 400) + "px";
						cav.getContext("2d").drawImage(img, -rect.left * zoomFactor, -rect.top * zoomFactor);
						document.body.appendChild(cav);
					}
					for (var i = 0; i < rects.length; i++) {
						vc(rects[i]);
					}
					window.onclick = function(mouseEvent) {
						if (mouseEvent.target.tagName === "CANVAS") {
							chrome.downloads.download({ url: mouseEvent.target.toDataURL('image/png'), saveAs: true, filename: "chrome_video_capture_" + (new Date()).getTime() + ".png" });
						}
					};
				}
				if (document.readyState === "complete") {
					mk();
				} else {
					window.addEventListener("load", mk, false);
				}
			})
		})
		return true;
	}
});

chrome.tabs.executeScript({ file: "rects.js" });
