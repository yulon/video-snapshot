chrome.tabs.captureVisibleTab({ format: "png" }, function(dataUrl) {
	var img = new Image();
	img.src = dataUrl;

	chrome.runtime.onMessage.addListener(function(rects) {
		function mk() {
			function vc(rect) {
				var cav = document.createElement("canvas");
				cav.setAttribute("width", rect.width);
				cav.setAttribute("height", rect.height);
				cav.style.width = "400px";
				cav.style.height = rect.height / (rect.width / 400) + "px";
				cav.getContext("2d").drawImage(img, -rect.left, -rect.top);
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
	});

	chrome.tabs.executeScript({ file: "rects.js", allFrames: true });
})
