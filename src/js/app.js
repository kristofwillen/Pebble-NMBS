	/* Main app module */
 
// VARS -----------------------------------------------------
var UI        = require('ui');
var ajax      = require('ajax');
var Vector2   = require('vector2');
var Station1  = localStorage.getItem('Station1');
var Station2  = localStorage.getItem('Station2');
var Station3  = localStorage.getItem('Station3');
var Station4  = localStorage.getItem('Station4');
var info      = Pebble.getActiveWatchInfo();
//console.log('Pebble model: ' + info.model);
if ((info.model.search("qemu_platform_chalk") != -1) || (info.model.search('pebble_polished') != -1) || (info.model.search('pebble_time_round') != -1)) {
  var xres = 180; 
  var yres = 180;
}
else {
  var xres = 144;
  var yres = 168;
}


// i18n ------------------------------------------------------
if (navigator.language.match(/nl/i)) { 
  var spoor         = "spoor";
  var selectstart   = "Start :";
  var selectdest    = "Bestemming :";
  var dldata        = "\n\nDownloaden van NMBS data...";
  var EDLDATA       = "\n\nData request gefaald !";
  var ENOCFG        = "\n\n\nGEEN CONFIGURATIE GEVONDEN: Gelieve BeTrain te configureren via de Pebble app op uw GSM en daarna BeTrain te herstarten";
  var EWRONGCFG     = "\n\n\nVERKEERDE CONFIGURATIE GEVONDEN : Gelieve minstens 2 stations te specifiëren in de BeTrain configuratie";
} 
else { 
  if (navigator.language.match(/fr/i)) { 
    var spoor       = "voie"; 
    var selectstart = "Départ :";
    var selectdest  = "Destination :";
    var dldata      = "\n\nTéléchargement des données de NMBS...";
    var EDLDATA     = "\n\nTéléchargement échoué !";
    var ENOCFG      = "\n\n\nAUCUNE CONFIGURATION TROUVE: Veuillez configurer BeTrain via le Pebble app sur vortre mobile, et après relancer BeTrain";
    var EWRONGCFG   = "\n\n\nMAUVAISE CONFIGURATION TROUVE: Veuillez spécifier au moins 2 stations dans l'écran de configuration";
  }
  else {
    var spoor       = "track";
    var selectstart = "Start : ";
    var selectdest  = "Destination :";
    var dldata      = "\n\nDownloading NMBS data...";
    var EDLDATA     = "\n\nData fetch failed !";
    var ENOCFG      = "\n\n\nNO CONFIGURATION FOUND: please config this app via the Pebble app on your phone, and restart the app";
    var EWRONGCFG   = "\n\n\nWRONG CONFIGURATION FOUND: Please select at least 2 stations in the configuration window";
  }
}  



// CONFIGURATION ---------------------------------------------
Pebble.addEventListener('showConfiguration', function(e) {
  // Show config page
  Pebble.openURL('http://kristof.willen.be/pebble/nmbs/config-v1.html');
});

Pebble.addEventListener("webviewclosed",
  function(e) {
    //Get JSON dictionary
    var configuration = JSON.parse(decodeURIComponent(e.response));
    //console.log("[DBUG] Configuration window returned: " + JSON.stringify(configuration));
    //Pebble.sendAppMessage(configuration);
    Station1 = configuration.Station1;
    Station2 = configuration.Station2;
    Station3 = configuration.Station3;
    Station4 = configuration.Station4;
    localStorage.setItem('Station1', Station1);
    localStorage.setItem('Station2', Station2);
    localStorage.setItem('Station3', Station3);
    localStorage.setItem('Station4', Station4);
  }
);



// FUNCTIONS -------------------------------------------------
var parseFeed = function(data, quantity) {
// parse the result and return it as itemlist
  var items = [];
  for(var i = 0; i < quantity; i++) {
    var dest        = data.connection[i].departure.direction.name;
    var gate        = data.connection[i].departure.platform;
    var epoch       = data.connection[i].departure.time;
    var travelTime  = data.connection[i].duration/60;
    var delay       = data.connection[i].departure.delay/60;
    var objDate     = new Date(0);
    
    // Change epoch return to HH:MM format
    objDate.setUTCSeconds(epoch);
    var minutes     = 0;
    if (objDate.getMinutes() < 10) { minutes = "0" + objDate.getMinutes(); }
    else { minutes  = objDate.getMinutes(); }
    var timestr     = 0;
    timestr = objDate.getHours() + ":" + minutes; 
    if (delay > 0 ) { gate = gate + " [+" + delay + "m]"; }
    var travelHours = 0;
    while (travelTime >=60) {
      travelHours  += 1;
      travelTime   -= 60;
    }
    // Set remaining traveltime to HH:MM format
    if (travelTime < 10) { travelTime = "0" + travelTime; }
        
    // Add to menu items array
    items.push({
      title:timestr  + " " + dest,
      subtitle:spoor + " " + gate + " (" + travelHours + ":" + travelTime +")"
    });
  }

  // Finally return whole array
  return items;
};



