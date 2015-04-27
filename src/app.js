	/* Main app module */
 
// VARS -----------------------------------------------------
var UI       = require('ui');
var ajax     = require('ajax');
var Vector2  = require('vector2');
var toStation   = "[NOCONFIG]";
var fromStation = "[NOCONFIG]";



// CONFIGURATION ---------------------------------------------
Pebble.addEventListener('showConfiguration', function(e) {
  // Show config page
  Pebble.openURL('http://kristof.willen.be/pebble/nmbs/config.html');
});

Pebble.addEventListener("webviewclosed",
  function(e) {
    //Get JSON dictionary
    var configuration = JSON.parse(decodeURIComponent(e.response));
    console.log("[DBUG] Configuration window returned: " + JSON.stringify(configuration));
    //Pebble.sendAppMessage(configuration);
    toStation   = configuration.toStation;
    fromStation = configuration.fromStation;
    localStorage.setItem('toStation', toStation);
    localStorage.setItem('fromStation', fromStation);
    console.log("[DBUG] after LS.setItem : " + localStorage.getItem('fromStation') + " > " +localStorage.getItem('toStation'));
  }
);



// FUNCTIONS -------------------------------------------------
// parse the result and return it as itemlist
var parseFeed = function(data, quantity) {
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
    if (delay > 0 ) { timestr = timestr + " [+" + delay + "m]"; }
    var travelHours = 0;
    while (travelTime >=60) {
      travelHours  += 1;
      travelTime   -= 60;
    }
        
    // Add to menu items array
    items.push({
      title:timestr + " " + dest,
      subtitle:"spoor " + gate + " (" + travelHours + ":" + travelTime +")"
    });
  }

  // Finally return whole array
  return items;
};



// MAIN ------------------------------------------------------
// creating selection menu
toStation   = localStorage.getItem('toStation');
fromStation = localStorage.getItem('fromStation');
console.log("[DBUG] MAIN TS  = " + toStation);
// Revert to default stations if Settings.getItem returns undefined
if (typeof toStation   === "undefined") { toStation   = "Leuven"; }
if (typeof fromStation === "undefined") { fromStation = "Brussels-South"; }


var typeMenu = new UI.Menu({
  sections: [{
    title: 'Select destination',
    items:[
      {title:toStation}, 
      {title:fromStation}
    ]
  }]
});
typeMenu.show();

// on clicking "select" on menu generate get the list of trains 
typeMenu.on('select', function(e) {
  toStation = e.item.title;
  if (toStation == "Leuven") { fromStation = "Brussels-South"; }
  else { fromStation = "Leuven"; }
  var urlstr = "http://api.irail.be/connections/?to=" + toStation + "&from=" + fromStation + "&format=json";
  
  // Show splash screen while waiting for data
  var splashWindow = new UI.Window();
  // Text element to inform user
  var text = new UI.Text({
    position: new Vector2(0, 0),
    size: new Vector2(144, 168),
    text:'Downloading NMBS data...',
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
    // Construct Menu to show to user
    var resultsMenu = new UI.Menu({
      sections: [{
        title: fromStation + " > " + toStation,
        items: menuItems
      }]
    });
    resultsMenu.show();
    splashWindow.hide();
  },
  
  function(error) {
    console.log('[FAIL] Download failed: ' + error);
    // Create the Card for error view
    var detailCard = new UI.Card({
      title:'Data fetch failed',
      subtitle:e.item.subtitle,
      body: error
    });
    detailCard.show();
  }
  );
 }
);

