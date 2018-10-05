var pcap = require("pcap");


function isSSDP(lines){
	var ssdp = false;
	for (i in lines){
		if(lines[i].indexOf("M-SEARCH") != -1 || lines[i].indexOf("NOTIFY") != -1 || lines[i].indexOf("BT-SEARCH") != -1) {
			ssdp = true;
			break;
		}
	}
	return ssdp;
}

function parsePacket(packet, time){

    var ipSrc = "";
    var obj = null;
    try{
        ipSrc = packet.payload.payload.saddr;
        ipSrc = ipSrc.o1 + "." + ipSrc.o2+"."+ipSrc.o3+"."+ipSrc.o4;
    }catch(e) {}

    var ipDst = "";
    try{
        ipDst = packet.payload.payload.daddr;
        ipDst = ipDst.o1 + "." + ipDst.o2+"."+ipDst.o3+"."+ipDst.o4;
    }catch(e) {}  


   //if packet is internal to the network, don't process it
   var privateIpSrc = /(^192\.168\.)/.exec(ipSrc);
   var privateIpDst = /(^192\.168\.)/.exec(ipDst);

  if(privateIpSrc && privateIpDst){
	return null;
  }

    var dataHttp = "";
    try{
        dataHttp = packet.payload.payload.payload.data.toString('ascii') || {};
    }   catch(e) {}
    var dataDNS = "";
    try{
        dataDNS = packet.toString('ascii');
    }catch(e) {}
    var dataICMP = "";
    try{
        dataICMP = packet.toString('ascii') || {};
    }catch(e)  {}
    try{
        if(/HTTP/.exec(dataHttp)){
            obj = {};
            obj.time = time;
            obj.type="HTTP";
            obj.ip_src=ipSrc;
            obj.ip_dst = ipDst;
            obj.httpType = /GET |POST |HEAD |OPTIONS |PUT |DELETE /.exec(dataHttp) ? "request" : "reply"
            var lines = dataHttp.trim().split("\r\n");
            if(obj.httpType === "reply"){
                var split = dataHttp.split("\r\n\r\n"); 
                obj.data = split[1];
                var lines = split[0].trim().split("\r\n");
            }

	    if(isSSDP(lines)){
		return null;
	    }

            obj.lines = lines;
            return obj;
        }
    }catch(e) {}
    try{
        if(/question/g.exec(dataDNS)){
            obj = {};
            obj.time = time;
            obj.type="DNS";
            obj.ip_src=ipSrc;
            obj.ip_dst = ipDst;

            obj.dnsType = dataDNS.indexOf("answer") === -1 ? "request" : "reply"
            lines = dataDNS.split("\n");
            obj.question = "";
            for (i in lines){
                if(lines[i].indexOf("question") !== -1){
                    var question = lines[i].split("question:")[1];
                    obj.question = question;
                }else if(lines[i].indexOf("answer") !== -1){
                    var answer = lines[i].split("answer:")[1];
                    obj.answer = answer;
                }
            }
            return obj;
        }
    }catch(e){}
    try{
        if(/ICMP/.exec(dataICMP)){
            obj = {};
            obj.time = time;
            obj.type="ICMP";
            obj.ip_src=ipSrc;
            obj.ip_dst = ipDst;
            obj.icmpType = dataICMP.indexOf("Reply") === -1  ? "request" : "reply"
            return obj;
        }
    }catch(e) {}

    return obj;
}

activeSessions = {}
var startSession = function (device, filter, id, socket){
    console.log("START SESSION device= "+device+" filter="+filter+" id="+id);
    var pcap_session = pcap.createSession(device, filter);
    activeSessions[id] = pcap_session;
    pcap_session.on('packet', function (raw_packet) {
        var time = new Date().getTime();
        var packet = pcap.decode.packet(raw_packet);
        var parsedPckt = parsePacket(packet,time);
        if(parsedPckt!=null ) {
            socket.emit("newpacket", parsedPckt);
        }
    });
}

var stopSession =  function(id){
    console.log("STOP SESSION id="+id);
    var activeS = activeSessions[id];
    if(activeS){
        activeS.close();
    }
}

module.exports = {
    startSession: startSession,
    stopSession: stopSession
};