// MAIN ------------------------------------------------------

var StarttmpList = [];
if (Station1) { StarttmpList.push(Station1); }
if (Station2) { StarttmpList.push(Station2); }
if (Station3) { StarttmpList.push(Station3); }
if (Station4) { StarttmpList.push(Station4); }

if (StarttmpList.length === 0) { 
  //console.log("[DBUG] Startlist is empty, showing error card");
  var ErrorWindow = new UI.Window();
  var text = new UI.Text({
    position: new Vector2(0, 0),
    size: new Vector2(xres, yres),
    text:ENOCFG,
    font:'GOTHIC_18_BOLD',
    color:'black',
    textOverflow:'wrap',
    textAlign:'center',
    backgroundColor:'white'
  });
  // Add to Window and show
  ErrorWindow.add(text);
  ErrorWindow.show();
}
else { 
  if (StarttmpList.length < 2) { 
    //console.log("[DBUG] Only 1 station configured, showing error card");
    var ErrorWindow = new UI.Window();
    var text = new UI.Text({
      position: new Vector2(0, 0),
      size: new Vector2(xres, yres),
      text:EWRONGCFG,
      font:'GOTHIC_18_BOLD',
      color:'black',
      textOverflow:'wrap',
      textAlign:'center',
      backgroundColor:'white'
    });
    // Add to Window and show
    ErrorWindow.add(text);
    ErrorWindow.show();
  }
  else {
    var StartStationList = [];
 
      for (var i = 0 ; i<StarttmpList.length; i++) {
        if (StarttmpList[i] !== "") { StartStationList.push({
          title: StarttmpList[i]
        });}
      }
    
      var StartMenu = new UI.Menu({
      sections: [{
        title: selectstart,
        items: StartStationList
      }] 
    });

    StartMenu.show();

    StartMenu.on('select', function(e) {
    //console.log("[DBUG] Selected " + e.item.title);
    var fromStationSelected = e.item.title;
    var StopStationList = [];
  
    var tmpList = [];
    for (var i = 0 ; i < StarttmpList.length ; i++) {
      if (StartStationList[i].title != fromStationSelected) { tmpList.push(StartStationList[i].title); }
    }
  
    for (i = 0 ; i<tmpList.length; i++) {
      StopStationList.push({
        title: tmpList[i]
      });
    }
    
    var DestMenu = new UI.Menu({
      sections: [{
        title: selectdest,
        items: StopStationList
      }]
    });
    DestMenu.show();
    //StartMenu.hide();
  
    // on clicking "select" on menu generate get the list of trains 
    DestMenu.on('select', function(e) {
      var toStationSelected = e.item.title;
      var urlstr = "http://api.irail.be/connections/?to=" + toStationSelected + "&from=" + fromStationSelected + "&format=json";
  
      // Show splash screen while waiting for data
      var splashWindow = new UI.Window();
      var text = new UI.Text({
        position: new Vector2(0, 0),
        size: new Vector2(xres, yres),
        text:dldata,
        font:'GOTHIC_24_BOLD',
        color:'black',
        textOverflow:'wrap',
        textAlign:'center',
        backgroundColor:'white'
      });
      // Add to splashWindow and show
      splashWindow.add(text);
      splashWindow.show();
  
      console.log("[DBUG] Fetching " + urlstr);
      // Make request to irail.be
      ajax(
      {
        url:urlstr,
        type:'json'
      },
      function(data) {
        // Create an Menu with the first 5 trains available
        var menuItems = parseFeed(data, 5);
        var resultsMenu = new UI.Menu({
          sections: [{
            title: fromStationSelected + " > " + toStationSelected,
            items: menuItems
          }]
        });
        resultsMenu.show();
        splashWindow.hide();
      },
  
      function(error) {
        console.log('[FAIL] Download failed: ' + error);
        // Create the Card for error view
        var errstr;
        if (error.length > 64) {  errstr = "[FAIL] Something wicked happened while receiving NMBS data...";}
        else { errstr = error; }
        var ErrorCard = new UI.Card({
          title:EDLDATA,
          subtitle:e.item.subtitle,
          body: errstr
        });
        ErrorCard.show();
        splashWindow.hide();
      }
      );
     }
    );}  
   );
  }
}
