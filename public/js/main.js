function buffer(){

  function textToValue(text){
    switch(text){
      case "regular":
      return 0;
      case "bad":
      return 1;
      case "very-bad":
      return 2;
      case "terribly-bad":
      return 3
    }
  }
  $("[name='enable-buf']").bootstrapSwitch();

  $('input[name="enable-buf"]').on('switchChange.bootstrapSwitch', function(event, state) {
    //console.log(event); // jQuery event
    //console.log(state); // true | false
    if(state==false){
      $("#formbuftype").hide();
    }
    if(state==true){
      $("#formbuftype").show();
    }
  });

  $("#sendbuffer").click(function(e){
    e.preventDefault();
    enable = $("[name='enable-buf']").bootstrapSwitch("state");
    msg = {
      enable : enable,
      type : ""
    }
    if(enable==true){
      type = ""
      switch($("#buftype").val()){
        case "0":
        type = 'regular'
        break
        case "1":
        type = 'bad'
        break;
        case "2":
        type='very-bad'
        break;
        case "3":
        type='terribly-bad'
        break;
      }
      msg.type = type;
    }

    $.ajax({
      method: "POST",
      url: "/buffer",
      data: msg
    });
  });
  $.get('/buffer', function(buffer) {
    html = "";

    if(buffer){
      if(buffer.enabled){
        $("[name='enable-buf']").bootstrapSwitch("state",true,true)
        value = textToValue(buffer.type);
        $("#buftype").val(value);
        $("#formbuftype").show();
      }else{
        $("[name='enable-buf']").bootstrapSwitch("state",false,false)
        $("#formbuftype").hide();
      }

    }else{
      $("[name='enable-buf']").bootstrapSwitch("state",false,false)
      $("#formbuftype").hide();
    }

  });
}

function vpn(){
  $("[name='enable-vpn']").bootstrapSwitch();

  $('input[name="enable-vpn"]').on('switchChange.bootstrapSwitch', function(event, state) {
    //console.log(event); // jQuery event
    //console.log(state); // true | false
    if(state==false){
      $("#formvpnconnection").hide();
    }
    if(state==true){
      $("#formvpnconnection").show();
    }
  });

  $.get('/vpns', function(vpninfo) {
    if(vpninfo){

      //populate select
      html = "";
      vpninfo.list_available.forEach(function(vpn){
        html += "<option value ='"+vpn+"' >"+vpn+"</option>";
      });

      $("#vpncon").html(html);

      if(vpninfo.enabled){
        $("[name='enable-vpn']").bootstrapSwitch("state",true,true)
        value = vpninfo.connected;
        $("#vpncon").val(value);
        $("#formvpnconnection").show();
      }else{
        $("[name='enable-vpn']").bootstrapSwitch("state",false,false)
        $("#formvpnconnection").hide();
      }
    }else{
      $("[name='enable-vpn']").bootstrapSwitch("state",false,false)
      $("#formvpnconnection").hide();
    }
  });
  $("#sendvpn").click(function(e){
    e.preventDefault();
    enable = $("[name='enable-vpn']").bootstrapSwitch("state");
    msg = {
      enable : enable,
      vpn : ""
    }
    if(enable==true){
      msg.vpn = $("#vpncon").val();
    }

    $.ajax({
      method: "POST",
      url: "/vpn",
      data: msg
    });
  });


}

function dnsmasq(){
  function addDNSRow(host,ip,_new){
    if(_new){
      html = "<tr><td><input type='text' class='form-control host' placeholder='host.com' value='"+host+"'/></td><td><input type='text' class='form-control ip' placeholder='8.8.8.8' value='"+ip+"'/></td><td><span class='glyphicon glyphicon-remove dns-remove'></span></td></tr>";
    }else{
      html = "<tr><td><input type='text' readonly class='form-control host' placeholder='host.com' value='"+host+"'/></td><td><input type='text' readonly class='form-control ip' placeholder='8.8.8.8' value='"+ip+"'/></td><td><span class='glyphicon glyphicon-remove dns-remove'></span></td></tr>";
    }
    $("#dnstable").append(html);
    $(".dns-remove").click(function(){
      $(this).parent().parent().remove();
    })
  }
  $("#adddns").click(function(){
    addDNSRow("","",true);
  })
  //addDNSRow("wuaki.com","127.0.0.1",false);
  $.get('/dnsmasq', function(dnsmasq) {
    if(dnsmasq){
      dnsmasq.forEach(function(dnsmasq){
        addDNSRow(dnsmasq.host,dnsmasq.ip,false);
      });
    }
  });

  $("#senddns").click(function(){
    var entries = $(".ip").length;
    var i;
    var arr=[];
    for(i=0;i<entries;i++){
      var host = $($(".host")[i]).val();
      var ip = $($(".ip")[i]).val();
      iphost = {
        ip : ip,
        host: host
      }
      arr.push(iphost);
    }
    $.ajax({
      method: "POST",
      url: "/dnsmasq",
      data: {
        iphosts : JSON.stringify(arr)
      }
    });

  });

}

