var periodicallySendData = true;
var useSendBeacon = true;
var useExternalServerScript = true;
var externalServerScriptUrl = "http://147.175.149.192:443/logger";
var visitorProperty = "";

function guid() {
    function _p8(s) {
        var p = (Math.random().toString(16)+"000000000").substr(2,8);
        return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
    }
    return _p8() + _p8(true) + _p8(true) + _p8();
}

function X()
{
    var x = this;

    this.httpendpoint = window.location.href;

    // ak nepodporuje sendBeacon, tak sa bude odosielat v pravidelnych intervaloch ajaxom
    if (periodicallySendData) {
        this.logTimeout = 2000;
        this.logInterval = setInterval(function () { x.flushLog(); }, this.logTimeout);
    }

    this.logQueue = [];
    this.logSendCount = 0;
    this.logEventCount = 0;
    if (this.logTimeout > -1) {
        this.lastMouseX = 0;
        this.lastMouseY = 0;
    }

    // Session storage pre urcenie tabky
    if (sessionStorage.getItem('sid') == null)
        sessionStorage.setItem('sid', guid());
    this.sessionId = sessionStorage.sid;

    // Local storage pre urcenie prehliadaca
    if (localStorage.getItem('mid') == null)
        localStorage.setItem('mid', guid());
    this.machineId = localStorage.mid;

    this.outqueue = [];
    this.outserial = 0;

    this.procqueue = [];
    this.waitack = 0;

    // registrovanie udalosti
    $(document).on('mousemove mouseover mouseout mousedown mouseup click dblclick blur focus', function (ev) { x.eventReceived(ev); });
    $(window).on('load resize blur focus', function (ev) { x.eventReceived(ev); });

    //  $(document).on('touchstart touchend touchmove touchleave touchcancel', function (event) { x.eventTouchReceived(event); });

    $(window).bind('scroll', function (ev) { x.eventScrollReceived(ev); });

    $(window).bind('beforeunload', function() { return x.close(); });

}

X.prototype.eventScrollReceived = function (ev) {
    var old = this.scrollYOld || 0;
    var eventName = (window.scrollY - old < 0) ? "scrollup" : "scrolldown";
    this.sendLog(new Date().getTime(), eventName, window.scrollX, window.scrollY);
    this.scrollYOld = window.scrollY;
}

X.prototype.eventMouseReceived = function (ev) {
    this.lastMouseX = ev.screenX;
    this.lastMouseY = ev.screenY;

    if (ev.target != null)
        this.sendLog(new Date().getTime(), ev.type, this.lastMouseX, this.lastMouseY, ev.target.localName);
    else
        this.sendLog(new Date().getTime(), ev.type, this.lastMouseX, this.lastMouseY);
}

X.prototype.eventTouchReceived = function (event) {
    event.preventDefault();
    var touches = event.originalEvent.touches;
    var ev = event.originalEvent;
    for (var i=0; i < touches.length; i++) {
        var touch = touches[i];
        this.lastTouchX = touch.screenX;
        this.lastTouchY = touch.screenY;
        if (ev.target != null)
            this.sendLog(new Date().getTime(), ev.type, touches.length, touch.identifier, Math.round(touch.clientX * 100)/100, Math.round(touch.clientY * 100)/100, Math.round(touch.screenX * 100)/100, Math.round(touch.screenY * 100)/100, Math.round(touch.radiusX * 100)/100, Math.round(touch.radiusY * 100)/100, Math.round(touch.rotationAngle * 100)/100, Math.round(touch.force * 100)/100, ev.target.localName);
        else
            this.sendLog(new Date().getTime(), ev.type, touches.length, touch.identifier, Math.round(touch.clientX * 100)/100, Math.round(touch.clientY * 100)/100, Math.round(touch.screenX * 100)/100, Math.round(touch.screenY * 100)/100, Math.round(touch.radiusX * 100)/100, Math.round(touch.radiusY * 100)/100, Math.round(touch.rotationAngle * 100)/100, Math.round(touch.force * 100)/100);
    }
    if (touches.length == 0) {
        this.sendLog(new Date().getTime(), ev.type, touches.length);
    }
}


//verzie OS, web browsera,...
var nVer = navigator.appVersion;
var nAgt = navigator.userAgent;
var browserName  = navigator.appName;
var fullVersion  = ''+parseFloat(navigator.appVersion); 
var majorVersion = parseInt(navigator.appVersion,10);
var nameOffset,verOffset,ix;

var cookie = navigator.cookieEnabled;
var language = navigator.language;
var platform = navigator.platform;

