var periodicallySendData = true;
var useSendBeacon = true;
var useExternalServerScript = true;
var externalServerScriptUrl = "http://147.175.149.195:443/logger";
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
if(nAgt==("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" || "Feedly/1.0 (+http://www.feedly.com/fetcher.html; like FeedFetcher-Google)" || "downnotifier.com monitoring" || "Irokez.cz monitoring v1.2 - (http://www.irokez.cz, Irokez.cz, crawl)" || "Feedly/1.0 (+http://www.feedly.com/fetcher.html; like FeedFetcher-Google)" || "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11 GotSiteMonitor.com" || "Inspingbot/1.0 (+https://www.insping.com/)" || "Server Density Service Monitoring v2" || "Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)" || "PINGOMETER_BOT_(HTTPS://PINGOMETER.COM)" || "ServiceUptime.robot" || "Mozilla/5.0 (compatible; MJ12bot/v1.4.5; http://www.majestic12.co.uk/bot.php?+)" || "Mozilla/5.0+(compatible; UptimeRobot/2.0; http://www.uptimerobot.com/)" || "Mozilla/5.0 (compatible; DotBot/1.1; http://www.opensiteexplorer.org/dotbot, help@moz.com)" || "Mozilla/5.0+(compatible; Monitority/1.0; http://www.monitority.com/)" || "omgilibot/0.4 +http://omgili.com" || "Mozilla/5.0 (compatible; FlipboardRSS/1.1; +http://flipboard.com/browserproxy)" || "FreeWebMonitoring SiteChecker/0.2 (+http://www.freewebmonitoring.com/bot.html)" || "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)" || "Mozilla/5.0 (compatible; www.monitor.us - free monitoring service; http://www.monitor.us)" || "CCBot/2.0 (http://commoncrawl.org/faq/)" || "Mozilla/5.0 (compatible; PaperLiBot/2.1; http://support.paper.li/entries/20023257-what-is-paper-li)" || "Mozilla/5.0 (compatible; AhrefsBot/5.0; +http://ahrefs.com/robot/)" || "Sogou web spider/4.0(+http://www.sogou.com/docs/help/webmasters.htm#07)" || "Pingoscope" || "Mozilla/5.0 (compatible; linkdexbot/2.0; +http://www.linkdex.com/bots/)" || "Mozilla/5.0 (compatible; Exabot/3.0; +http://www.exabot.com/go/robot)" || "Site24x7" || "montastic-monitor http://www.montastic.com" || "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)" || "rogerbot/1.0 (http://www.moz.com/dp/rogerbot, rogerbot-crawler@moz.com)" || "Mozilla/5.0 (compatible; DeuSu/5.0.2; +https://deusu.de/robot.html)" || "Mozilla/5.0 (compatible; coccoc/1.0; +http://help.coccoc.com/)" || "Mozilla/5.0 (compatible; MetaJobBot; http://www.metajob.at/crawler)" || "Riddler (http://riddler.io/about)" || "Mozilla/5.0 (compatible; Feedspotbot/1.0; +http://www.feedspot.com/fs/bot)" || "Mozilla/5.0 (compatible; BLEXBot/1.0; +http://webmeup-crawler.com/)" || "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" || "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; http://www.changedetection.com/bot.html )" || "panscient.com" || "TurnitinBot (https://turnitin.com/robot/crawlerinfo.html)" || "Mozilla/5.0 (compatible; theoldreader.com)" || "Woko robot 3.0" || "Mozilla/5.0 (compatible; Genieo/1.0 http://www.genieo.com/webfilter.html)" || "BacklinkCrawler (http://www.backlinktest.com/crawler.html)" || "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0); 360Spider(compatible; HaosouSpider; http://www.haosou.com/help/help_3_2.html)" || "Mozilla/5.0 (compatible; GroupHigh/1.0; +http://www.grouphigh.com/)" || "Mozilla/5.0 (compatible; spbot/4.4.2; +http://OpenLinkProfiler.org/bot )" || "mindUpBot (datenbutler.de)" || "Mozilla/5.0 (compatible; Qwantify/2.1w; +https://www.qwant.com/)/*" || "Mozilla/5.0 (compatible; SeznamBot/3.2-test4; +http://fulltext.sblog.cz/)" || "Mozilla/5.0 (compatible; Lipperhey-Kaus-Australis/5.0; +https://www.lipperhey.com/en/about/)" || "404 Checker [http://www.404checker.com/user-agent]" || "Mozilla/5.0 (compatible; UASlinkChecker/2.1; +https://udger.com/support/UASlinkChecker)" || "LinqiaScrapeBot/1.0 (eng@linqia.com)" || "Mozilla/5.0 (compatible; SEOlyticsCrawler/3.0; +http://crawler.seolytics.net/)" || "Testomatobot/1.0 (Linux x86_64; +http://www.testomato.com/testomatobot) minicrawler/3.0.1" || "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/98 Safari/537.4 (StatusCake)" || "Mozilla/5.0 (compatible; WBSearchBot/1.1; +http://www.warebay.com/bot.html)" || "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.6) Gecko/20070725 Firefox/2.0.0.6 - James BOT - WebCrawler http://cognitiveseo.com/bot.html" || "Mozilla/5.0 (compatible; proximic; +http://www.proximic.com/info/spider.php)" || "MXT/Nutch-1.10 (http://t.co/GSRLLKex24; informatique at mixdata dot com)" || "Mozilla/5.0 (compatible; Linux x86_64; Mail.RU_Bot/2.0; +http://go.mail.ru/help/robots)" || "Mozilla/5.0 (compatible; TWMBot/0.1; +http://thewebminer.com)" || "Googlebot (gocrawl v0.4)" || "Mozilla/5.0 (compatible; MojeekBot/0.6; +https://www.mojeek.com/bot.html)" || "Mozilla/5.0 (Windows NT 6.1) (compatible; SMTBot/1.0; +http://www.similartech.com/smtbot)" || "Mergadobot/3.0.2 (+http://mergado.cz)" || "aboutthedomain" || "Mozilla/5.0 (compatible; archive.org_bot; Wayback Machine Live Record; +http://archive.org/details/archive.org_bot)" || "Online Virus Scanner: http://tools.geek-tools.org" || "http://tools.geek-tools.org/link-counter/" || "Visited by http://tools.geek-tools.org" || "Mozilla/5.0 (Windows; U; MSIE 9.0; Windows NT 9.0; en-US) AppEngine-Google; (+http://code.google.com/appengine; appid: s~virustotalcloud)" || "bl.uk_lddc_bot/3.3.0-SNAPSHOT-2014-10-07T09:33:31Z (+http://www.bl.uk/aboutus/legaldeposit/websites/websites/faqswebmaster/index.html)" || "CSS Certificate Spider (http://www.css-security.com/certificatespider/)" || "Mozilla/5.0 (Windows; U; Windows NT 5.1; en; rv:1.9.0.13) Gecko/2009073022 Firefox/3.5.2 (.NET CLR 3.5.30729) SurveyBot/2.3 (DomainTools)" || "Mozilla/5.0 (compatible; Yeti/1.1; +http://help.naver.com/robots/)" || "yacybot (/global; amd64 Linux 4.3.0-gentoo-ARCH; java 1.7.0_85; Europe/en) http://yacy.net/bot.html" || "Mozilla/5.0 (compatible; Steeler/3.5; http://www.tkl.iis.u-tokyo.ac.jp/~crawler/)" || "Comodo SSL Checker" || "GetintentCrawler getintent.com" || "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/600.2.5 (KHTML, like Gecko) Version/8.0.2 Safari/600.2.5 (Applebot/0.1; +http://www.apple.com/go/applebot)" || "Mozilla/5.0 (iPhone; CPU iPhone OS 8_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4 (Applebot/0.1; +http://www.apple.com/go/applebot)" || "Mozilla/5.0 (compatible; Applebot/0.3; +http://www.apple.com/go/applebot)" || "Mozilla/5.0 (compatible; DomainAppender /1.0; +http://www.profound.net/domainappender)" || "Mozilla/5.0 (compatible; kulturarw3 +http://www.kb.se/om/projekt/Svenska-webbsidor---Kulturarw3/)" || "FeedCatBot/3.0 (+http://www.feedcat.net/)" || "GigablastOpenSource/1.0" || "Mozilla/5.0 (compatible; online-webceo-bot/1.0; +http://online.webceo.com)" || "Mozilla/5.0 (compatible; GrapeshotCrawler/2.0; +http://www.grapeshot.co.uk/crawler.php)" || "voltron" || "Jyxobot/1" || "Mozilla/5.0 (compatible; PrivacyAwareBot/1.1; +http://www.privacyaware.org)" || "SimplyFast.info Headers" || "Mozilla/5.0 (iPhone; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12F70 Safari/600.1.4 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" || "Mozilla/5.0 (Windows; U; Windows NT 5.1; de; rv:1.9.0.7; Google-SearchByImage) Gecko/2009021910 Firefox/3.0.7" || "Mozilla/5.0 (Windows; U; Windows NT 5.1; de; rv:1.9.0.7; Google-SearchByImage) Gecko/2009021910 Firefox/3.0.7" || "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko; Google Page Speed Insights) Chrome/27.0.1453 Safari/537.36" || "Mozilla/5.0 (compatible; Google-Structured-Data-Testing-Tool +http://developers.google.com/structured-data/testing-tool/)" || "Mozilla/5.0 (Linux; Android 4.2.1; en-us; Nexus 5 Build/JOP40D) AppleWebKit/535.19 (KHTML, like Gecko; googleweblight) Chrome/38.0.1025.166 Mobile Safari/535.19" || "Googlebot/2.1 (+http://www.google.com/bot.html)" || "Google favicon" || "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko; Google Web Preview) Chrome/27.0.1453 Safari/537.36" || "Mozilla/5.0 (en-us) AppleWebKit/537.36 (KHTML, like Gecko; Google PP Default) Chrome/27.0.1453 Safari/537.36" || "Mozilla/5.0 (iPhone; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko; Google Page Speed Insights) Version/8.0 Mobile/12F70 Safari/600.1.4" || "Mozilla/5.0 (iPhone; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/8.0 Mobile/12F70 Safari/600.1.4 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" || "Mozilla/5.0 (iPhone; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/8.0 Mobile/12F70 Safari/600.1.4 (compatible; Google Search Console)" || "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko; Google Search Console) Chrome/27.0.1453 Safari/537.36" || "Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" || "Mozilla/5.0 (iPhone; CPU iPhone OS 6_0_1 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko; Google Page Speed Insights) Version/6.0 Mobile/10A525 Safari/8536.25" || "Googlebot-Image/1.0" || "Mozilla/5.0 (Windows NT 6.1; rv:6.0) Gecko/20110814 Firefox/6.0 Google favicon" || "Mediapartners-Google" || "Mozilla/5.0 (compatible; yoozBot-2.2; http://yooz.ir; info@yooz.ir)" || "hivaBot/hivaBot-1.0 (Iranian Search Engine bot; http://yooz.ir; info@yooz.ir)" || "gosquared-thumbnailer/1.0" || "GoSquared-Status-Checker/0.2" || "WebCookies/1.0 (+http://webcookies.info/faq/#agent)" || "HTTP-Header-Abfrage/1.0 (http://www.internalscripts.de/werkzeuge/http-header-abfrage.php)" || "Mozilla/5.0 (compatible; SecretSerachEngineLabs.com-SBSearch/0.9; http://www.secretsearchenginelabs.com/secret-web-crawler.php)" || "netEstate NE Crawler (+http://www.website-datenbank.de/)" || "RSSMicro.com RSS/Atom Feed Robot" || "Mozilla/5.0 (compatible; ScoutJet; +http://www.scoutjet.com/)" || "Mozilla/5.0 (compatible; MegaIndex.ru/2.0; +http://megaindex.com/crawler)" || "crawler4j for XQuery" || "Mozilla/5.0 (compatible; Netseer crawler/2.0; +http://www.netseer.com/crawler.html; crawler@netseer.com)" || "ZumBot/1.0 (ZUM Search; http://help.zum.com/inquiry)" || "Mozilla/5.0 (compatible; Windows NT 6.1?; ZumBot/1.0; http://help.zum.com/inquiry)" || "Mozilla/4.0 (compatible; Vagabondo/4.0; webcrawler at wise-guys dot nl; http://webagent.wise-guys.nl/; http://www.wise-guys.nl/)" || "Mozilla/4.0 (compatible; Vagabondo/4.0/EU; http://webagent.wise-guys.nl/)" || "Wotbox/2.01 (+http://www.wotbox.com/bot/)" || "Mozilla/5.0 (compatible; KHTML, like Gecko) Chrome/43.0.2357.81 Safari/537.36 collection@infegy.com" || "facebookexternalhit/1.1" || "visionutils/0.2" || "Mozilla/5.0 (compatible; SpiderLing (a SPIDER for LINGustic research); +http://nlp.fi.muni.cz/projects/biwec/)" || "sg-Orbiter/1.0 (+http://searchgears.de/uber-uns/crawling-faq.html)" || "Mozilla/5.0 (compatible; Cliqzbot/1.0 +http://cliqz.com/company/cliqzbot)" || "thumbshots-de-bot (+http://www.thumbshots.de/)" || "Mozilla/5.0 (compatible; Sonic/1.0; http://www.yama.info.waseda.ac.jp/~crawler/info.html)" || "Mozilla/5.0 (compatible; oBot/2.3.1; +http://filterdb.iss.net/crawler/)" || "NextGenSearchBot 1 (for information visit http://www.zoominfo.com/About/misc/NextGenSearchBot.aspx)" || "Nutch/2.2.1 (page scorer; http://integralads.com/site-indexing-policy/)" || "SeoCheck (FischerNetzDesign Seo Checker, info@fischernetzdesign.de)" || "Mozilla/5.0 (compatible; OrangeBot/2.0; support.orangebot@orange.com)" || "Mozilla/5.0 (compatible; Kraken/0.1; http://linkfluence.net/; bot@linkfluence.net)" || "ShowyouBot (http://showyou.com/crawler)" || "bitlybot/3.0 (+http://bit.ly/)" || "R6_CommentReader(www.radian6.com/crawler)" || "Mozilla/5.0 (compatible; SEOkicks-Robot; +http://www.seokicks.de/robot.html)" || "iskanie (+http://www.iskanie.com)" || "Mozilla/4.0 (compatible;HostTracker/2.0;+http://www.host-tracker.com/)" || "CommaFeed/2.3.0-SNAPSHOT (https://www.commafeed.com)" || "Mozilla/5.0 (compatible; Plukkie/1.5; http://www.botje.com/plukkie.htm)" || "Mozilla/5.0 (compatible; LXRbot/1.0;http://www.lxrmarketplace.com/,support@lxrmarketplace.com)" || "Mozilla/5.0 (Windows NT 6.3; WOW64; rv:36.0) Gecko/20100101 Firefox/36.0 (NetShelter ContentScan, contact abuse@inpwrd.com for information)" || "Mozilla/5.0 (compatible; BuzzSumo; +http://www.buzzsumo.com/bot.html)" || "DialogSearch.com Bot 1.4;http://dialogsearch.com/webmasters" || "Microsearch.ru Bot 1.3;http://microsearch.ru/webmasters" || "Mozilla/5.0 (compatible; Gluten Free Crawler/1.0; +http://glutenfreepleasure.com/)" || "Mozilla/5.0 (compatible; Pagespeed/1.1 Fetcher; +http://www.pagespeed.de)" || "DNS-Tools Header-Analyzer" || "g2reader-bot/1.0 (+http://www.g2reader.com/)" || "Mozilla/5.0 (compatible; Apercite; +http://www.apercite.fr/robot/index.html)" || "   psbot/0.1 (+http://www.picsearch.com/bot.html)" || "EasyBib AutoCite (http://content.easybib.com/autocite/)" || "Mozilla/5.0 (compatible; Feedage/2.0; +http://www.feedage.com/bot.php)" || "Ruby, link_thumbnailer" || "LoadImpactRload/3.1.5 (Load Impact; http://loadimpact.com);" || "netEstate Impressumscrawler (+http://www.netestate.de/De/Loesungen/Impressumscrawler)" || "iqdb/0.1 (+http://iqdb.org/)" || "Mozilla/5.0 (X11; U; Linux i686 (x86_64); en-US; rv:1.9.2.19) Gecko WebThumb/1.0" || "Tools4noobs.com/1.0 Spider" || "Mozilla/5.0 (compatible; Semager/1.4c; +http://www.semager.de/blog/semager-bots/)" || "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.2.3) SPEng" || "Aboundex/0.3 (http://www.aboundex.com/crawler/)" || "Mozilla/5.0 (compatible; SurdotlyBot/1.0; +http://sur.ly/bot.html)" || "Mozilla/5.0 (compatible; NetcraftSurveyAgent/1.0; +info@netcraft.com)" || "GAChecker (+http://www.gachecker.com)" || "Photon/1.0" || "Mozilla/5.0 (compatible; Webmaster tools +http://sitexy.com/)" || "Mozilla/5.0 (TweetmemeBot/4.0; +http://datasift.com/bot.html) Gecko/20100101 Firefox/31.0" || "SafeAds.xyz bot" || "Mozilla/5.0 (compatible; Googlebot/2.1; https://www.deepcrawl.com/bot)" || "Buzzbot/1.0 (Buzzbot; http://www.buzzstream.com; buzzbot@buzzstream.com)" || "Mozilla/5.0 (compatible; aiHitBot/2.9; +https://www.aihitdata.com/about)" || "Mozilla/5.0 (compatible; NewShareCounts.com/1.0; +http://newsharecounts.com/crawler)" || "BCKLINKS 1.0" || "Mozilla/5.0 (Linux; Android 4.1.2; Galaxy Nexus Build/JZO54K; GTmetrix http://gtmetrix.com/) AppleWebKit/537.22 (KHTML, like Gecko) Chrome/26.0.1410.58 Mobile Safari/537.22" || "Mozilla/5.0 (compatible; special_archiver/3.3.0 +http://www.loc.gov/webarchiving/notice_to_webmasters.html)" || "Mozilla/5.0 compatible; yelpspider/yelpspider-1.0 (Crawlerbot run by Yelp Inc; yelpbot at yelp dot com)" || "ImageEngine/1.0" || "Mozilla/5.0 (X11; Linux x86_64; rv:10.0.12) Gecko/20100101 Firefox/21.0 WordPress.com mShots" || "Mozilla/5.0 (compatible; SemrushBot-SI/0.97; +http://www.semrush.com/bot.html)" || "ResponseCodeTest/1.1" || "KD Bot" || "SEOCentro Page Keyword Analyzer v1.2" || "Mediatoolkitbot (complaints@mediatoolkit.com)" || "Mozilla/5.0 (compatible; FeedBooster; +http://feeds.qsensei.com)" || "Readability/740ec9 - http://readability.com/about/" || "Mozilla/5.0 (compatible; meanpathbot/1.0; +http://www.meanpath.com/meanpathbot.html)" || "Mozilla/5.0 (compatible; heritrix/3.1.1; UniLeipzigASV +http://corpora.informatik.uni-leipzig.de/crawler_faq.html)" || "Mozilla/5.0 (Anturis Agent)" || "DwnldBot (+http://dwnld.me)" || "Seobility (SEO-Check; http://bit.ly/1dJuuzs)" || "Mozilla/5.0 (compatible; Scopia Crawler 1.2; +http://www.scopia.co)" || "Mozilla/5.0 (X11; compatible; semantic-visions.com crawler; HTTPClient 3.1)" || "RSSingBot (http://www.rssing.com)" || "linkapediabot (+http://www.linkapedia.com)" || "SafeDNS search bot/Nutch-1.9 (https://www.safedns.com/searchbot; support [at] safedns [dot] com)" || "LSSRocketCrawler/1.0 LightspeedSystems" || "Hatena Antenna/0.5 (http://a.hatena.ne.jp/help)" || "Browsershots" || "WeSEE_Bot:we_help_monitize_your_site (http://www.wesee.com/bot/)" || "Mozilla/5.0 (compatible; parsijoo-bot; +http://www.parsijoo.ir/; ehsanmousa@parsijoo.ir)" || "Mozilla/5.0 (compatible; SearchmetricsBot; http://www.searchmetrics.com/en/searchmetrics-bot/)" || "vebidoobot" || "ImplisenseBot 1.1" || "Mozilla/5.0 (compatible; WbSrch/1.1 +http://wbsrch.com)" || "Mozilla/5.0 (compatible; YioopBot; +http://173.13.143.74/bot.php)" || "RankurBot/3.3 (+http://rankur.com)" || "Norton-Safeweb" || "AntBot/1.0 (http://www.ant.com)" || "drupact/0.7; http://www.arocom.de/drupact" || "ThumbSniper (http://thumbsniper.com)" || "cuwhois/1.0 (+http://www.cuwhois.com/)" || "www.deadlinkchecker.com XMLHTTP/1.0" || "Domain Re-Animator Bot (http://domainreanimator.com) - support@domainreanimator.com" || "Mozilla/5.0 (compatible; idmarch Automatic.beta/1.3; +http://www.idmarch.org/bot.html)" || "gipo-crawler/Nutch-1.10 (Global Internet Policy Observatory crawler)" || "adbeat_bot" || "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:18.0) Gecko/20100101 Firefox/18.0 AppEngine-Google; (+http://code.google.com/appengine; appid: s~aeshortener)" || "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36 TinEye/1.0 (via http://www.tineye.com/)" || "CheckHost (http://check-host.net/)" || "Mozilla/5.0 (Windows NT 6.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0 Safari/537.36 YottaaMonitor" || "MaxPointCrawler/Nutch-1.10 (maxpoint.crawler at maxpointinteractive dot com)" || "Mozilla/5.0 (compatible; Page2RSS/0.7; +http://page2rss.com/)" || "Mozilla/5.0 (compatible; LoadTimeBot/0.9; +http://www.loadtime.net/bot.html)" || "LongURL API" || "ZnajdzFoto/ImageBot 2.0b" || "Mozilla/5.0 (compatible; XoviBot/2.0; +http://www.xovibot.net/)" || "Mozilla/5.0 (compatible; WebCorp/5.0; +http://www.webcorp.org.uk)" || "CopperEgg/RevealUptime/FremontCA(linode)" || "Super Monitoring" || "Mozilla/5.0 (compatible; woriobot +http://worio.com)" || "Mozilla/5.0 (compatible; Online Domain Tools - Online Website Link Checker/1.2; +http://website-link-checker.online-domain-tools.com)" || "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.13+ (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2; Shoppimon Analyzer (http://www.shoppimon.com/)" || "BUbiNG (+http://law.di.unimi.it/BUbiNG.html)" || "Miniflux (http://miniflux.net)" || "Bad Neighborhood Header Detector (http://www.bad-neighborhood.com/header_detector.php)" || "Mozilla/5.0 (Windows; U; Windows NT 6.0; en-GB; rv:1.0; trendictionbot0.5.0; trendiction search; http://www.trendiction.de/bot; please let us know of any problems; web at trendiction.com) Gecko/20071127 Firefox/3.0.0.11" || "2Bone_LinkChecker/1.0 libwww-perl/6.03" || "Zemanta Aggregator/0.9 +http://www.zemanta.com" || "ipv6-test.com validator" || "RankFlex.com Webspider" || "Page Analyzer v4.0 ( http://www.ranks.nl/ )" || "  seo-nastroj.cz" || "NalezenCzBot/1.0 (http://www.nalezen.cz/about-crawler)" || "SentiBot www.sentibot.eu (compatible with Googlebot)" || "Pinterest/0.2 (+http://www.pinterest.com/)" || "Pinterest/0.1 +http://pinterest.com/" || "Mozilla/5.0 (compatible; http://alyze.info)" || "bot-pge.chlooe.com/1.0.0 (+http://www.chlooe.com/)" || "Yoleo Consumer v0.2" || "Feedfetcher-Nuesbyte; (+http://www.nuesbyte.com)" || "Feedbin" || "SiteGuardian/2.0 (Internet Monitoring)" || "Mozilla/5.0 (compatible; WormlyBot; +http://wormly.com)" || "internetVista monitor (Mozilla compatible)" || "Kyoto-Crawler/n1.0 (Mozilla-compatible; kyoto-crawler-contact@nlp.ist.i.kyoto-u.ac.jp; http://nlp.ist.i.kyoto-u.ac.jp/?crawling)" || "agentslug.com - website monitoring tool" || "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; www.alertra.com)" || "dlvr.it/1.0 (+http://dlvr.it/)" || "w3dt.net httphr/2.0" || "Mozilla/5.0 (Windows NT 5.1) BrokenLinkCheck.com/1.1" || "Web-sniffer/1.1.0 (+http://web-sniffer.net/)" || "mozilla/5.0 (compatible; webmastercoffee/0.7; +http://webmastercoffee.com/about)" || "dubaiindex (adressendeutschland.de)" || "Promotion_Tools_www.searchenginepromotionhelp.com" || "NIF/1.1 (http://www.newsisfree.com/robot.php users:)" || "Motoricerca-Robots.txt-Checker/1.0 (http://tool.motoricerca.info/robots-checker.phtml)" || "Mozilla/5.0 (WhatsMyIP.org Text_to_Code_Ratio_Tool) http://whatsmyip.org/ua" || "Mozilla/5.0 (nomore404.com robot/1.1; +https://nomore404.com/)" || "Mozilla/5.0 (compatible; Exploratodo/1.0; +http://www.exploratodo.com" || "Mozilla/5.0 (compatible; inoreader.com-like FeedFetcher-Google)" || "SauceNAO/1.0 (+http://saucenao.com/)" || "ichiro/3.0 (http://search.goo.ne.jp/option/use/sub4/sub4-1/)" || "ownCloud News/5.3.6 (+https://owncloud.org/; 1 subscriber;)" || "http://arachnode.net 1.4" || "Mozilla/5.0 (compatible; Qualidator.com SiteAnalyzer 1.0;)" || "Peeplo Screenshot Bot/0.20 ( abuse at peeplo dot_com )" || "GIDBot/3.0 (+http://www.gidnetwork.com/tools/gzip-test.php)" || "Mozilla/5.0 (compatible; YoudaoBot/1.0; http://www.youdao.com/help/webmaster/spider/; )" || "cg-eye interactive" || "Page Valet/4.1pre5" || "HyperZbozi.cz Feeder/3.1" || "Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25 ( compatible; CloudServerMarketSpider/1.0; +http://cloudservermarket.com/spider.html )" || "Mozilla/5.0 (compatible; DomainTunoCrawler/0.1; +https://www.domaintuno.com/robot)" || "wscheck.com/1.0.0 (+http://wscheck.com/)" || "Sitedomain-Bot(Sitedomain-Bot 1.0, http://www.sitedomain.de/sitedomain-bot/)" || "Mozilla/5.0 (compatible; SEOdiver/1.0; +http://www.seodiver.com/bot)" || "Whoismindbot/1.0 (+http://www.whoismind.com/bot.html)" || "Easy-Thumb (https://www.easy-thumb.net/)" || "WillyBot/1.1 (http://www.willyfogg.com/info/willybot)" || "Fetch/2.0a (CMS Detection/Web/SEO analysis tool, see http://guess.scritch.org)" || "Mozilla/5.0 (compatible; Embedly/0.2; +http://support.embed.ly/)" || "Iframely/0.8.8 (+http://iframely.com/;)" || "Sosospider+(+http://help.soso.com/webspider.htm)" || "Mozilla/5.0 (compatible; SiteCondor; http://www.sitecondor.com)" || "Mozilla/5.0 (compatible; hypestat/1.0; +http://www.hypestat.com/bot)" || "ICC-Crawler/2.0 (Mozilla-compatible; ; http://www.nict.go.jp/en/univ-com/plan/crawl.html)" || "PayPal IPN ( https://www.paypal.com/ipn )" || "Robots_Tester_http_www.searchenginepromotionhelp.com" || "Mozilla/5.0 (compatible; SISTRIX Crawler; http://crawler.sistrix.net/)" || "Mozilla/5.0 (compatible; 007ac9 Crawler; http://crawler.007ac9.net/)" || "FeedBucket/1.0 (+http://www.feedbucket.com)" || "Pingdom.com_bot_version_1.4_(http://www.pingdom.com/)" || "ADmantX Platform Semantic Analyzer - ADform - ADmantX Inc. - www.admantx.com - support@admantx.com" || "Mozilla/5.0 Moreover/5.1 (+http://www.moreover.com; webmaster@moreover.com)" || "XING-contenttabreceiver/2.0" || "LinkWalker/3.0 (http://www.brandprotect.com)" || "WebTarantula.com Crawler" || "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/534.34 (KHTML, like Gecko) Qt/4.8.3 Safari/534.34 https://linkpeek.com" || "Mozilla/5.0 (compatible; METASpider; +http://meta.ua/spider)" || "Mozilla/5.0 (compatible; Siteliner/1.0; +http://www.siteliner.com/bot)" || "Mozilla/5.0 (compatible; Scrubby/3.2; +http://seotools.scrubtheweb.com/webpage-analyzer.html)" || "Mozilla/5.0 (Windows NT 6.3;compatible; Leikibot/1.0; +http://www.leiki.com)" || "Mozilla/5.0 (compatible; OptimizationCrawler/0.2; +http://www.domainoptima.com/robot)" || "HeartRails Robot/0.1 (http://www.heartrails.com)" || "websitepulse checker/3.0 (compatible; MSIE 5.5; Netscape 4.75; Linux)" || "HubSpot Marketing Grader" || "Mozilla/5.0 (compatible; startmebot/1.0; +http://www.start.me/bot)" || "it2media-domain-crawler/2.0" || "Mozilla/5.0 (compatible; HyperCrawl/0.2; +http://www.seograph.net/bot.html)" || "Seo Servis - Analyza zdrojoveho kodu" || "LexxeBot/1.0 (lexxebot@lexxe.com)" || "Link Valet Online 1.1" || "SSL Labs (https://www.ssllabs.com/about/assessment.html)" || "Mozilla/4.0 (compatible; MSIE 5.0; Windows NT; Girafabot; girafabot at girafa dot com; http://www.girafa.com)" || "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/534.34 (KHTML, like Gecko) Websnapr/3.0 Safari/534.34" || "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.2; WOW64; Trident/6.0; .NET4.0E; .NET4.0C; .NET CLR 3.5.30729; .NET CLR 2.0.50727; .NET CLR 3.0.30729) CrawlerProcess (http://www.PowerMapper.com) /5.9.726.0" || "Port Monitor check service 1.0 | http://www.port-monitor.com" || "TwengaBot-2.0 Champigny (+http://www.twenga.com/bot.html)" || "NerdyBot" || "asafaweb.com" || "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.79 Safari/537.4 LinkTiger 2.0" || "Scooter/3.3" || "UptimeDog Robot (www.uptimedog.com)" || "tagSeoBot/1.0 (http://www.tagseoblog.de/tools)" || "Mozilla/5.0 (compatible; Arachnophilia/1.0; +http://arachnys.com/)" || "PagesInventory (robot http://www.pagesinventory.com)" || "Mozilla/5.0 (Windows NT 6.1; WOW64) SkypeUriPreview Preview/0.5" || "Backlink-Ceck.de (+http://www.backlink-check.de/bot.html)" || "Mozilla/5.0 (compatible; GimmeUSAbot/1.0; +https://gimmeusa.com/pages/crawler)" || "Mozilla/5.0 (Windows NT 6.1; compatible; BDCbot/1.0; +http://ecommerce.bigdatacorp.com.br/faq.aspx) ppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36" || "Abrave v6.0 (http://robot.abrave.com)" || "Mozilla/5.0 (compatible; BegunAdvertising/3.0; +http://begun.ru/begun/technology/indexer/)" || "SemanticScholarBot/1.0 (+http://s2.allenai.org/bot.html)" || "search.KumKie.com" || "Mozilla/5.0 (compatible; Nigma.ru/3.0; crawler@nigma.ru)" || "RED/1 (https://redbot.org/)" || "Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9.0.19; aggregator:Spinn3r (Spinn3r 3.1); http://spinn3r.com/robot) Gecko/2010040121 Firefox/3.0.19" || "Mozilla/5.0 (compatible; DomainSigmaCrawler/0.1; +http://domainsigma.com/robot)" || "Mozilla/5.0 (compatible; UnisterBot; http://www.bluekiwi.de/misc/imprint)" || "Mozilla/5.0 (compatible; zitebot support [at] zite [dot] com +http://zite.com)" || "LivelapBot/0.2 (http://site.livelap.com/crawler)" || "Crowsnest/0.5 (+http://www.crowsnest.tv/)" || "x28-job-bot; +http://x28.ch/bot.html" || "seebot/2.0 (+http://www.seegnify.com/bot)" || "Mozilla/5.0 (compatible; SputnikImageBot/2.3; +http://corp.sputnik.ru/webmaster)" || "Mozilla/5.0 eCairn-Grabber/1.0 (+http://ecairn.com/grabber)" || "Mozilla/5.0 (compatible; EveryoneSocialBot/1.0; support@everyonesocial.com http://everyonesocial.com/)" || "Mozilla/5.0 (compatible; DNS-Digger/1.0; +http://www.dnsdigger.com) " || "linguatools-bot/Nutch-1.6 (searching for translated pages; http://www.linguatools.de/linguatoolsbot.html; peter dot kolb at linguatools dot org) " || "SafeSearch microdata crawler (https://safesearch.avira.com, safesearch-abuse@avira.com)" || "Kemvibot/1.0 (http://kemvi.com, marco@kemvi.com)" || "Mozilla/5.0 (compatible; forensiq; +http://www.forensiq.com)" || "fastbot crawler beta 4.0 (+http://www.fastbot.de)" || "Mozilla/5.0 (compatible; bnf.fr_bot; +http://www.bnf.fr/fr/outils/a.dl_web_capture_robot.html)" || "Mozilla/5.0 (compatible; MSIE or Firefox mutant; not on Windows server;) Daumoa/4.0" || "Mozilla/5.0 (compatible; RankSonicSiteAuditor/1.0; +https://ranksonic.com/ranksonic_sab.html)" || "Mozilla/5.0 (compatible; Pro Sitemaps Generator; https://pro-sitemaps.com) Gecko Pro-Sitemaps/1.0" || "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)" || "Mozilla/5.0 (compatible; ProductoDownloadUrlBot/1.0; +http://www.producto.de/)" || "ExactSeekCrawler/1.0" || "Curious George - www.analyticsseo.com/crawler" || "Mozilla/5.0 (compatible; CloudFlare-AlwaysOnline/1.0; +http://www.cloudflare.com/always-online) AppleWebKit/534.34" || "woobot/1.1" || "RavenCrawler" || "SiteUptime.com" || "StackRambler/2.0 (MSIE incompatible)" || "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11 KimonoLabs/0.2" || "Mozilla/5.0 (compatible; Web-Monitoring/1.0; +http://monoid.nic.ru/)" || "Mozilla/5.0 (compatible; DuckDuckGo-Favicons-Bot/1.0; +http://duckduckgo.com)" || "Mozilla/5.0 (compatible; uMBot-FC/1.0; mailto: crawling@ubermetrics-technologies.com)" || "LinkedInBot/1.0 (compatible; Mozilla/5.0; Jakarta Commons-HttpClient/3.1 +http://www.linkedin.com)" || "Mozilla/5.0 (compatible; Wappalyzer; +https://github.com/AliasIO/Wappalyzer)" || "Mozilla/4.0 (CMS Crawler: http://www.cmscrawler.com)" || "Mozilla/5.0 (compatible; vkShare; +http://vk.com/dev/Share)" || "Mozilla/5.0 (compatible; ExpertSearchSpider +http://www.expertsearch.nl/spider)" || "BDFetch" || "Mozilla/5.0 (X11; U; Linux i686; de; rv:1.9.0.1; compatible; iCjobs Stellenangebote Jobs; http://www.icjobs.de) Gecko/20100401 iCjobs/3.2.3" || "Speedy Spider (http://www.entireweb.com)" || "Mozilla/5.0 (compatible; houzzbot; +http://www.houzz.com/)" || "Mozilla/5.0+(compatible;+PiplBot;++http://www.pipl.com/bot/)" || "Superarama.com-Tarama-Botu-v.01" || "pr-cy.ru Screenshot Bot" || "Mozilla/5.0 (compatible; pmoz.info ODP link checker; +http://pmoz.info/doc/botinfo.htm)" || "Mozilla/5.0 (compatible; WeViKaBot/1.0; +http://www.wevika.de/)" || "AddThis.com robot tech.support@clearspring.com" || "datagnionbot (+http://www.datagnion.com/bot.html)" || "Mozilla/5.0 (compatible; musobot/1.0; info@muso.com; +http://www.muso.com)" || "Crawler powered by contentDetection (www.mindup.de)" || "stq_bot (+http://www.searchteq.de)" || "Vorboss Web Crawler [crawl@vorboss.net]/Nutch-2.3" || "Mozilla/5.0 (compatible; CukBot; Not a spammer; http://www.companiesintheuk.co.uk/bot.html)" || "Mozilla/5.0 (compatible; EuripBot/2.0; +http://www.eurip.com)" || "CoinCornerBot/1.1 ( https://www.coincorner.com/BitcoinBot)" || "Willow Internet Crawler by Twotrees V2.1" || "ScreenerBot Crawler Beta 2.0 (+http://www.ScreenerBot.com)" || "Mozilla/5.0 (compatible;WI Job Roboter Spider Version 3;+http://www.webintegration.at)" || "Mozilla/5.0 (compatible; LA1; +http://www.zeerch.com/bot.php)" || "hawkReader/1.8 (Link Parser; http://www.hawkreader.com/; Allow like Gecko) Build/f2b2566" || "Mozilla/5.0 (compatible; LinkMarketbot/1.2; +http://www.linkmarket.com/)" || "Mozilla/5.0 (compatible; dlcbot/0.1; +http://www.drlinkcheck.com/)" || "Mozilla/5.0 (compatible; alexa site audit/1.0; +http://www.alexa.com/help/webmasters; no-reply@alexa.com)" || "Mozilla/5.0 (compatible; EasouSpider; +http://www.easou.com/search/spider.html)" || "Scrapy/0.25.1 (+http://scrapy.org)" || "Experibot_v1 (https://dl.dropboxusercontent.com/u/8024465/site/Info.html)" || "Mozilla/5.0 (compatible; Thumbshots.ru; +http://thumbshots.ru/bot) Firefox/3" || "WorldBrewBot/2.1 (+http://www.marketbrew.com/)" || "Mozilla/5.0 (compatible; memoryBot/1.21.14 +http://mignify.com/bot.html)" || "Mozilla/5.0 (compatible; NLNZ_IAHarvester2014 +https://natlib.govt.nz/publishers-and-authors/web-harvesting/domain-harvest)" || "Mozilla/5.0 (Windows NT 6.2; WOW64) Runet-Research-Crawler (itrack.ru/research/cmsrate; rating@itrack.ru)" || "MnoGoSearch/3.3.12" || "AboutUsBot/Harpy (Website Analysis; http://www.aboutus.org/Aboutus:Bot; help@aboutus.org)" || "Mozilla/5.0 (compatible; JobdiggerSpider +http://www.jobdigger.nl/spider)" || "Mozilla/5.0 (compatible; IstellaBot/1.18.81 +http://www.tiscali.it/)" || "Mozilla/5.0 (compatible; sukibot_heritrix/3.1.1 +http://suki.ling.helsinki.fi/eng/webmasters.html)" || "Mozilla/5.0 (compatible; ltbot/3.2.0.10 +http://www.kdsl.tu-darmstadt.de/de/kdsl/research-program/crawling-and-semantic-structuring/)" || "Mozilla/5.0 (compatible; pub-crawler; +http://wiki.github.com/bixo/bixo/bixocrawler; bixo-dev@yahoogroups.com)" || "OpenWebSpider v0.1.4 (http://www.openwebspider.org/)")){
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
        visitorProperty = visitorProperties(new Date().getTime(), 'size', screen.width, screen.height, $(window).width(), $(window).height(), $(document).width(), $(document).height(), screen.colorDepth, time.getTimezoneOffset(), browserName, fullVersion, majorVersion, navigator.appName, cookie, language, platform, comesFrom, bot);
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
    data.bot = arguments[19];
    data.device = device;

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
