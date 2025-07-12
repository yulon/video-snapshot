function download(fileName, url) {
	var evt = document.createEvent('MouseEvents')
	evt.initEvent('click', true, true)

	var aLink = document.createElement('A')
	aLink.download = fileName
	aLink.href = url
	aLink.dispatchEvent(evt)
}

function downloadBlob(fileName, blob) {
	download(fileName, URL.createObjectURL(blob))
}

function callOnLoad(func) {
	addEventListener('load', func)
	if (document.readyState === 'complete') {
		func()
	}
}

window.onclick = (mouseEvent) => {
	switch (mouseEvent.target.tagName) {
		case 'CANVAS':
			mouseEvent.target.toBlob((blob) => {
				downloadBlob('web_video_snapshot_' + (new Date()).getTime() + '.png', blob)
			}, 'image/png')
			return

		case 'IMG':
			window.open(mouseEvent.target.src)
			return
	}
}

const bext = new Bext(true)

var notFoundEl = null

function notFound() {
	if (notFoundEl) {
		notFoundEl.style.display = null
		return
	}
	notFoundEl = document.createElement('p')
	notFoundEl.innerText = 'Not Found Videos'
	document.body.appendChild(notFoundEl)
}

function found() {
	if (notFoundEl) {
		notFoundEl.style.display = 'none'
	}
}

function pushImgs(r, scrShot, zm) {
	found()
	for (var i = 0; i < r.vidShots.length; i++) {
		if (r.vidShots[i].constructor === String) {
			const imgUrl = r.vidShots[i]

			let img = new Image()
			img.setAttribute('crossOrigin', 'anonymous')

			if (!imgUrl.startsWith('data:')) {
				img.onload = function () {
					img.width = this.naturalWidth
					img.height = this.naturalHeight
					img.style.height = this.naturalHeight / (this.naturalWidth / 400) + 'px'
				}
				img.src = imgUrl
				document.body.appendChild(img)
				continue
			}

			let cav = document.createElement('canvas')
			document.body.appendChild(cav)

			img.onload = function () {
				cav.width = this.naturalWidth
				cav.height = this.naturalHeight
				cav.style.height = this.naturalHeight / (this.naturalWidth / 400) + 'px'
				cav.getContext('2d').drawImage(this, 0, 0)
			}
			img.src = imgUrl
			continue
		}

		let cav = document.createElement('canvas')
		const rect = r.vidShots[i]
		cav.width = rect.width * zm
		cav.height = rect.height * zm
		cav.style.height = rect.height / (rect.width / 400) + 'px'
		cav.getContext('2d').drawImage(scrShot, -rect.left * zm, -rect.top * zm)
		document.body.appendChild(cav)
	}
}

function handleShots(r) {
	if (r.needScrShot) {
		browser.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
			var scrShot = new Image()
			scrShot.onload = () => {
				browser.tabs.getZoom(function (zm) {
					callOnLoad(() => pushImgs(r, scrShot, zm * window.devicePixelRatio))
				})
			}
			scrShot.src = dataUrl

			bext.callTab(null, 'restoreUI')
		})
		return
	}

	if (r.vidShots.length) {
		callOnLoad(() => pushImgs(r))
		return
	}

	notFound()
}

bext.insertTab(null, 'capturer.js', true, true).then(() => bext.callTab(null, 'captures')).catch(notFound)