// In Opera 15+, the true version is after "OPR/" 
if ((verOffset=nAgt.indexOf("OPR/"))!=-1) {
 browserName = "Opera";
 fullVersion = nAgt.substring(verOffset+4);
}
// In older Opera, the true version is after "Opera" or after "Version"
else if ((verOffset=nAgt.indexOf("Opera"))!=-1) {
 browserName = "Opera";
 fullVersion = nAgt.substring(verOffset+6);
 if ((verOffset=nAgt.indexOf("Version"))!=-1) 
   fullVersion = nAgt.substring(verOffset+8);
}
// In MSIE, the true version is after "MSIE" in userAgent
else if ((verOffset=nAgt.indexOf("MSIE"))!=-1) {
 browserName = "Microsoft Internet Explorer";
 fullVersion = nAgt.substring(verOffset+5);
}
// In Chrome, the true version is after "Chrome" 
else if ((verOffset=nAgt.indexOf("Chrome"))!=-1) {
 browserName = "Chrome";
 fullVersion = nAgt.substring(verOffset+7);
}
// In Safari, the true version is after "Safari" or after "Version" 
else if ((verOffset=nAgt.indexOf("Safari"))!=-1) {
 browserName = "Safari";
 fullVersion = nAgt.substring(verOffset+7);
 if ((verOffset=nAgt.indexOf("Version"))!=-1) 
   fullVersion = nAgt.substring(verOffset+8);
}
// In Firefox, the true version is after "Firefox" 
else if ((verOffset=nAgt.indexOf("Firefox"))!=-1) {
 browserName = "Firefox";
 fullVersion = nAgt.substring(verOffset+8);
}
// In most other browsers, "name/version" is at the end of userAgent 
else if ( (nameOffset=nAgt.lastIndexOf(' ')+1) < 
          (verOffset=nAgt.lastIndexOf('/')) ) 
{
 browserName = nAgt.substring(nameOffset,verOffset);
 fullVersion = nAgt.substring(verOffset+1);
 if (browserName.toLowerCase()==browserName.toUpperCase()) {
  browserName = navigator.appName;
 }
}
// trim the fullVersion string at semicolon/space if present
if ((ix=fullVersion.indexOf(";"))!=-1)
   fullVersion=fullVersion.substring(0,ix);
if ((ix=fullVersion.indexOf(" "))!=-1)
   fullVersion=fullVersion.substring(0,ix);

majorVersion = parseInt(''+fullVersion,10);
if (isNaN(majorVersion)) {
 fullVersion  = ''+parseFloat(navigator.appVersion); 
 majorVersion = parseInt(navigator.appVersion,10);
}
/*
document.write(''
 +'browser  = '+browserName+'<br>'
 //+'info  = '+nVer+'<br>'
 +'browser_version  = '+fullVersion+'<br>'
 +'majorVersion = '+majorVersion+'<br>'
 +'appName = '+navigator.appName+'<br>'
 +'cookie = '+cookie+'<br>'
 +'language = '+language+'<br>'
 +'platform = '+platform+'<br>'
)
*/


X.prototype.eventReceived = function (ev) {
    if (this.logTimeout <= -1)
        return;
    /*
     if (this.logEventCount == 0) {
     var time = new Date();
     this.sendLog(new Date().getTime(), 'size', screen.width, screen.height, $(window).width(), $(window).height(), $(document).width(), $(document).height());
     this.sendLog(new Date().getTime(), 'colordepth', screen.colorDepth);
     this.sendLog(new Date().getTime(), 'timezone', time.getTimezoneOffset());
     }
     */
    if (this.logEventCount == 0) {
        var time = new Date();
        visitorProperty = visitorProperties(new Date().getTime(), 'size', screen.width, screen.height, $(window).width(), $(window).height(), $(document).width(), $(document).height(), screen.colorDepth, time.getTimezoneOffset(), browserName, fullVersion, majorVersion, navigator.appName, cookie, language, platform);;
    }
    if (ev.type == 'click') {
        this.sendLog(new Date().getTime(), ev.type, ev.clientX, ev.clientY, ev.target.localName);
        return;
    }

    if (ev.type == 'blur' || ev.type == 'focus') {
        // odchod zo stranky / focus na stranku
        this.sendLog(new Date().getTime(), ev.type);
        return;
    }

    if (ev.type == 'visibilitychange') {
        // zmena viditelnosti
        var hidden = document.hidden;
        if (document.msHidden)
            hidden = document.msHidden;
        var visibilityState = document.visibilityState;
        if (document.msVisibilityState)
            visibilityState = document.msVisibilityState;

        this.sendLog(new Date().getTime(), ev.type, hidden, visibilityState);
        return;
    }

    if (ev.type == 'mousemove') {
        this.eventMouseReceived(ev);
        return;
    }
    if (ev.type == 'mouseover') {
        // ak sme na elemente, ktory ma id, zaznacime
        this.eventMouseReceived(ev);
        return;
    }
    if (ev.type == 'mouseout') {
        // ak sme na elemente, ktory ma id, zaznacime
        this.eventMouseReceived(ev);
        return;
    }

    if (ev.type == 'mousedown') {
        // ak sme na elemente, ktory ma id, zaznacime
        this.eventMouseReceived(ev);
        return;
    }
    if (ev.type == 'mouseup') {
        // ak sme na elemente, ktory ma id, zaznacime
        this.eventMouseReceived(ev);
        return;
    }
    if (ev.type == 'dblclick') {
        // ak sme na elemente, ktory ma id, zaznacime
        this.eventMouseReceived(ev);
        return;
    }

    if (ev.type == 'resize') {
        // nacitana stranka
        this.sendLog(new Date().getTime(), ev.type, screen.width, screen.height, $(window).width(), $(window).height(), $(document).width(), $(document).height());
        return;
    }
}

