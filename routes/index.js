var express = require('express');
var router = express.Router();
var utils = require('../utils/utils');
var http = require("http");


/* GET home page. */
router.get('/', function(req, res, next) {
  var data = {};
  res.render('index', data);
});

router.get("/ip", function(req,res,next){
  var updatenow = false;
  if(GLOBAL.ip===undefined){
    updatenow = true;
  }else{
    if(GLOBAL.ip.update==true){
      updatenow = true;
    }else{
      //update if last update was an hour ago!
      now = new Date().getTime();
      if(now - GLOBAL.ip.lastupdate > 60000){
        updatenow = true;
      }
    }
  }

  if(updatenow){
    console.log("\twill fetch ip data");
    utils.getIp(function(ipinfo){
      //console.log("DATA FROM WEB SERVICE!");
      res.setHeader('Content-Type', 'application/json');
      res.end(ipinfo);
      now = new Date().getTime();
      GLOBAL.ip = {
        update : false,
        ipinfo: ipinfo,
        lastupdate: now
      }
    });
  }else{
    //console.log("CACHED DATA!");
    res.setHeader('Content-Type', 'application/json');
    res.end(GLOBAL.ip.ipinfo);
  }
});

router.get("/dnsmasq", function(req,res,next){
  utils.getDns(function(dns){
    res.header('Content-Type', 'application/json');
    res.write(JSON.stringify(dns));
    res.end();
  });
});

router.post("/dnsmasq",function(req,res,next){
  json = req.body.iphosts
  iphosts = JSON.parse(json);
  utils.setDns(iphosts);
  res.end();
});

router.get("/blockedip", function(req,res,next){
  utils.getBlocked(function(blocked){
    res.header('Content-Type', 'application/json');
    res.write(JSON.stringify(blocked));
    res.end();
  });
});

router.post("/blockedip",function(req,res,next){
  csvip = req.body.ipcsv;
  utils.setBlocked(csvip)
  res.end();
})

router.get("/buffer", function(req,res,next){
  utils.getBuffer(function(buffer){
    res.header('Content-Type', 'application/json');
    res.write(JSON.stringify(buffer));
    res.end();
  });
});

router.post("/buffer", function(req,res,next){
  utils.setBuffer(req.body.enable,req.body.type);
  res.end();
});

router.get("/vpns", function(req,res,next){
  utils.getVPNs(function(vpns){
    res.header('Content-Type', 'application/json');
    res.write(JSON.stringify(vpns));
    res.end();
  });
});

router.post("/vpn",  function(req,res,next){
  //force ip info update after some sensible time (i.e 30 seconds)
  var timeout = 30000;
  if(req.body && req.body.enable=="false"){
    timeout = 2000;
  }
  setTimeout(function(){
    //console.log("FORCE GLOBAL IP UPDATE ENABLE!");
    GLOBAL.ip.update=true;
  },timeout);
  utils.setVPN(req.body.enable,req.body.vpn);
  res.end();
});


router.get("/https", function(req,res,next){
  sendHTTPRequest("localhost","/",81,function(statusCode, output){
    res.send(output);
  })
});

router.get("/flushHttps" , function(req,res,next){
  sendHTTPRequest("localhost","/flush",81,function(statusCode, output){
    res.send(output);
  })
});


router.get("/connected" , function (req,res,next) {
  utils.getConnectedClients(function(clients){
    res.header('Content-Type', 'application/json');
    res.write(JSON.stringify(clients));
    res.end();
  });
});

var sendHTTPRequest = function (host, uri, port, callback) {
    var options = {
    host: host,
    port: port,
    path: uri,
    method: 'GET',
  };
  
  var reqOut = http.request(options, function(resOut)
  {
    var output = '';
    resOut.setEncoding('utf8');
    resOut.on('data', function (chunk) {
      output += chunk;
    });
    resOut.on('end', function() {
      callback(resOut.statusCode, output);
    });
  });
  reqOut.on('error', function(err) {
        console.log("Unable to contact!");
        callback(-1,"");
    });
    reqOut.end();
}


module.exports = router;

