/* global Module */

/* Magic Mirror
 * Module: MMM-remoteQR
 *
 * By IwanZh http://github.com/IwanZh/MMM-remoteQR
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const os = require("os");
const url = require("url");
const fs = require("fs");
const qr = require("qr-image");

module.exports = NodeHelper.create({

	start: function() {
		this.expressApp.get("/remoteQR", (req, res) => {

			var query = url.parse(req.url, true).query;
			var message = query.message;
			var type = query.type;
			var silent = query.silent || false;

			if (message == null && type == null){
				res.send({"status": "failed", "error": "No message and type given."});
			}
			else if (message == null){
				res.send({"status": "failed", "error": "No message given."});
			}
			else if (type == null) {
				res.send({"status": "failed", "error": "No type given."});
			}
			else {
				var log = {"type": type, "message": message, "silent": silent, "timestamp": new Date()};
				res.send({"status": "success", "payload": log});
				this.checkIpAddress();
			}
		});
	},

	socketNotificationReceived: function(notification, payload) {
		if(notification === "CONNECT"){
			this.logFile = payload.logFile;
			this.imageFile = payload.imageFile;
			this.checkIpAddress();
		}
	},

	saveIpAddress: function(IPAddress){
		fs.writeFileSync(this.logFile, JSON.stringify({"IPAddress": IPAddress}), "utf8");
	},

	loadIpAddress: function(){
		if(this.fileExists(this.logFile)){
			var logs = JSON.parse(fs.readFileSync(this.logFile, "utf8"));
		}
		else {
			var logs = "";
		}

		var logIPAddress = logs.IPAddress;

		return logIPAddress
	},

	fileExists: function(path){
		try {
			return fs.statSync(path).isFile();
		} catch(e) {
			console.log("File not found ... "+path);
			return false;
		}
	},

	getIpAddresses: function() {
		var interfaces = os.networkInterfaces();
		var addresses = [];
		for (var k in interfaces) {
			for (var k2 in interfaces[k]) {
				var address = interfaces[k][k2];
				if (address.family === "IPv4" && !address.internal) {
					addresses.push(address.address);
				}
			}
		}
		return addresses;
	},

	getIpAddress: function () {
		var IPAddresses = this.getIpAddresses();
		for (var i in IPAddresses){
			var IPAddress = IPAddresses[i];
		}
		return IPAddress
	},

	checkIpAddress: function () {
		var newIPAddress = this.getIpAddress();
		var logIPAddress = this.loadIpAddress();
		var currentIPAddress = "";
		if(logIPAddress != newIPAddress){
			console.log ("IP Address changed ... !")
			this.saveIpAddress(newIPAddress);
			currentIPAddress = newIPAddress;
			// generate new QR Image
			this.changed = true;
		}
		else {
			console.log ("IP Address did not change ... !")
			currentIPAddress = logIPAddress;
		}
		var newurl = "http://"+ currentIPAddress +":8080/remote.html";

		if(!this.fileExists(this.imageFile) || this.changed){
			this.generateQR(newurl);
		}

		console.log ("Current remote address is ... "+ newurl)
		this.sendSocketNotification("NEW_MESSAGE",{"IPAddress": newurl});
	},

	generateQR: function (qrInput) {
		var qrpng = qr.image(qrInput, { type: "png" });
		var pipeImage = fs.createWriteStream(this.imageFile);
		qrpng.pipe(pipeImage);
		pipeImage.on("close", function () {
			console.log ("File is created ... ");
		});
	}
});