function createJson  (args,event){
    var targetName = "";

    if (args.length > 4){
        targetName = args[4];
    }

    var data = {
        "datetime" : args[0],
        "eventtype" : args[1],
        "corx": args[2],
        "cory" : args[3],
        "targetName" : targetName,
    };

    return JSON.stringify(data);
}
function visitorProperties() {

    var data = {
        "datetime" : "",
        //   "eventtype" : "",
        "screenw": "",
        "screenh": "",
        "windoww": "",
        "windowh": "",
        "docw": "",
        "doch": "",
        "colordepth" : "",
        "timezone" : "",
        "browser" : "",
        "browser_version" : "",
        "majorVersion" : "",
        "appName" : "",
        "cookie" : "",
        "language" : "",
        "platform" : ""
        

    };

    // now we dont need eventype (without arguments[1])
    data.datetime = arguments[0];
    //data.eventtype = arguments[1];

    data.screenw = arguments[2];
    data.screenh = arguments[3];
    data.windoww = arguments[4];
    data.windowh = arguments[5];
    data.docw = arguments[6];
    data.doch = arguments[7];
    data.colordepth = arguments[8];
    data.timezone = arguments[9];
    data.browser = arguments[10];
    data.browser_version = arguments[11];
    data.majorVersion = arguments[12];
    data.appName = arguments[13];
    data.cookie = arguments[14];
    data.language = arguments[15];
    data.platform = arguments[16];
    

    return JSON.stringify(data);
}




X.prototype.argsToMsgText = function (args) {
    var text = "";
    var event = "";
    if (args.length > 1){
        event = args[1];
    }

    for (var i = 0; i < args.length; i++)
        text = text.concat(args[i],";");
    return createJson(args,event);
}

// ulozenie zaznamu na poslanie
X.prototype.sendLog = function () {
    this.logEventCount++;

    if (arguments.length == 0)
        return; // prazdna sprava

    if (this.logTimeout <= -1)
        return;


    this.logQueue.push(this.argsToMsgText(arguments));
}

// odoslanie neposlanych zaznamov
X.prototype.flushLog = function () {
    if (this.logQueue.length == 0)
        return;

    if (!useExternalServerScript)
        var serverScriptUrl =  this.httpendpoint + 'record.php';
    else
        var serverScriptUrl =  externalServerScriptUrl;
    var url = serverScriptUrl + '?mid=' + this.machineId + '&sid=' + this.sessionId + "&page=" + document.location.pathname;
    this.logSendCount++;

    var data = "";
    //creating json header
    var jsonHeader = '{"visitor":{"mid":' + '"'+this.machineId+'"' + ',' +
        '"sid":' + '"'+ this.sessionId +'"' + ',' +
        '"page":' + '"' + document.location.pathname + '"},' +
        '"size":' + visitorProperty + ',' +
        '"data": [';

    //appending header to data
    data = data + jsonHeader;

    var i = 0;
    while (this.logQueue.length > 0) {
        var msg = this.logQueue.shift();
        if (data.length > 0 && i == 1) {
            data += ",";
        }
        data += msg;
        i = 1;
    }

    data = data + "]}"
    this.send(url, data);
};

X.prototype.close = function () {
    this.flushLog();
};

X.prototype.send = function (url, data) {
    if (this.sendBeaconSupported() && useSendBeacon)
        navigator.sendBeacon(url, data);
    else {
        $.ajax({
            type: 'POST',
            contentType: "text/plain",
            url: url,
            async: true,
            crossDomain: useExternalServerScript,
            dataType : "text",
            processData: false,
            data: data
        });
    }
}



X.prototype.sendBeaconSupported = function () {
    return (navigator.sendBeacon != null);
}

var logger = new X();