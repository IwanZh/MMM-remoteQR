/* Magic Mirror
 * Module: MMM-remoteQR
 *
 * By IwanZh http://github.com/IwanZh/MMM-remoteQR
 * MIT Licensed.
 */

Module.register("MMM-remoteQR",{

	defaults: {
		shortenMessage: false,
		alert: true,
		imageFile: "remoteQR.png",
		logfile: "logs.json"
	},

	getStyles: function () {
		return ["MMM-RemoteQR.css"];
	},

	getScripts: function() {
		return ["moment.js"];
	},

	start: function() {
		this.sendSocketNotification("CONNECT", {logFile: this.file(this.config.logfile),imageFile: this.file(this.config.imageFile) });
		Log.info("Starting module: " + this.name);
		moment.locale(config.language);
		if(!this.loaded){
			setInterval(() => {
				this.updateDom();
				this.loaded = true;
			}, 1000);
		}
	},

	socketNotificationReceived: function(notification, payload) {
		if(notification === "NEW_MESSAGE"){
			this.updateDom(1000);
		}
	 },

	 getDom: function () {
		var wrapper = document.createElement("div");

		var imageQR = document.createElement("img");
		imageQR.className = "imagewrapper";
		imageQR.src = this.file(this.config.imageFile);
		imageQR.width = 100;
		imageQR.height = 100;

		wrapper.appendChild(imageQR);

		return wrapper;
	}

});
