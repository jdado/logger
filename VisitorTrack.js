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

    var coordinates = transferCoordinatesForHeatMap(ev);

    if (ev.target != null)
        this.sendLog(new Date().getTime(), ev.type, this.lastMouseX, this.lastMouseY, coordinates[0], coordinates[1], ev.target.localName );
    else
        this.sendLog(new Date().getTime(), ev.type, this.lastMouseX, this.lastMouseY, coordinates[0],coordinates[1]);
}

function transferCoordinatesForHeatMap(ev){
    var realMouseX = ev.clientX + window.scrollX;
    var realMouseY = ev.clientY + window.scrollY;

    var array = [];
    //1024px je maxim=alna sirka heatmap screenu, ktoru sme vopred dohodli

    this.heatMapMouseX = Math.round((1024 / $(window).width()) * realMouseX);


    this.heatMapMouseY = realMouseY;

    array.push(this.heatMapMouseX);
    array.push(this.heatMapMouseY);

    return array;
}

X.prototype.eventTouchReceived = function (event) {
    //event.preventDefault();
    //var touches = event.originalEvent.touches;
    //var ev = event.originalEvent;
    //for (var i=0; i < touches.length; i++) {
    //    var touch = touches[i];
    //    this.lastTouchX = touch.screenX;
    //    this.lastTouchY = touch.screenY;
    //    if (ev.target != null)
    //        this.sendLog(new Date().getTime(), ev.type, touches.length, touch.identifier, Math.round(touch.clientX * 100)/100, Math.round(touch.clientY * 100)/100, Math.round(touch.screenX * 100)/100, Math.round(touch.screenY * 100)/100, Math.round(touch.radiusX * 100)/100, Math.round(touch.radiusY * 100)/100, Math.round(touch.rotationAngle * 100)/100, Math.round(touch.force * 100)/100, ev.target.localName);
    //    else
    //        this.sendLog(new Date().getTime(), ev.type, touches.length, touch.identifier, Math.round(touch.clientX * 100)/100, Math.round(touch.clientY * 100)/100, Math.round(touch.screenX * 100)/100, Math.round(touch.screenY * 100)/100, Math.round(touch.radiusX * 100)/100, Math.round(touch.radiusY * 100)/100, Math.round(touch.rotationAngle * 100)/100, Math.round(touch.force * 100)/100);
    //}
    //if (touches.length == 0) {
    //    this.sendLog(new Date().getTime(), ev.type, touches.length);
    //}
}

//verzie OS, web browsera, typ zariadenia...
const PHONE = "Mobile";
const TABLET = "Tablet";
const DESKTOP = "Desktop";
const DEVICES = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

var nVer = navigator.appVersion;
var nAgt = navigator.userAgent;
var browserName  = navigator.appName;
var fullVersion  = ''+parseFloat(navigator.appVersion); 
var majorVersion = parseInt(navigator.appVersion,10);
var nameOffset,verOffset,ix;

var cookie = navigator.cookieEnabled;
var language = navigator.language;
var platform = navigator.platform;
var device;

if( DEVICES.test(nAgt) ) {
    device = PHONE;
} else {
    device = DESKTOP;
}


//URL na referujucu stranku, odkial prisli
var comesFrom = document.referrer;

var bot = 0;

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

//overenie ci je bot alebo crawler
//document.write(nAgt);

