chrome.tabs.captureVisibleTab({ format: "png" }, function(dataUrl) {
	var img = new Image();
	img.src = dataUrl;

	chrome.runtime.onMessage.addListener(function(rects) {
		function mk() {
			function cav(w, h) {
				var cav = document.createElement("canvas");
				cav.setAttribute("width", w);
				cav.setAttribute("height", h);
				cav.style.width = "400px";
				cav.style.height = h / (w / 400) + "px";
				document.body.appendChild(cav);
				return cav.getContext("2d");
			}
			for (var i = 0; i < rects.length; i++) {
				cav(rects[i].width, rects[i].height).drawImage(img, -rects[i].left, -rects[i].top);
			}
			window.onclick = function(mouseEvent){
				if (mouseEvent.target.tagName === "CANVAS") {
					window.open(mouseEvent.target.toDataURL('image/png'));
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
