function _basicKuery(args, isQueryAll) {
	var root, sel
	for (let i = 0; i < args.length; i++) {
		if (sel === undefined && typeof args[i] === 'string') {
			sel = args[i]
			continue
		}
		if (!root) {
			root = args[i]
		}
	}
	if (!sel) {
		return null
	}
	var resultAll
	if (isQueryAll) {
		resultAll = []
	}
	if (!root) {
		root = document
	}
	var nodes = [{ el: root, isRoot: true }]
	while (nodes.length) {
		let node = nodes.shift()
		let el = node.el
		if ('isRoot' in node && node.isRoot) {
			if (!isQueryAll) {
				let r = el.querySelector(sel)
				if (r) {
					return r
				}
			}
			let results = el.querySelectorAll(sel)
			for (let i = 0; i < results.length; i++) {
				resultAll.push(results[i])
			}
		} else if ('shadowRoot' in el && el.shadowRoot) {
			nodes.push({ el: el.shadowRoot, isRoot: true })
		}
		if (!('children' in el)) {
			continue
		}
		for (let i = 0; i < el.children.length; ++i) {
			nodes.push({ el: el.children[i] })
		}
	}
	return resultAll
}

function kuery() {
	return _basicKuery(arguments, false)
}

function kueryAll() {
	return _basicKuery(arguments, true)
}

function unblob(src) {
	if (src.startsWith('blob:')) {
		return src.slice(5, -1)
	}
	return src
}

function getRect(e) {
	const nRect = e.getBoundingClientRect()
	return {
		left: Math.round(nRect.left),
		top: Math.round(nRect.top),
		width: Math.round(nRect.width),
		height: Math.round(nRect.height)
	}
}

function isViewRect(rect) {
	return window.innerWidth > rect.left &&
		rect.left + rect.width > 0 &&
		window.innerHeight > rect.top &&
		rect.top + rect.height > 0
}

function isView(e) {
	return isViewRect(getRect(e))
}

const cfgs = {
	'facebook.com': {
		ppvSel: 'img.img'
	},
	'twitter.com': {
		vidSel: 'video, [data-testid="card.layoutLarge.media"], [data-testid="previewInterstitial"] img, [data-testid="card.layoutSmall.media"] img'
	},
	'bilibili.com': {
		vidSel: 'video, .bili-dyn-card-video img, .suit-video-card img, .bili-dyn-card-live img, bili-dyn-card-pgc img',
		pvUrlCut: '@'
	},
	'dilidili.': {
		vidSel: '.player_main'
	},
	'iqiyi.com': {
		vidSel: 'video'
	},
	'weibo.com': {
		vidSel: 'video',
		ppvSel: '.wbpv-poster',
		uiSel: '.wbpv-control-bar, .wbpv-big-play-button, .wbpv-contextmenu'
	}
}

var cfg

for (var i in cfgs) {
	if (window.location.host.search(i) !== -1) {
		cfg = cfgs[i]
		break
	}
}

if (!cfg) {
	cfg = { vidSel: 'video, object, embed' }
} else {
	if (!('vidSel' in cfg)) {
		cfg.vidSel = 'video, object, embed'
	}
	if ('uiSel' in cfg) {
		if (!('hideUiAttr' in cfg)) {
			cfg.hideUiAttr = 'visibility'
			cfg.hideUiAttrVal = 'hidden'
		}
		if (!('vidFrame' in cfg)) {
			cfg.vidFrame = 1
		}
	} else if ('ppvSel' in cfg) {
		if (!('vidFrame' in cfg)) {
			cfg.vidFrame = 1
		}
	}
}

var uis = []

function restoreUI() {
	for (var i = 0; i < uis.length; i++) {
		uis[i].ele.style[cfg.hideUiAttr] = uis[i].oldStyle
	}
	uis = []
}

var bufCav, bufCavCtx