if(nAgt==("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)") || nAgt==("Feedly/1.0 (+http://www.feedly.com/fetcher.html; like FeedFetcher-Google)") || nAgt==("downnotifier.com monitoring") || nAgt==("Irokez.cz monitoring v1.2 - (http://www.irokez.cz, Irokez.cz, crawl)") || nAgt==("Feedly/1.0 (+http://www.feedly.com/fetcher.html; like FeedFetcher-Google)") || nAgt==("Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11 GotSiteMonitor.com") || nAgt==("Inspingbot/1.0 (+https://www.insping.com/)") || nAgt==("Server Density Service Monitoring v2") || nAgt==("Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)") || nAgt==("PINGOMETER_BOT_(HTTPS://PINGOMETER.COM)") || nAgt==("ServiceUptime.robot") || nAgt==("Mozilla/5.0 (compatible; MJ12bot/v1.4.5; http://www.majestic12.co.uk/bot.php?+)") || nAgt==("Mozilla/5.0+(compatible; UptimeRobot/2.0; http://www.uptimerobot.com/)") || nAgt==("Mozilla/5.0 (compatible; DotBot/1.1; http://www.opensiteexplorer.org/dotbot, help@moz.com)") || nAgt==("Mozilla/5.0+(compatible; Monitority/1.0; http://www.monitority.com/)") || nAgt==("omgilibot/0.4 +http://omgili.com") || nAgt==("Mozilla/5.0 (compatible; FlipboardRSS/1.1; +http://flipboard.com/browserproxy)") || nAgt==("FreeWebMonitoring SiteChecker/0.2 (+http://www.freewebmonitoring.com/bot.html)") || nAgt==("Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)") || nAgt==("Mozilla/5.0 (compatible; www.monitor.us - free monitoring service; http://www.monitor.us)") || nAgt==("CCBot/2.0 (http://commoncrawl.org/faq/)") || nAgt==("Mozilla/5.0 (compatible; PaperLiBot/2.1; http://support.paper.li/entries/20023257-what-is-paper-li)") || nAgt==("Mozilla/5.0 (compatible; AhrefsBot/5.0; +http://ahrefs.com/robot/)") || nAgt==("Sogou web spider/4.0(+http://www.sogou.com/docs/help/webmasters.htm#07)") || nAgt==("Pingoscope") || nAgt==("Mozilla/5.0 (compatible; linkdexbot/2.0; +http://www.linkdex.com/bots/)") || nAgt==("Mozilla/5.0 (compatible; Exabot/3.0; +http://www.exabot.com/go/robot)") || nAgt==("Site24x7") || nAgt==("montastic-monitor http://www.montastic.com") || nAgt==("Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)") || nAgt==("rogerbot/1.0 (http://www.moz.com/dp/rogerbot, rogerbot-crawler@moz.com)") || nAgt==("Mozilla/5.0 (compatible; DeuSu/5.0.2; +https://deusu.de/robot.html)") || nAgt==("Mozilla/5.0 (compatible; coccoc/1.0; +http://help.coccoc.com/)") || nAgt==("Mozilla/5.0 (compatible; MetaJobBot; http://www.metajob.at/crawler)") || nAgt==("Riddler (http://riddler.io/about)") || nAgt==("Mozilla/5.0 (compatible; Feedspotbot/1.0; +http://www.feedspot.com/fs/bot)") || nAgt==("Mozilla/5.0 (compatible; BLEXBot/1.0; +http://webmeup-crawler.com/)") || nAgt==("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)") || nAgt==("Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; http://www.changedetection.com/bot.html )") || nAgt==("panscient.com") || nAgt==("TurnitinBot (https://turnitin.com/robot/crawlerinfo.html)") || nAgt==("Mozilla/5.0 (compatible; theoldreader.com)") || nAgt==("Woko robot 3.0") || nAgt==("Mozilla/5.0 (compatible; Genieo/1.0 http://www.genieo.com/webfilter.html)") || nAgt==("BacklinkCrawler (http://www.backlinktest.com/crawler.html)") || nAgt==("Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0); 360Spider(compatible; HaosouSpider; http://www.haosou.com/help/help_3_2.html)") || nAgt==("Mozilla/5.0 (compatible; GroupHigh/1.0; +http://www.grouphigh.com/)") || nAgt==("Mozilla/5.0 (compatible; spbot/4.4.2; +http://OpenLinkProfiler.org/bot )") || nAgt==("mindUpBot (datenbutler.de)") || nAgt==("Mozilla/5.0 (compatible; Qwantify/2.1w; +https://www.qwant.com/)/") || nAgt==("Mozilla/5.0 (compatible; SeznamBot/3.2-test4; +http://fulltext.sblog.cz/)") || nAgt==("Mozilla/5.0 (compatible; Lipperhey-Kaus-Australis/5.0; +https://www.lipperhey.com/en/about/)") || nAgt==("404 Checker [http://www.404checker.com/user-agent]") || nAgt==("Mozilla/5.0 (compatible; UASlinkChecker/2.1; +https://udger.com/support/UASlinkChecker)") || nAgt==("LinqiaScrapeBot/1.0 (eng@linqia.com)") || nAgt==("Mozilla/5.0 (compatible; SEOlyticsCrawler/3.0; +http://crawler.seolytics.net/)") || nAgt==("Testomatobot/1.0 (Linux x86_64; +http://www.testomato.com/testomatobot) minicrawler/3.0.1") || nAgt==("Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/98 Safari/537.4 (StatusCake)") || nAgt==("Mozilla/5.0 (compatible; WBSearchBot/1.1; +http://www.warebay.com/bot.html)") || nAgt==("Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.6) Gecko/20070725 Firefox/2.0.0.6 - James BOT - WebCrawler http://cognitiveseo.com/bot.html") || nAgt==("Mozilla/5.0 (compatible; proximic; +http://www.proximic.com/info/spider.php)") || nAgt==("MXT/Nutch-1.10 (http://t.co/GSRLLKex24; informatique at mixdata dot com)") || nAgt==("Mozilla/5.0 (compatible; Linux x86_64; Mail.RU_Bot/2.0; +http://go.mail.ru/help/robots)") || nAgt==("Mozilla/5.0 (compatible; TWMBot/0.1; +http://thewebminer.com)") || nAgt==("Googlebot (gocrawl v0.4)") || nAgt==("Mozilla/5.0 (compatible; MojeekBot/0.6; +https://www.mojeek.com/bot.html)") || nAgt==("Mozilla/5.0 (Windows NT 6.1) (compatible; SMTBot/1.0; +http://www.similartech.com/smtbot)") || nAgt==("Mergadobot/3.0.2 (+http://mergado.cz)")){
	bot=1;
}
if(nAgt==("aboutthedomain") || nAgt==("Mozilla/5.0 (compatible; archive.org_bot; Wayback Machine Live Record; +http://archive.org/details/archive.org_bot)") || nAgt==("Online Virus Scanner: http://tools.geek-tools.org") || nAgt==("http://tools.geek-tools.org/link-counter/") || nAgt==("Visited by http://tools.geek-tools.org") || nAgt==("Mozilla/5.0 (Windows; U; MSIE 9.0; Windows NT 9.0; en-US) AppEngine-Google; (+http://code.google.com/appengine; appid: s~virustotalcloud)") || nAgt==("bl.uk_lddc_bot/3.3.0-SNAPSHOT-2014-10-07T09:33:31Z (+http://www.bl.uk/aboutus/legaldeposit/websites/websites/faqswebmaster/index.html)") || nAgt==("CSS Certificate Spider (http://www.css-security.com/certificatespider/)") || nAgt==("Mozilla/5.0 (Windows; U; Windows NT 5.1; en; rv:1.9.0.13) Gecko/2009073022 Firefox/3.5.2 (.NET CLR 3.5.30729) SurveyBot/2.3 (DomainTools)") || nAgt==("Mozilla/5.0 (compatible; Yeti/1.1; +http://help.naver.com/robots/)") || nAgt==("yacybot (/global; amd64 Linux 4.3.0-gentoo-ARCH; java 1.7.0_85; Europe/en) http://yacy.net/bot.html") || nAgt==("Mozilla/5.0 (compatible; Steeler/3.5; http://www.tkl.iis.u-tokyo.ac.jp/~crawler/)") || nAgt==("Comodo SSL Checker") || nAgt==("GetintentCrawler getintent.com") || nAgt==("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/600.2.5 (KHTML, like Gecko) Version/8.0.2 Safari/600.2.5 (Applebot/0.1; +http://www.apple.com/go/applebot)") || nAgt==("Mozilla/5.0 (iPhone; CPU iPhone OS 8_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4 (Applebot/0.1; +http://www.apple.com/go/applebot)") || nAgt==("Mozilla/5.0 (compatible; Applebot/0.3; +http://www.apple.com/go/applebot)") || nAgt==("Mozilla/5.0 (compatible; DomainAppender /1.0; +http://www.profound.net/domainappender)") || nAgt==("Mozilla/5.0 (compatible; kulturarw3 +http://www.kb.se/om/projekt/Svenska-webbsidor---Kulturarw3/)") || nAgt==("FeedCatBot/3.0 (+http://www.feedcat.net/)") || nAgt==("GigablastOpenSource/1.0") || nAgt==("Mozilla/5.0 (compatible; online-webceo-bot/1.0; +http://online.webceo.com)") || nAgt==("Mozilla/5.0 (compatible; GrapeshotCrawler/2.0; +http://www.grapeshot.co.uk/crawler.php)") || nAgt==("voltron") || nAgt==("Jyxobot/1") || nAgt==("Mozilla/5.0 (compatible; PrivacyAwareBot/1.1; +http://www.privacyaware.org)") || nAgt==("SimplyFast.info Headers") || nAgt==("Mozilla/5.0 (iPhone; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12F70 Safari/600.1.4 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)") || nAgt==("Mozilla/5.0 (Windows; U; Windows NT 5.1; de; rv:1.9.0.7; Google-SearchByImage) Gecko/2009021910 Firefox/3.0.7") || nAgt==("Mozilla/5.0 (Windows; U; Windows NT 5.1; de; rv:1.9.0.7; Google-SearchByImage) Gecko/2009021910 Firefox/3.0.7") || nAgt==("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko; Google Page Speed Insights) Chrome/27.0.1453 Safari/537.36") || nAgt==("Mozilla/5.0 (compatible; Google-Structured-Data-Testing-Tool +http://developers.google.com/structured-data/testing-tool/)") || nAgt==("Mozilla/5.0 (Linux; Android 4.2.1; en-us; Nexus 5 Build/JOP40D) AppleWebKit/535.19 (KHTML, like Gecko; googleweblight) Chrome/38.0.1025.166 Mobile Safari/535.19") || nAgt==("Googlebot/2.1 (+http://www.google.com/bot.html)") || nAgt==("Google favicon") || nAgt==("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko; Google Web Preview) Chrome/27.0.1453 Safari/537.36") || nAgt==("Mozilla/5.0 (en-us) AppleWebKit/537.36 (KHTML, like Gecko; Google PP Default) Chrome/27.0.1453 Safari/537.36") || nAgt==("Mozilla/5.0 (iPhone; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko; Google Page Speed Insights) Version/8.0 Mobile/12F70 Safari/600.1.4") || nAgt==("Mozilla/5.0 (iPhone; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/8.0 Mobile/12F70 Safari/600.1.4 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)") || nAgt==("Mozilla/5.0 (iPhone; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/8.0 Mobile/12F70 Safari/600.1.4 (compatible; Google Search Console)") || nAgt==("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko; Google Search Console) Chrome/27.0.1453 Safari/537.36") || nAgt==("Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)") || nAgt==("Mozilla/5.0 (iPhone; CPU iPhone OS 6_0_1 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko; Google Page Speed Insights) Version/6.0 Mobile/10A525 Safari/8536.25") || nAgt==("Googlebot-Image/1.0") || nAgt==("Mozilla/5.0 (Windows NT 6.1; rv:6.0) Gecko/20110814 Firefox/6.0 Google favicon") || nAgt==("Mediapartners-Google") || nAgt==("Mozilla/5.0 (compatible; yoozBot-2.2; http://yooz.ir; info@yooz.ir)") || nAgt==("hivaBot/hivaBot-1.0 (Iranian Search Engine bot; http://yooz.ir; info@yooz.ir)") || nAgt==("gosquared-thumbnailer/1.0") || nAgt==("GoSquared-Status-Checker/0.2") || nAgt==("WebCookies/1.0 (+http://webcookies.info/faq/#agent)") || nAgt==("HTTP-Header-Abfrage/1.0 (http://www.internalscripts.de/werkzeuge/http-header-abfrage.php)") || nAgt==("Mozilla/5.0 (compatible; SecretSerachEngineLabs.com-SBSearch/0.9; http://www.secretsearchenginelabs.com/secret-web-crawler.php)") || nAgt==("netEstate NE Crawler (+http://www.website-datenbank.de/)") || nAgt==("RSSMicro.com RSS/Atom Feed Robot") || nAgt==("Mozilla/5.0 (compatible; ScoutJet; +http://www.scoutjet.com/)")){
	bot=1;
}
if(nAgt==("Mozilla/5.0 (compatible; MegaIndex.ru/2.0; +http://megaindex.com/crawler)") || nAgt==("crawler4j for XQuery") || nAgt==("Mozilla/5.0 (compatible; Netseer crawler/2.0; +http://www.netseer.com/crawler.html; crawler@netseer.com)") || nAgt==("ZumBot/1.0 (ZUM Search; http://help.zum.com/inquiry)") || nAgt==("Mozilla/5.0 (compatible; Windows NT 6.1?; ZumBot/1.0; http://help.zum.com/inquiry)") || nAgt==("Mozilla/4.0 (compatible; Vagabondo/4.0; webcrawler at wise-guys dot nl; http://webagent.wise-guys.nl/; http://www.wise-guys.nl/)") || nAgt==("Mozilla/4.0 (compatible; Vagabondo/4.0/EU; http://webagent.wise-guys.nl/)") || nAgt==("Wotbox/2.01 (+http://www.wotbox.com/bot/)") || nAgt==("Mozilla/5.0 (compatible; KHTML, like Gecko) Chrome/43.0.2357.81 Safari/537.36 collection@infegy.com") || nAgt==("facebookexternalhit/1.1") || nAgt==("visionutils/0.2") || nAgt==("Mozilla/5.0 (compatible; SpiderLing (a SPIDER for LINGustic research); +http://nlp.fi.muni.cz/projects/biwec/)") || nAgt==("sg-Orbiter/1.0 (+http://searchgears.de/uber-uns/crawling-faq.html)") || nAgt==("Mozilla/5.0 (compatible; Cliqzbot/1.0 +http://cliqz.com/company/cliqzbot)") || nAgt==("thumbshots-de-bot (+http://www.thumbshots.de/)") || nAgt==("Mozilla/5.0 (compatible; Sonic/1.0; http://www.yama.info.waseda.ac.jp/~crawler/info.html)") || nAgt==("Mozilla/5.0 (compatible; oBot/2.3.1; +http://filterdb.iss.net/crawler/)") || nAgt==("NextGenSearchBot 1 (for information visit http://www.zoominfo.com/About/misc/NextGenSearchBot.aspx)") || nAgt==("Nutch/2.2.1 (page scorer; http://integralads.com/site-indexing-policy/)") || nAgt==("SeoCheck (FischerNetzDesign Seo Checker, info@fischernetzdesign.de)") || nAgt==("Mozilla/5.0 (compatible; OrangeBot/2.0; support.orangebot@orange.com)") || nAgt==("Mozilla/5.0 (compatible; Kraken/0.1; http://linkfluence.net/; bot@linkfluence.net)") || nAgt==("ShowyouBot (http://showyou.com/crawler)") || nAgt==("bitlybot/3.0 (+http://bit.ly/)") || nAgt==("R6_CommentReader(www.radian6.com/crawler)") || nAgt==("Mozilla/5.0 (compatible; SEOkicks-Robot; +http://www.seokicks.de/robot.html)") || nAgt==("iskanie (+http://www.iskanie.com)") || nAgt==("Mozilla/4.0 (compatible;HostTracker/2.0;+http://www.host-tracker.com/)") || nAgt==("CommaFeed/2.3.0-SNAPSHOT (https://www.commafeed.com)") || nAgt==("Mozilla/5.0 (compatible; Plukkie/1.5; http://www.botje.com/plukkie.htm)") || nAgt==("Mozilla/5.0 (compatible; LXRbot/1.0;http://www.lxrmarketplace.com/,support@lxrmarketplace.com)") || nAgt==("Mozilla/5.0 (Windows NT 6.3; WOW64; rv:36.0) Gecko/20100101 Firefox/36.0 (NetShelter ContentScan, contact abuse@inpwrd.com for information)") || nAgt==("Mozilla/5.0 (compatible; BuzzSumo; +http://www.buzzsumo.com/bot.html)") || nAgt==("DialogSearch.com Bot 1.4;http://dialogsearch.com/webmasters") || nAgt==("Microsearch.ru Bot 1.3;http://microsearch.ru/webmasters") || nAgt==("Mozilla/5.0 (compatible; Gluten Free Crawler/1.0; +http://glutenfreepleasure.com/)") || nAgt==("Mozilla/5.0 (compatible; Pagespeed/1.1 Fetcher; +http://www.pagespeed.de)") || nAgt==("DNS-Tools Header-Analyzer") || nAgt==("g2reader-bot/1.0 (+http://www.g2reader.com/)") || nAgt==("Mozilla/5.0 (compatible; Apercite; +http://www.apercite.fr/robot/index.html)") || nAgt==("   psbot/0.1 (+http://www.picsearch.com/bot.html)") || nAgt==("EasyBib AutoCite (http://content.easybib.com/autocite/)") || nAgt==("Mozilla/5.0 (compatible; Feedage/2.0; +http://www.feedage.com/bot.php)") || nAgt==("Ruby, link_thumbnailer") || nAgt==("LoadImpactRload/3.1.5 (Load Impact; http://loadimpact.com);") || nAgt==("netEstate Impressumscrawler (+http://www.netestate.de/De/Loesungen/Impressumscrawler)") || nAgt==("iqdb/0.1 (+http://iqdb.org/)") || nAgt==("Mozilla/5.0 (X11; U; Linux i686 (x86_64); en-US; rv:1.9.2.19) Gecko WebThumb/1.0") || nAgt==("Tools4noobs.com/1.0 Spider") || nAgt==("Mozilla/5.0 (compatible; Semager/1.4c; +http://www.semager.de/blog/semager-bots/)") || nAgt==("Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.2.3) SPEng") || nAgt==("Aboundex/0.3 (http://www.aboundex.com/crawler/)") || nAgt==("Mozilla/5.0 (compatible; SurdotlyBot/1.0; +http://sur.ly/bot.html)") || nAgt==("Mozilla/5.0 (compatible; NetcraftSurveyAgent/1.0; +info@netcraft.com)") || nAgt==("GAChecker (+http://www.gachecker.com)") || nAgt==("Photon/1.0") || nAgt==("Mozilla/5.0 (compatible; Webmaster tools +http://sitexy.com/)") || nAgt==("Mozilla/5.0 (TweetmemeBot/4.0; +http://datasift.com/bot.html) Gecko/20100101 Firefox/31.0") || nAgt==("SafeAds.xyz bot") || nAgt==("Mozilla/5.0 (compatible; Googlebot/2.1; https://www.deepcrawl.com/bot)") || nAgt==("Buzzbot/1.0 (Buzzbot; http://www.buzzstream.com; buzzbot@buzzstream.com)") || nAgt==("Mozilla/5.0 (compatible; aiHitBot/2.9; +https://www.aihitdata.com/about)") || nAgt==("Mozilla/5.0 (compatible; NewShareCounts.com/1.0; +http://newsharecounts.com/crawler)") || nAgt==("BCKLINKS 1.0") || nAgt==("Mozilla/5.0 (Linux; Android 4.1.2; Galaxy Nexus Build/JZO54K; GTmetrix http://gtmetrix.com/) AppleWebKit/537.22 (KHTML, like Gecko) Chrome/26.0.1410.58 Mobile Safari/537.22") || nAgt==("Mozilla/5.0 (compatible; special_archiver/3.3.0 +http://www.loc.gov/webarchiving/notice_to_webmasters.html)") || nAgt==("Mozilla/5.0 compatible; yelpspider/yelpspider-1.0 (Crawlerbot run by Yelp Inc; yelpbot at yelp dot com)") || nAgt==("ImageEngine/1.0") || nAgt==("Mozilla/5.0 (X11; Linux x86_64; rv:10.0.12) Gecko/20100101 Firefox/21.0 WordPress.com mShots") || nAgt==("Mozilla/5.0 (compatible; SemrushBot-SI/0.97; +http://www.semrush.com/bot.html)") || nAgt==("ResponseCodeTest/1.1") || nAgt==("KD Bot") || nAgt==("SEOCentro Page Keyword Analyzer v1.2") || nAgt==("Mediatoolkitbot (complaints@mediatoolkit.com)")){
	bot=1;
}
if(nAgt==("Mozilla/5.0 (compatible; FeedBooster; +http://feeds.qsensei.com)") || nAgt==("Readability/740ec9 - http://readability.com/about/") || nAgt==("Mozilla/5.0 (compatible; meanpathbot/1.0; +http://www.meanpath.com/meanpathbot.html)") || nAgt==("Mozilla/5.0 (compatible; heritrix/3.1.1; UniLeipzigASV +http://corpora.informatik.uni-leipzig.de/crawler_faq.html)") || nAgt==("Mozilla/5.0 (Anturis Agent)") || nAgt==("DwnldBot (+http://dwnld.me)") || nAgt==("Seobility (SEO-Check; http://bit.ly/1dJuuzs)") || nAgt==("Mozilla/5.0 (compatible; Scopia Crawler 1.2; +http://www.scopia.co)") || nAgt==("Mozilla/5.0 (X11; compatible; semantic-visions.com crawler; HTTPClient 3.1)") || nAgt==("RSSingBot (http://www.rssing.com)") || nAgt==("linkapediabot (+http://www.linkapedia.com)") || nAgt==("SafeDNS search bot/Nutch-1.9 (https://www.safedns.com/searchbot; support [at] safedns [dot] com)") || nAgt==("LSSRocketCrawler/1.0 LightspeedSystems") || nAgt==("Hatena Antenna/0.5 (http://a.hatena.ne.jp/help)") || nAgt==("Browsershots") || nAgt==("WeSEE_Bot:we_help_monitize_your_site (http://www.wesee.com/bot/)") || nAgt==("Mozilla/5.0 (compatible; parsijoo-bot; +http://www.parsijoo.ir/; ehsanmousa@parsijoo.ir)") || nAgt==("Mozilla/5.0 (compatible; SearchmetricsBot; http://www.searchmetrics.com/en/searchmetrics-bot/)") || nAgt==("vebidoobot") || nAgt==("ImplisenseBot 1.1") || nAgt==("Mozilla/5.0 (compatible; WbSrch/1.1 +http://wbsrch.com)") || nAgt==("Mozilla/5.0 (compatible; YioopBot; +http://173.13.143.74/bot.php)") || nAgt==("RankurBot/3.3 (+http://rankur.com)") || nAgt==("Norton-Safeweb") || nAgt==("AntBot/1.0 (http://www.ant.com)") || nAgt==("drupact/0.7; http://www.arocom.de/drupact") || nAgt==("ThumbSniper (http://thumbsniper.com)") || nAgt==("cuwhois/1.0 (+http://www.cuwhois.com/)") || nAgt==("www.deadlinkchecker.com XMLHTTP/1.0") || nAgt==("Domain Re-Animator Bot (http://domainreanimator.com) - support@domainreanimator.com") || nAgt==("Mozilla/5.0 (compatible; idmarch Automatic.beta/1.3; +http://www.idmarch.org/bot.html)") || nAgt==("gipo-crawler/Nutch-1.10 (Global Internet Policy Observatory crawler)") || nAgt==("adbeat_bot") || nAgt==("Mozilla/5.0 (Windows NT 6.1; WOW64; rv:18.0) Gecko/20100101 Firefox/18.0 AppEngine-Google; (+http://code.google.com/appengine; appid: s~aeshortener)") || nAgt==("Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36 TinEye/1.0 (via http://www.tineye.com/)") || nAgt==("CheckHost (http://check-host.net/)") || nAgt==("Mozilla/5.0 (Windows NT 6.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0 Safari/537.36 YottaaMonitor") || nAgt==("MaxPointCrawler/Nutch-1.10 (maxpoint.crawler at maxpointinteractive dot com)") || nAgt==("Mozilla/5.0 (compatible; Page2RSS/0.7; +http://page2rss.com/)") || nAgt==("Mozilla/5.0 (compatible; LoadTimeBot/0.9; +http://www.loadtime.net/bot.html)") || nAgt==("LongURL API") || nAgt==("ZnajdzFoto/ImageBot 2.0b") || nAgt==("Mozilla/5.0 (compatible; XoviBot/2.0; +http://www.xovibot.net/)") || nAgt==("Mozilla/5.0 (compatible; WebCorp/5.0; +http://www.webcorp.org.uk)") || nAgt==("CopperEgg/RevealUptime/FremontCA(linode)") || nAgt==("Super Monitoring") || nAgt==("Mozilla/5.0 (compatible; woriobot +http://worio.com)") || nAgt==("Mozilla/5.0 (compatible; Online Domain Tools - Online Website Link Checker/1.2; +http://website-link-checker.online-domain-tools.com)") || nAgt==("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.13+ (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2; Shoppimon Analyzer (http://www.shoppimon.com/)") || nAgt==("BUbiNG (+http://law.di.unimi.it/BUbiNG.html)") || nAgt==("Miniflux (http://miniflux.net)") || nAgt==("Bad Neighborhood Header Detector (http://www.bad-neighborhood.com/header_detector.php)") || nAgt==("Mozilla/5.0 (Windows; U; Windows NT 6.0; en-GB; rv:1.0; trendictionbot0.5.0; trendiction search; http://www.trendiction.de/bot; please let us know of any problems; web at trendiction.com) Gecko/20071127 Firefox/3.0.0.11") || nAgt==("2Bone_LinkChecker/1.0 libwww-perl/6.03") || nAgt==("Zemanta Aggregator/0.9 +http://www.zemanta.com") || nAgt==("ipv6-test.com validator") || nAgt==("RankFlex.com Webspider") || nAgt==("Page Analyzer v4.0 ( http://www.ranks.nl/ )") || nAgt==("  seo-nastroj.cz") || nAgt==("NalezenCzBot/1.0 (http://www.nalezen.cz/about-crawler)") || nAgt==("SentiBot www.sentibot.eu (compatible with Googlebot)") || nAgt==("Pinterest/0.2 (+http://www.pinterest.com/)") || nAgt==("Pinterest/0.1 +http://pinterest.com/") || nAgt==("Mozilla/5.0 (compatible; http://alyze.info)") || nAgt==("bot-pge.chlooe.com/1.0.0 (+http://www.chlooe.com/)") || nAgt==("Yoleo Consumer v0.2") || nAgt==("Feedfetcher-Nuesbyte; (+http://www.nuesbyte.com)") || nAgt==("Feedbin") || nAgt==("SiteGuardian/2.0 (Internet Monitoring)") || nAgt==("Mozilla/5.0 (compatible; WormlyBot; +http://wormly.com)") || nAgt==("internetVista monitor (Mozilla compatible)") || nAgt==("Kyoto-Crawler/n1.0 (Mozilla-compatible; kyoto-crawler-contact@nlp.ist.i.kyoto-u.ac.jp; http://nlp.ist.i.kyoto-u.ac.jp/?crawling)") || nAgt==("agentslug.com - website monitoring tool") || nAgt==("Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; www.alertra.com)") || nAgt==("dlvr.it/1.0 (+http://dlvr.it/)") || nAgt==("w3dt.net httphr/2.0") || nAgt==("Mozilla/5.0 (Windows NT 5.1) BrokenLinkCheck.com/1.1") || nAgt==("Web-sniffer/1.1.0 (+http://web-sniffer.net/)") || nAgt==("mozilla/5.0 (compatible; webmastercoffee/0.7; +http://webmastercoffee.com/about)") || nAgt==("dubaiindex (adressendeutschland.de)") || nAgt==("Promotion_Tools_www.searchenginepromotionhelp.com") || nAgt==("NIF/1.1 (http://www.newsisfree.com/robot.php users:)") || nAgt==("Motoricerca-Robots.txt-Checker/1.0 (http://tool.motoricerca.info/robots-checker.phtml)")){
	bot=1;
}
if(nAgt==("Mozilla/5.0 (WhatsMyIP.org Text_to_Code_Ratio_Tool) http://whatsmyip.org/ua") || nAgt==("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36") || nAgt==("Mozilla/5.0 (nomore404.com robot/1.1; +https://nomore404.com/)") || nAgt==("Mozilla/5.0 (compatible; Exploratodo/1.0; +http://www.exploratodo.com") || nAgt==("Mozilla/5.0 (compatible; inoreader.com-like FeedFetcher-Google)") || nAgt==("SauceNAO/1.0 (+http://saucenao.com/)") || nAgt==("ichiro/3.0 (http://search.goo.ne.jp/option/use/sub4/sub4-1/)") || nAgt==("ownCloud News/5.3.6 (+https://owncloud.org/; 1 subscriber;)") || nAgt==("http://arachnode.net 1.4") || nAgt==("Mozilla/5.0 (compatible; Qualidator.com SiteAnalyzer 1.0;)") || nAgt==("Peeplo Screenshot Bot/0.20 ( abuse at peeplo dot_com )") || nAgt==("GIDBot/3.0 (+http://www.gidnetwork.com/tools/gzip-test.php)") || nAgt==("Mozilla/5.0 (compatible; YoudaoBot/1.0; http://www.youdao.com/help/webmaster/spider/; )") || nAgt==("cg-eye interactive") || nAgt==("Page Valet/4.1pre5") || nAgt==("HyperZbozi.cz Feeder/3.1") || nAgt==("Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25 ( compatible; CloudServerMarketSpider/1.0; +http://cloudservermarket.com/spider.html )") || nAgt==("Mozilla/5.0 (compatible; DomainTunoCrawler/0.1; +https://www.domaintuno.com/robot)") || nAgt==("wscheck.com/1.0.0 (+http://wscheck.com/)") || nAgt==("Sitedomain-Bot(Sitedomain-Bot 1.0, http://www.sitedomain.de/sitedomain-bot/)") || nAgt==("Mozilla/5.0 (compatible; SEOdiver/1.0; +http://www.seodiver.com/bot)") || nAgt==("Whoismindbot/1.0 (+http://www.whoismind.com/bot.html)") || nAgt==("Easy-Thumb (https://www.easy-thumb.net/)") || nAgt==("WillyBot/1.1 (http://www.willyfogg.com/info/willybot)") || nAgt==("Fetch/2.0a (CMS Detection/Web/SEO analysis tool, see http://guess.scritch.org)") || nAgt==("Mozilla/5.0 (compatible; Embedly/0.2; +http://support.embed.ly/)") || nAgt==("Iframely/0.8.8 (+http://iframely.com/;)") || nAgt==("Sosospider+(+http://help.soso.com/webspider.htm)") || nAgt==("Mozilla/5.0 (compatible; SiteCondor; http://www.sitecondor.com)") || nAgt==("Mozilla/5.0 (compatible; hypestat/1.0; +http://www.hypestat.com/bot)") || nAgt==("ICC-Crawler/2.0 (Mozilla-compatible; ; http://www.nict.go.jp/en/univ-com/plan/crawl.html)") || nAgt==("PayPal IPN ( https://www.paypal.com/ipn )") || nAgt==("Robots_Tester_http_www.searchenginepromotionhelp.com") || nAgt==("Mozilla/5.0 (compatible; SISTRIX Crawler; http://crawler.sistrix.net/)") || nAgt==("Mozilla/5.0 (compatible; 007ac9 Crawler; http://crawler.007ac9.net/)") || nAgt==("FeedBucket/1.0 (+http://www.feedbucket.com)") || nAgt==("Pingdom.com_bot_version_1.4_(http://www.pingdom.com/)") || nAgt==("ADmantX Platform Semantic Analyzer - ADform - ADmantX Inc. - www.admantx.com - support@admantx.com") || nAgt==("Mozilla/5.0 Moreover/5.1 (+http://www.moreover.com; webmaster@moreover.com)") || nAgt==("XING-contenttabreceiver/2.0") || nAgt==("LinkWalker/3.0 (http://www.brandprotect.com)") || nAgt==("WebTarantula.com Crawler") || nAgt==("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/534.34 (KHTML, like Gecko) Qt/4.8.3 Safari/534.34 https://linkpeek.com") || nAgt==("Mozilla/5.0 (compatible; METASpider; +http://meta.ua/spider)") || nAgt==("Mozilla/5.0 (compatible; Siteliner/1.0; +http://www.siteliner.com/bot)") || nAgt==("Mozilla/5.0 (compatible; Scrubby/3.2; +http://seotools.scrubtheweb.com/webpage-analyzer.html)") || nAgt==("Mozilla/5.0 (Windows NT 6.3;compatible; Leikibot/1.0; +http://www.leiki.com)") || nAgt==("Mozilla/5.0 (compatible; OptimizationCrawler/0.2; +http://www.domainoptima.com/robot)") || nAgt==("HeartRails Robot/0.1 (http://www.heartrails.com)") || nAgt==("websitepulse checker/3.0 (compatible; MSIE 5.5; Netscape 4.75; Linux)") || nAgt==("HubSpot Marketing Grader") || nAgt==("Mozilla/5.0 (compatible; startmebot/1.0; +http://www.start.me/bot)") || nAgt==("it2media-domain-crawler/2.0") || nAgt==("Mozilla/5.0 (compatible; HyperCrawl/0.2; +http://www.seograph.net/bot.html)") || nAgt==("Seo Servis - Analyza zdrojoveho kodu") || nAgt==("LexxeBot/1.0 (lexxebot@lexxe.com)") || nAgt==("Link Valet Online 1.1") || nAgt==("SSL Labs (https://www.ssllabs.com/about/assessment.html)") || nAgt==("Mozilla/4.0 (compatible; MSIE 5.0; Windows NT; Girafabot; girafabot at girafa dot com; http://www.girafa.com)") || nAgt==("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/534.34 (KHTML, like Gecko) Websnapr/3.0 Safari/534.34") || nAgt==("Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.2; WOW64; Trident/6.0; .NET4.0E; .NET4.0C; .NET CLR 3.5.30729; .NET CLR 2.0.50727; .NET CLR 3.0.30729) CrawlerProcess (http://www.PowerMapper.com) /5.9.726.0") || nAgt==("Port Monitor check service 1.0 | http://www.port-monitor.com") || nAgt==("TwengaBot-2.0 Champigny (+http://www.twenga.com/bot.html)") || nAgt==("NerdyBot") || nAgt==("asafaweb.com") || nAgt==("Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.79 Safari/537.4 LinkTiger 2.0") || nAgt==("Scooter/3.3") || nAgt==("UptimeDog Robot (www.uptimedog.com)") || nAgt==("tagSeoBot/1.0 (http://www.tagseoblog.de/tools)") || nAgt==("Mozilla/5.0 (compatible; Arachnophilia/1.0; +http://arachnys.com/)") || nAgt==("PagesInventory (robot http://www.pagesinventory.com)") || nAgt==("Mozilla/5.0 (Windows NT 6.1; WOW64) SkypeUriPreview Preview/0.5") || nAgt==("Backlink-Ceck.de (+http://www.backlink-check.de/bot.html)") || nAgt==("Mozilla/5.0 (compatible; GimmeUSAbot/1.0; +https://gimmeusa.com/pages/crawler)") || nAgt==("Mozilla/5.0 (Windows NT 6.1; compatible; BDCbot/1.0; +http://ecommerce.bigdatacorp.com.br/faq.aspx) ppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36") || nAgt==("Abrave v6.0 (http://robot.abrave.com)") || nAgt==("Mozilla/5.0 (compatible; BegunAdvertising/3.0; +http://begun.ru/begun/technology/indexer/)") || nAgt==("SemanticScholarBot/1.0 (+http://s2.allenai.org/bot.html)") || nAgt==("search.KumKie.com") || nAgt==("Mozilla/5.0 (compatible; Nigma.ru/3.0; crawler@nigma.ru)") || nAgt==("RED/1 (https://redbot.org/)") || nAgt==("Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9.0.19; aggregator:Spinn3r (Spinn3r 3.1); http://spinn3r.com/robot) Gecko/2010040121 Firefox/3.0.19") || nAgt==("Mozilla/5.0 (compatible; DomainSigmaCrawler/0.1; +http://domainsigma.com/robot)") || nAgt==("Mozilla/5.0 (compatible; UnisterBot; http://www.bluekiwi.de/misc/imprint)") || nAgt==("Mozilla/5.0 (compatible; zitebot support [at] zite [dot] com +http://zite.com)") || nAgt==("LivelapBot/0.2 (http://site.livelap.com/crawler)") || nAgt==("Crowsnest/0.5 (+http://www.crowsnest.tv/)") || nAgt==("x28-job-bot; +http://x28.ch/bot.html") || nAgt==("seebot/2.0 (+http://www.seegnify.com/bot)") || nAgt==("Mozilla/5.0 (compatible; SputnikImageBot/2.3; +http://corp.sputnik.ru/webmaster)") || nAgt==("Mozilla/5.0 eCairn-Grabber/1.0 (+http://ecairn.com/grabber)") || nAgt==("Mozilla/5.0 (compatible; EveryoneSocialBot/1.0; support@everyonesocial.com http://everyonesocial.com/)") || nAgt==("Mozilla/5.0 (compatible; DNS-Digger/1.0; +http://www.dnsdigger.com) ") || nAgt==("linguatools-bot/Nutch-1.6 (searching for translated pages; http://www.linguatools.de/linguatoolsbot.html; peter dot kolb at linguatools dot org) ") || nAgt==("SafeSearch microdata crawler (https://safesearch.avira.com, safesearch-abuse@avira.com)") || nAgt==("Kemvibot/1.0 (http://kemvi.com, marco@kemvi.com)") || nAgt==("Mozilla/5.0 (compatible; forensiq; +http://www.forensiq.com)") || nAgt==("fastbot crawler beta 4.0 (+http://www.fastbot.de)") || nAgt==("Mozilla/5.0 (compatible; bnf.fr_bot; +http://www.bnf.fr/fr/outils/a.dl_web_capture_robot.html)") || nAgt==("Mozilla/5.0 (compatible; MSIE or Firefox mutant; not on Windows server;) Daumoa/4.0") || nAgt==("Mozilla/5.0 (compatible; RankSonicSiteAuditor/1.0; +https://ranksonic.com/ranksonic_sab.html)") || nAgt==("Mozilla/5.0 (compatible; Pro Sitemaps Generator; https://pro-sitemaps.com) Gecko Pro-Sitemaps/1.0") || nAgt==("Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)") || nAgt==("Mozilla/5.0 (compatible; ProductoDownloadUrlBot/1.0; +http://www.producto.de/)") || nAgt==("ExactSeekCrawler/1.0") || nAgt==("Curious George - www.analyticsseo.com/crawler") || nAgt==("Mozilla/5.0 (compatible; CloudFlare-AlwaysOnline/1.0; +http://www.cloudflare.com/always-online) AppleWebKit/534.34") || nAgt==("woobot/1.1") || nAgt==("RavenCrawler") || nAgt==("SiteUptime.com") || nAgt==("StackRambler/2.0 (MSIE incompatible)") || nAgt==("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11 KimonoLabs/0.2") || nAgt==("Mozilla/5.0 (compatible; Web-Monitoring/1.0; +http://monoid.nic.ru/)") || nAgt==("Mozilla/5.0 (compatible; DuckDuckGo-Favicons-Bot/1.0; +http://duckduckgo.com)") || nAgt==("Mozilla/5.0 (compatible; uMBot-FC/1.0; mailto: crawling@ubermetrics-technologies.com)") || nAgt==("LinkedInBot/1.0 (compatible; Mozilla/5.0; Jakarta Commons-HttpClient/3.1 +http://www.linkedin.com)") || nAgt==("Mozilla/5.0 (compatible; Wappalyzer; +https://github.com/AliasIO/Wappalyzer)") || nAgt==("Mozilla/4.0 (CMS Crawler: http://www.cmscrawler.com)") || nAgt==("Mozilla/5.0 (compatible; vkShare; +http://vk.com/dev/Share)") || nAgt==("Mozilla/5.0 (compatible; ExpertSearchSpider +http://www.expertsearch.nl/spider)") || nAgt==("BDFetch") || nAgt==("Mozilla/5.0 (X11; U; Linux i686; de; rv:1.9.0.1; compatible; iCjobs Stellenangebote Jobs; http://www.icjobs.de) Gecko/20100401 iCjobs/3.2.3") || nAgt==("Speedy Spider (http://www.entireweb.com)") || nAgt==("Mozilla/5.0 (compatible; houzzbot; +http://www.houzz.com/)") || nAgt==("Mozilla/5.0+(compatible;+PiplBot;++http://www.pipl.com/bot/)") || nAgt==("Superarama.com-Tarama-Botu-v.01") || nAgt==("pr-cy.ru Screenshot Bot") || nAgt==("Mozilla/5.0 (compatible; pmoz.info ODP link checker; +http://pmoz.info/doc/botinfo.htm)") || nAgt==("Mozilla/5.0 (compatible; WeViKaBot/1.0; +http://www.wevika.de/)") || nAgt==("AddThis.com robot tech.support@clearspring.com") || nAgt==("datagnionbot (+http://www.datagnion.com/bot.html)") || nAgt==("Mozilla/5.0 (compatible; musobot/1.0; info@muso.com; +http://www.muso.com)") || nAgt==("Crawler powered by contentDetection (www.mindup.de)") || nAgt==("stq_bot (+http://www.searchteq.de)") || nAgt==("Vorboss Web Crawler [crawl@vorboss.net]/Nutch-2.3") || nAgt==("Mozilla/5.0 (compatible; CukBot; Not a spammer; http://www.companiesintheuk.co.uk/bot.html)") || nAgt==("Mozilla/5.0 (compatible; EuripBot/2.0; +http://www.eurip.com)") || nAgt==("CoinCornerBot/1.1 ( https://www.coincorner.com/BitcoinBot)") || nAgt==("Willow Internet Crawler by Twotrees V2.1") || nAgt==("ScreenerBot Crawler Beta 2.0 (+http://www.ScreenerBot.com)") || nAgt==("Mozilla/5.0 (compatible;WI Job Roboter Spider Version 3;+http://www.webintegration.at)") || nAgt==("Mozilla/5.0 (compatible; LA1; +http://www.zeerch.com/bot.php)") || nAgt==("hawkReader/1.8 (Link Parser; http://www.hawkreader.com/; Allow like Gecko) Build/f2b2566") || nAgt==("Mozilla/5.0 (compatible; LinkMarketbot/1.2; +http://www.linkmarket.com/)") || nAgt==("Mozilla/5.0 (compatible; dlcbot/0.1; +http://www.drlinkcheck.com/)") || nAgt==("Mozilla/5.0 (compatible; alexa site audit/1.0; +http://www.alexa.com/help/webmasters; no-reply@alexa.com)") || nAgt==("Mozilla/5.0 (compatible; EasouSpider; +http://www.easou.com/search/spider.html)") || nAgt==("Scrapy/0.25.1 (+http://scrapy.org)") || nAgt==("Experibot_v1 (https://dl.dropboxusercontent.com/u/8024465/site/Info.html)") || nAgt==("Mozilla/5.0 (compatible; Thumbshots.ru; +http://thumbshots.ru/bot) Firefox/3") || nAgt==("WorldBrewBot/2.1 (+http://www.marketbrew.com/)") || nAgt==("Mozilla/5.0 (compatible; memoryBot/1.21.14 +http://mignify.com/bot.html)") || nAgt==("Mozilla/5.0 (compatible; NLNZ_IAHarvester2014 +https://natlib.govt.nz/publishers-and-authors/web-harvesting/domain-harvest)") || nAgt==("Mozilla/5.0 (Windows NT 6.2; WOW64) Runet-Research-Crawler (itrack.ru/research/cmsrate; rating@itrack.ru)") || nAgt==("MnoGoSearch/3.3.12") || nAgt==("AboutUsBot/Harpy (Website Analysis; http://www.aboutus.org/Aboutus:Bot; help@aboutus.org)") || nAgt==("Mozilla/5.0 (compatible; JobdiggerSpider +http://www.jobdigger.nl/spider)") || nAgt==("Mozilla/5.0 (compatible; IstellaBot/1.18.81 +http://www.tiscali.it/)") || nAgt==("Mozilla/5.0 (compatible; sukibot_heritrix/3.1.1 +http://suki.ling.helsinki.fi/eng/webmasters.html)") || nAgt==("Mozilla/5.0 (compatible; ltbot/3.2.0.10 +http://www.kdsl.tu-darmstadt.de/de/kdsl/research-program/crawling-and-semantic-structuring/)") || nAgt==("Mozilla/5.0 (compatible; pub-crawler; +http://wiki.github.com/bixo/bixo/bixocrawler; bixo-dev@yahoogroups.com)") || nAgt==("OpenWebSpider v0.1.4 (http://www.openwebspider.org/)")){
    bot=1;
}