function ipblock(){
  function addRow(ip,_new){
    if(_new){
      html = "<tr><td><input type='text' class='form-control blockip' placeholder='8.8.8.8' value='"+ip+"'/></td><td><span class='glyphicon glyphicon-remove ip-remove'></span></td></tr>";
    }else{
      html = "<tr><td><input type='text' readonly class='form-control blockip' placeholder='8.8.8.8' value='"+ip+"'/></td><td><span class='glyphicon glyphicon-remove ip-remove'></span></td></tr>";
    }
    $("#iptable").append(html);
    $(".ip-remove").click(function(){
      $(this).parent().parent().remove();
    })
  }
  $("#addip").click(function(){
    addRow("",true);
  })
  $.get('/blockedip', function(blockedip) {
    if(blockedip){
      blockedip.forEach(function(ip){
        //addDNSRow(dnsmasq.host,dnsmasq.ip,false);
        addRow(ip,false);
      });
    }
  });
  $("#sendip").click(function(){
    var entries = $(".blockip").length;
    var i;
    var csv="";
    for(i=0;i<entries;i++){
      csv = csv + $($(".blockip")[i]).val()+",";
    }
    if(csv.length > 0){
      csv = csv.slice(0,-1);
    }
    $.ajax({
      method: "POST",
      url: "/blockedip",
      data: {
        ipcsv : csv
      }
    });

  });
}
//pony style!
function pony(){



  $('<img id="pony" src="/img/25.png" style="width: 300px; position: fixed; bottom: -300px;"/>').appendTo('body');

  $('body').on('keydown', function(e){
    window.queue = window.queue || '';
    window.queue += '|' + e.which;
    if ( window.queue.length >= 24){
      window.queue = window.queue.substring(3);
    }
    if (window.queue.indexOf('|40|38') !== -1) {
      window.queue = '';
      var left = Math.floor((Math.random() * 100) + 1);
      $( "#pony" ).css('left', left+'%').animate({ bottom: "+=200" }, 750, function() {
        $( "#pony" ).animate({bottom: "-=200"}, 400);
      });
    }

    var lastKey = e.which;
  });

}

var snifferConfiguration = {};
function sniffer(){
  $("#sniffStartBtn").click(function(e){
    $("#sniffercontainer").html("");
    e.preventDefault();

    snifferConfiguration = {
      device: $("#snifferDevice").val(),
      filter: $("#sniffer_filter").val(),
      id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = crypto.getRandomValues(new Uint8Array(1))[0]%16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
      })
    }
    window.socket.emit("startsniffer", snifferConfiguration);
    window.socket.on("newpacket", function (pkt) {
      var newline = "";
      var time = parseDate(pkt.time);
      var type = pkt.type;
      var ip_src = pkt.ip_src;
      var ip_dst = pkt.ip_dst;

      var newline = $("<li>").append("<div class='snif_row'>");
      var time = $("<div class='snif_time snif'>").text(time);
      var type = $("<div class='snif_type snif'>").text(type);
      var ipSrc= $("<div class='snif_ip_src snif'>").text(ip_src);
      var ipDst= $("<div class='snif_ip_src snif'>").text(ip_dst);

      newline.append(time);
      newline.append(type);
      newline.append(ipSrc);
      newline.append(ipDst);

      switch(pkt.type){
        case "HTTP":
        var httpSnif = $("<div class='snif-http snif'>");
        //var httpType = pkt.httpType;
        var data = pkt.data;
        var lines = pkt.lines;
        if(data){
          var httpData = $("<div class='snif-http-data'>").text(data);
          httpSnif.append(httpData);
        }
        var httpLines = $("<div class='snif-http-lines'>").text(lines);
        httpSnif.append(httpLines);
        newline.append(httpSnif);
        break;
        case "ICMP":
        var icmpSniff = $("<div class='snif-icmp snif'>");
        var icmpType = pkt.icmpType;
        icmpSniff.text(icmpType);
        newline.append(icmpSniff);
        break;
        case "DNS":
        var dnsSniff = $("<div class='snif-dns snif'>");
        var dnsType = pkt.dnsType;
        var snifDnsType = $("<div class='snif-dns-type'>").text(dnsType);
        dnsSniff.append(snifDnsType);
        var question = pkt.question;
        var snifDnsQuestion = $("<div class='snif-dns-question'>").text(question);
        dnsSniff.append(snifDnsQuestion);
        var answer = pkt.answer;
        if(answer){
          var snifDnsAnswer = $("<div class='snif-dns-answer'>").text(answer);
          dnsSniff.append(snifDnsAnswer);
        }
        newline.append(dnsSniff);
        break;
      }
      $("#sniffercontainer").prepend(newline);
    })
});
$("#sniffStopBtn").click(function(e){
  e.preventDefault();
  window.socket.emit("stopsniffer", snifferConfiguration);
  $("#sniffercontainer").html("");
});
}

$(document).ready(function(){
  buffer();
  vpn();
  dnsmasq();
  ipblock();
  pony();
  sniffer();
});

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

$( window ).unload(function() {
  window.socket.emit("stopsniffer", snifferConfiguration);
});