function captures() {
	var r = { needScrShot: false, vidShots: [] }

	function cpyPos(src) {
		if (src) {
			return { left: src.left, top: src.top }
		} else {
			return null
		}
	}

	let vidEls = kueryAll(document, cfg.vidSel)
	if (vidEls.length > 0) {
		console.log(cfg.vidSel, vidEls)
	}

	for (let i = 0; i < vidEls.length; i++) {
		let vidEl = vidEls[i]

		let vidRect = getRect(vidEl)
		if (!isViewRect(vidRect)) {
			continue
		}

		switch (vidEl.tagName) {
			case 'VIDEO':
				if (vidEl.currentTime === 0) {
					if ('ppvSel' in cfg) {
						let vidFrameEl = vidEl
						for (let j = 0; j < cfg.vidFrame; j++) {
							vidFrameEl = vidFrameEl.parentElement
						}
						let ppvEl = kuery(vidFrameEl, cfg.ppvSel)
						if (ppvEl) {
							if (ppvEl.style.backgroundImage) {
								r.vidShots.push(ppvEl.style.backgroundImage.match(/\s*url\s*\(\"*\'*(.*?)\"*\'*\)\s*/)[1])
								continue
							}
							switch (ppvEl.tagName) {
								case 'IMG':
									let imgUrl = ppvEl.src
									if ('pvUrlCut' in cfg) {
										let pos = imgUrl.lastIndexOf(cfg.pvUrlCut)
										if (pos > 0) {
											imgUrl = imgUrl.substring(0, pos)
										}
									}
									r.vidShots.push(imgUrl)
									continue
								case 'CANVAS':
									r.vidShots.push(ppvEl.toDataURL('image/png'))
									continue
							}
						}
					}
					if (vidEl.poster) {
						r.vidShots.push(vidEl.poster)
						continue
					}
				}

				if (vidEl.src && (new URL(unblob(vidEl.src))).host === location.host) {
					if (!bufCav) {
						bufCav = document.createElement('canvas')
						bufCavCtx = bufCav.getContext('2d')
					}

					bufCav.width = vidEl.videoWidth
					bufCav.height = vidEl.videoHeight
					bufCavCtx.drawImage(vidEl, 0, 0)

					let dataUrl = bufCav.toDataURL('image/png')
					if (dataUrl !== 'data:,') {
						r.vidShots.push(dataUrl)
						continue
					}
				}
				break

			case 'IMG':
				let imgUrl = vidEl.src
				if ('pvUrlCut' in cfg) {
					let pos = imgUrl.lastIndexOf(cfg.pvUrlCut)
					if (pos > 0) {
						imgUrl = imgUrl.substring(0, pos)
					}
				}
				r.vidShots.push(imgUrl)
				continue

			case 'CANVAS':
				r.vidShots.push(vidEl.toDataURL('image/png'))
				continue

			default:
				if (vidEl.style.backgroundImage) {
					r.vidShots.push(vidEl.style.backgroundImage.match(/\s*url\s*\(\"*\'*(.*?)\"*\'*\)\s*/)[1])
					continue
				}
		}

		if (!r.needScrShot) {
			r.needScrShot = true
		}

		if ('uiSel' in cfg) {
			let vidFrameEl = vidEl
			for (let j = 0; j < cfg.vidFrame; j++) {
				vidFrameEl = vidFrameEl.parentElement
			}
			let uiEls = kueryAll(vidFrameEl, cfg.uiSel)
			for (let j = 0; j < uiEls.length; j++) {
				if (uiEls[j].style[cfg.hideUiAttr] !== cfg.hideUiAttrVal) {
					let ui = { ele: uiEls[j], oldStyle: uiEls[j].style[cfg.hideUiAttr] }
					uiEls[j].style[cfg.hideUiAttr] = cfg.hideUiAttrVal
					uis.push(ui)
				}
			}
		}

		r.vidShots.push(vidRect)
	}

	if (uis.length) {
		setTimeout(() => bext.callBackend('handleShots', [r]), 555)
	} else {
		bext.callBackend('handleShots', [r])
	}
}