/*
var txt = '';
var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function(){
  //if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
    txt = xmlhttp.responseText;
 // }
};
xmlhttp.open("GET","http://localhost:8000/text.txt",true);
xmlhttp.send();

document.write(''
 +'browser  = '+txt+'<br>'
 
)

function reqListener () {
  console.log(this.responseText);
}

var oReq = new XMLHttpRequest();
oReq.onload = reqListener;
oReq.open("get", "text.txt", true);
oReq.send();
document.write(''
 +'browser <br>'
 
)
*/
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

    if (this.logEventCount == 0) {
        var time = new Date();
        visitorProperty = visitorProperties(new Date().getTime(), 'size', screen.width, screen.height, $(window).width(), $(window).height(), $(document).width(), $(document).height(), screen.colorDepth, time.getTimezoneOffset(), browserName, fullVersion, majorVersion, navigator.appName, cookie, language, platform, comesFrom, bot, device);
    }

    var coordinates = transferCoordinatesForHeatMap(ev);
    if (ev.type == 'click') {
        var coordinates = transferCoordinatesForHeatMap(ev);
        this.sendLog(new Date().getTime(), ev.type, ev.clientX, ev.clientY, coordinates[0], coordinates[1], ev.target.localName);
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
    var heatMapX = "";
    var heatMapY = "";

    if (args.length > 6){
        targetName = args[6];
    }

    if (args.length > 4){
        heatMapX = args[4];
        heatMapY = args[5];
    }

    var data = {
        "datetime" : args[0],
        "eventtype" : args[1],
        "corx": args[2],
        "cory" : args[3],
        "heatMapX": heatMapX,
        "heatMapY": heatMapY,
        "targetName" : targetName
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
        "platform" : "",
		"comes_from" : "",
        "bot" : "",
        "device"  : "",
		"api_key" : ""

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
    data.comes_from = arguments[17];
    data.bot = arguments[18];
    data.device = arguments[19];

    data.api_key = document.getElementById("logger").getAttribute("api_key");

    return JSON.stringify(data);
}

X.prototype.argsToMsgText = function (args) {
    var text = "";
    var event = "";
    var coordinates = transferCoordinatesForHeatMap(event);

    if (args.length > 1){
        event = args[1];
    }

    for (var i = 0; i < args.length - 1; i++)
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
        '"page":' + '"' + document.URL + '"},' +
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
