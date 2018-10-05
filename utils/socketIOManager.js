var utils = require("./utils");
var networkSniffer = require("./network_grep");

var manageSocketIO = function(io){

	console.log("ManagerSocketIO start!");

	io.on('connection', function(socket){
		console.log("New connection!");
		//Start getting ip, setting the interval in the function
		utils.getIp(socket);
		//This will start a sniffer
		socket.on("startsniffer", function(data) {
			networkSniffer.startSession(data.device, data.filter, data.id, socket);
		})
		//This will end a sniffer
		socket.on("stopsniffer" , function(data) {
			networkSniffer.stopSession(data.id);
		})
	});
}


module.exports = {
	manageSocketIO: manageSocketIO
};