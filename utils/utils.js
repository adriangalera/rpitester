/*
Depends on the following files:
- /etc/dnsmasq.hosts: file to define the DNS masq
- /tmp/buffering: buffering script status
- /tmp/blockedips: blocked ips file
*/
var http = require('http'), fs = require('fs') , exec = require('child_process').exec;

GLOBAL.dnsfile = '/etc/dnsmasq.hosts';
GLOBAL.bufferfile = '/tmp/buffering';
GLOBAL.blockipfile='/tmp/blockedips';
GLOBAL.vpninfofile='/tmp/vpninfo';
GLOBAL.restoreIpTablesFile='/etc/iptables.ipv4.nat';
GLOBAL.vpnPath="/opt/vpns";
GLOBAL.buffering="/home/pi/buffering.sh";


function getIp(socket){  
  setTimeout(function(){
    var updatenow = false;
    if(GLOBAL.ip===undefined){
      updatenow = true;
    }else{
      if(GLOBAL.ip.update==true){
        updatenow = true;
      }else{
        //update if last update was an hour ago!
        now = new Date().getTime();
        if(now - GLOBAL.ip.lastupdate > 1000 * 60 * 60){
          updatenow = true;
        }
      }
    }

    if(updatenow){
      getIpInfoNetwork(function(ipinfo){
        GLOBAL.ip = {
          update : false,
          ipinfo: ipinfo,
          lastupdate: new Date().getTime()
        }
        //emit GLOBAL.ip.ipinfo
        socket.emit('ip', GLOBAL.ip.ipinfo);
      });
    }else{
      //emit GLOBAL.ip.ipinfo
      //console.log("CACHE IPINFO ")
      socket.emit('ip', GLOBAL.ip.ipinfo);
    }
    getIp(socket);
  }, 1000);
}

function getIpInfoNetwork(cb){
  var options = {
    host : "ipinfo.io",
    path: "/json"
  }
  c = function(response) {
    //console.log(response);
    var str = '';

    //another chunk of data has been recieved, so append it to `str`
    response.on('data', function (chunk) {
      str += chunk;
    });

    //the whole response has been recieved, so we just print it out here
    response.on('end', function () {
      console.log(str);
      cb(str);
    });
  }

  http.request(options, c).end();
}


function getDNSMasqInfo(cb){
  var dnsarr = []
  readFile(GLOBAL.dnsfile, function(err, dnsinfo){
    if(err) console.log(err);
    dnsmasqhostsarr = dnsinfo.split("\n");
    var i;
    for(i=0; i < dnsmasqhostsarr.length; i++){
      if(dnsmasqhostsarr[i]!=''){
        dnsmasqhostsarr[i] = dnsmasqhostsarr[i].trim();
        iphostarr = dnsmasqhostsarr[i].split("\t");
        dnsentry = {
          ip: iphostarr[0],
          host: iphostarr[1]
        }
        dnsarr.push(dnsentry);
      }
    }
    cb(dnsarr);
  });
}

function setDNSMasqInfo(iphosts){
  content = "";
  iphosts.forEach(function(iphost){
    content += iphost.ip+"\t"+iphost.host+"\n";
  });
  if(content.length > 0)
    content = content.slice(0, - 1)
  fs.writeFileSync(GLOBAL.dnsfile, content, "UTF-8",{'flags': 'w+'});
  exec('service dnsmasq restart',function(err,stdo,stde){
  })
}

function getBufferingInfo(cb){
  var buffering = {}
  readFile(GLOBAL.bufferfile, function(err, bufferInfo){
    if(err)  {}
      if(bufferInfo!=null){
        lines = bufferInfo.split("\n");
        if(lines[0]=='true'){
          buffering.enabled = true;
          buffering.type = lines[1];
        }else{
          buffering.enabled = false;
          buffering.type = ''
        }
      }else{
        buffering = {
          enabled : false,
          type: ''
        }
      }
      cb(buffering);
    });
}

function getBlockedIpInfo(cb){
  var bips = []
  readFile(GLOBAL.blockipfile, function(err, ips){
    if(err)  {}
      if(ips!=null){
        iparr = ips.split("\n");
        iparr.forEach(function(ip){
          if(ip!=""){
            bips.push(ip);
          }
        })
      }
      cb(bips);
    });
}

