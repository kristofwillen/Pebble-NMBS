	/* Main app module */
 
// VARS -----------------------------------------------------
var UI = require('ui');
var ajax = require('ajax');
var toStation;
var fromStation;


// FUNCTIONS -------------------------------------------------
// parse the result and return it as itemlist
var parseFeed = function(data, quantity) {
  var items = [];
  for(var i = 0; i < quantity; i++) {
    // Always upper case the description string
    var dest = data.connection[i].departure.direction.name;
    var gate = data.connection[i].departure.platform;
    var epoch = data.connection[i].departure.time;
    var travelTime = data.connection[i].duration/60;
    var objDate = new Date(0);
    objDate.setUTCSeconds(epoch);
    var timestr = objDate.getHours() + ":" + objDate.getMinutes();
    var travelHours = 0;
    while (travelTime >=60) {
      travelHours += 1;
      travelTime -= 60;
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
var typeMenu = new UI.Menu({
  sections: [{
    title: 'Select destination',
    items:[
      {title:'Leuven'}, 
      {title:'Brussels-South'}
    ]
  }]
});
typeMenu.show();


// on clicking "select" on menu generate get the list of trains 
typeMenu.on('select', function(e) {
  toStation = e.item.title;
  
  // TODO make these configurable items
  if (toStation == "Leuven") {  fromStation = "Brussels-South";}
  else { fromStation = "Leuven"; }
  
  var urlstr = "http://api.irail.be/connections/?to=" + toStation + "&from=" + fromStation + "&format=json";
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
  },
  
  function(error) {
    console.log('Download failed: ' + error);
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


