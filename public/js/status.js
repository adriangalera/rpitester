var reload = 5000;
$(document).ready(function(){
  var map;
  var marker;
  /*
  Periodic status calls
  */
  (function dnshosts() {
    $.get('/dnsmasq', function(data) {
      html = "";
      data.forEach(function(dns){
        html += "<p><span class='left'>"+dns.host+"</span><span class='right'>"+dns.ip+"</span></p>";
      });
      $("#dnsmasqhosts").html(html);
      setTimeout(dnshosts, reload);
    });
  })();

  (function blockedips() {
    $.get('/blockedip', function(data) {
      html = "";
      if(data){
        data.forEach(function(blocked){
          html += "<p><span class='left'>"+blocked+"</span></p>";
        });
        $("#blockedips").html(html);
      }
      setTimeout(blockedips, reload);
    });
  })();

  (function buffering() {
    $.get('/buffer', function(buffer) {
      html = "";
      if(buffer){
        var status='Disabled'
        if(buffer.enabled==true){
          status='Enabled';
        }
        $("#bufferingstatus").text(status);
        $("#bufferingtype").text(buffer.type);
      }
      setTimeout(buffering, reload);
    });
  })();

  (function https() {
    $.get('/https', function(data) {
      html = "";
      data = JSON.parse(data);
      if(data){
        var httpsContainer = $("#httpsContainer");
        httpsContainer.html("");
        data.forEach(function(request){
          var newLi = "<li ><div class='https_time'>"+parseDate(request.time)+"</div><div class='https_url'>"+request.url+"</div>" + "</li>";
          httpsContainer.append(newLi);
        });
      }
      setTimeout(https, reload);
    });
  })();


  (function connectedClients(){

    $.get('/connected', function(data) {
      html = "";
      if(data){
        var connectedContainer = $("#connected_body");
        connectedContainer.html("");
        data.forEach(function(cli){

          var tr = $("<tr>");
          var tdname = $("<td>").text(cli.name);
          var tdip = $("<td>").text(cli.ip);
          var tdmac = $("<td>").text(cli.mac);
          tr.append(tdname);
          tr.append(tdip);
          tr.append(tdmac);

          connectedContainer.append(tr);

        });
      }
      setTimeout(connectedClients, reload);
    });

  } )();

/*
update IP via Socket io
*/
window.socket = io();
window.socket.on('ip', function(msg){
  ipinfo = JSON.parse(msg);
  $("#publicip").text(ipinfo.ip);
  $("#city").text(ipinfo.city);
  $("#country").text(ipinfo.country);
  loc = ipinfo.loc.split(",");
  updateMap(loc);
})

/*
map
*/function initmap() {
	// set up the map
	map = new L.Map('map');

	// create the tile layer with correct attribution
	var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
	var osm = new L.TileLayer(osmUrl, {attribution: osmAttrib, zoomControl:false});
	map.setView(new L.LatLng(0, 0),9);
	map.addLayer(osm);
  map.touchZoom.disable();
  map.doubleClickZoom.disable();
  map.scrollWheelZoom.disable();
  map.boxZoom.disable();
  map.keyboard.disable();
  $(".leaflet-control-zoom").css("visibility", "hidden");
  $(".leaflet-control-attribution").hide()
}

function updateMap(loc){
  if(marker){
    map.removeLayer(marker)
  }
  map.setView(new L.LatLng(loc[0], loc[1]),9);
  marker = L.marker(loc);
  marker.addTo(map);

}
initmap();


function parseDate(timestamp){
  function fixDatePart(part){
    if(part.toString().length==1){
      return "0"+part;
    }
    return part
  }
  var d = new Date(timestamp);
  var day = fixDatePart(d.getDate());
  var month = fixDatePart(d.getMonth()+1);
  var year = fixDatePart(d.getFullYear());
  var hour = fixDatePart(d.getHours());
  var minute = fixDatePart(d.getMinutes());
  var second = fixDatePart(d.getSeconds());
  var dString = day+"/"+month+"/"+year+" "+hour+":"+minute+":"+second;
  return dString;
}


$("#flushHttps").click(function(){
  $("httpsContainer").html("");
  $.get('/flushHttps');
})

});
