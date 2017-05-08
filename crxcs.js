var crxCS = new (function CrxCS() {
	this.insert = function(tab, details, cb) {
		var script;
		if ("file" in details && "code" in details) {
			return;
		} else if ("file" in details) {
			script = details.file;
		} else if ("code" in details) {
			script = "{" + details.code + "}";
		} else {
			return;
		}

		chrome.runtime.onMessage.addListener(function(msg, sender, resp) {
			switch (msg.type) {
				case "CrxCS.Inserted":
					if (msg.script === script) {
						chrome.runtime.onMessage.removeListener(arguments.callee);
						resp();
						if (cb != null) {
							cb();
						}
						return true;
					}
				case "CrxCS.NotInserted":
					if (msg.script === script) {
						chrome.runtime.onMessage.removeListener(arguments.callee);
						chrome.tabs.executeScript(tab, details, function() {
							resp();
							if (cb != null) {
								cb();
							}
						});
						return true;
					}
			}
		});

		chrome.tabs.executeScript(tab, {
			code: `
				if (!("crxCS" in window)) {
					window.crxCS = {};
					chrome.runtime.onMessage.addListener(function(msg, sender, resp) {
						switch (msg.type) {
							case "CrxCS.Call":
								resp(window[msg.funcName]());
								return;
							case "CrxCS.CallA":
								window[msg.funcName](resp);
								return true;
						}
					});
				}
				if (!("InsertedScript" in crxCS)) {
					crxCS.InsertedScript = {};
				}

				if ("` + script + `" in crxCS.InsertedScript) {
					chrome.runtime.sendMessage(null, { type: "CrxCS.Inserted", script: \`` + script + `\`});
				} else {
					chrome.runtime.sendMessage(null, { type: "CrxCS.NotInserted", script: \`` + script + `\`}, null, function() {
						crxCS.InsertedScript["` + script + `"] = true;
					});
				}
			`
		});
	};

	function call(type, tab, funcName, resultCb) {
		chrome.tabs.query({ active: true }, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, { type: type, funcName: funcName}, resultCb);
		});
	};

	this.call = function(tab, funcName, resultCb) {
		call("CrxCS.Call", tab, funcName, resultCb);
	};

	this.callA = function(tab, funcName, resultCb) {
		call("CrxCS.CallA", tab, funcName, resultCb);
	};
})();