function setBlockedIp(blockipcsv){
  blockiparr = blockipcsv.split(",");
  content = "";
  blockiparr.forEach(function(b){
    content += b+"\n";
  });
  if(content!="")
    content = content.slice(0,-1);
  fs.writeFileSync(GLOBAL.blockipfile, content, "UTF-8",{'flags': 'w+'});
  exec("iptables-restore < "+GLOBAL.restoreIpTablesFile,function(err,stdo,stde){
    line = "iptables -I FORWARD -s 192.168.150.0/24 -d "+blockipcsv+"  -j DROP";
    if(blockipcsv!="")
      exec(line, function(err,stdo,stde){
      });
  })
}

function setBuffer(enable,type){
  var content = "";
  exec(GLOBAL.buffering+" stop", function(error,stdo,stde){
   console.log(stdo);
   console.log(stde);
 });
  if(enable=="true"){
    content = enable+"\n"+type;
    exec(GLOBAL.buffering+" start "+type, function(error,stdo,stde){
      console.log(stdo);
      console.log(stde);

    });
  }else{
    content = enable;
  }

  fs.writeFileSync(GLOBAL.bufferfile, content, "UTF-8",{'flags': 'w+'});
}

function getVpns(callback){
  exec('ls '+GLOBAL.vpnPath+" |grep .ovpn", function(err,stdo,stde){
    v = stdo.split("\n");
    vpns = []
    v.forEach(function(vpn){
      if(vpn!=""){
        vpns.push(vpn);
      }
    })

    //callback(vpns);

    //READ vpninfo file
    readFile(GLOBAL.vpninfofile, function(err, v){
      var vpninfo = {
        enabled : false,
        list_available: vpns,
        connected: ''
      }
      if(err)  {}
        if(v!=null){
          lines = v.split("\n");
          if(lines[0]!=''){
            if(lines[0]=="true"){
              vpninfo.enabled = lines[0];
              vpninfo.connected = lines[1];
            }
          }
        }
        callback(vpninfo);
      });
  })
}

function setVpn(enabled,vpn){
  //store current value in fs:
  content = "";
  if(enabled=="true"){
    content = "true"+"\n"+vpn;
  }
  fs.writeFileSync(GLOBAL.vpninfofile, content, "UTF-8",{'flags': 'w+'});
  //Kill any existing openvpn thread
  exec('killall -9 openvpn',function(err,stdo,stde){
    if(enabled=="true"){
      line = 'cd /opt/vpns/ && openvpn "'+vpn+'" >>log.txt 2>&1 &';
      exec(line, function(err,stdo1,stde1){
      });
    }
  });
}


function readFile(filename,cb){
  fs.readFile(filename, 'utf8', function (err,data) {
    if (err) {
      cb(err,null);
      return;
    }
    cb(null,data);
    return;
  });
}
var macAddressRegex = /^..:..:..:..:..:../
function getConnectedClients(cb){
  var connectedArp = {};
  var connectedApd = new Array();
  exec("arp -i wlan0 -a | awk '{print $1 \"\t\" $2 \"\t\" $4}'", function(err,stdo,stde){
    var lines = stdo.split("\n");
    for(var i in lines){
     var entry = lines[i].split("\t");
     if(entry.length==3 && macAddressRegex.exec(entry[2])!=null){
      var name = entry[0];
      var ip = entry[1].substring(1,entry[1].length-1);
      var mac = entry[2];
      var cli = {
        "name" : name,
        "ip": ip,
        "mac": mac
      }
      connectedArp[mac] = cli;
    }
  }
  con = new Array();
  for (var i in connectedArp){
    con.push(connectedArp[i]);
  }
  cb(con);  
})
}

module.exports = {
  getIp: getIp,
  getDns: getDNSMasqInfo,
  setDns: setDNSMasqInfo,
  getBlocked: getBlockedIpInfo,
  setBlocked: setBlockedIp,
  getBuffer: getBufferingInfo,
  setBuffer: setBuffer,
  getVPNs: getVpns,
  setVPN: setVpn,
  getConnectedClients: getConnectedClients
};

