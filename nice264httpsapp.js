var express = require('express');
var path = require('path');
var app = express();
var http = require("http");
var NodeCache = require("node-cache");

var sendHTTPRequest = function (host, uri, callback) {
		var options = {
		host: host,
		port: 80,
		path: uri,
		method: 'GET',
	}

	var reqOut = http.request(options, function(resOut)
	{
		var output = '';
		console.log(options.host + ':' + resOut.statusCode);
		resOut.setEncoding('utf8');
		resOut.on('data', function (chunk) {
			output += chunk;
		});
		resOut.on('end', function() {
			callback(resOut.statusCode, output, resOut.headers['content-type']);
		});
	});
	reqOut.on('error', function(err) {
        console.log("Unable to contact!");
        callback(-1,"");
    });
    reqOut.end();
}


var requestsCache = new NodeCache({stdTTL: 600});

var sort = function ( r1, r2) {
	if( r1.time < r2.time ) { 
		return 1;
	}else if(r1.time > r2.time){
		return -1;
	}else{
		return 0;
	}
}

var captureAllRequests = function(req, res, next) {
	var host = req.headers.host;
	var uri = req.originalUrl; 	
	/*console.log("************* "+host+""+uri + " **************");*/
	if(req.path=="/"){
		var keys = requestsCache.keys();
		var cachedRequests = new Array();
		for(i in keys){
			r = requestsCache.get(keys[i]);
			cachedRequests.push(r);
		}
		cachedRequests = cachedRequests.sort(sort);
		res.writeHead(200, {"Content-Type": "application/json"});
		res.write(JSON.stringify(cachedRequests));
		res.end();
	}else if(req.path=="/flush") {
		requestsCache.flushAll();
		res.sendStatus(200);
	}
	else {
		var fullurl = "https://"+host+uri;
		var time= new Date().getTime();
		var r = {
			url : fullurl,
			time: time
		}
		if(fullurl.indexOf("favicon")==-1)
			requestsCache.set(fullurl+time,r);			


		sendHTTPRequest(host,uri, function(code,data,content_type) {
			res.setHeader("content-type",content_type);
			res.send(data);
		});
	
	}
}
app.use(captureAllRequests);


module.exports = app;
