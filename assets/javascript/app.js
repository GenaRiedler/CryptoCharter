//Global variables
var coins_ticker = ""; //Stores response from Coinmap API
var ticker_tracker = 0; //Tracks where we are in the ticker
var coins_price = {}; //Stores object to link symbol to current price
var current_date = ""; //Stores date for current transaction
var current_symbol = ''; //Stores symbol for the current transaction
var current_price = ''; //Stores price for the current transaction
var current_units = ''; //Stores number of units for current transaction
var start_date = ""; //Stores date of transaction
var total_gain = ''; //stores total gain of transaction


//Code to initialize Firebase. This is Mateo's personal firebase config.
var config = {
	apiKey: "AIzaSyDf35aVp6HQZ9iZTXzPGBO5kI0-T5oMyGc",
    authDomain: "cryptocharters-48619.firebaseapp.com",
    databaseURL: "https://cryptocharters-48619.firebaseio.com",
    projectId: "cryptocharters-48619",
    storageBucket: "cryptocharters-48619.appspot.com",
    messagingSenderId: "949624960748"
};

//Initializes Firebase using the configuration from Mateo
firebase.initializeApp(config);

//Initialized variables for use through
var database = firebase.database();

//Gets the coin data from the API and builds the coins_price object
$.ajax({
	url: 'https://api.coinmarketcap.com/v1/ticker/',
	type: 'GET'
}).done(function(response){

	coins_ticker = response; //saves the ticker.

	displayTicker();

  //Creates object linking coin symbol to price.
	for(var j = 0; j < coins_ticker.length; j++){

		var key = coins_ticker[j].symbol;
		coins_price[key] = coins_ticker[j].price_usd;

	}

});

//Builds and displays the ticker at the top of the navbar. Displays only the first five.
function displayTicker(){

	$('#ticker-view').empty();

	var i = 1;

  //Loops five times each time, displaying five different coins and their information.
	while(i%6 != 0){

		var ticker_div = $('<li>');
		ticker_div.attr('id', ticker_tracker);
		ticker_div.text(" " + coins_ticker[ticker_tracker].symbol + " " + coins_ticker[ticker_tracker].percent_change_24h + " ");

    //Adds an attribute used to hide coins if the screen is smaller
    if(i > 2){

      ticker_div.attr('should-hide', 'true');

    }
    else{

      ticker_div.attr('should-hide', 'false');

    }

		$('#ticker-view').append(ticker_div);

    //Adds red if the coin is going down, green if the coin is going up.
    if(coins_ticker[ticker_tracker].percent_change_24h < 0){

      ticker_div.attr('class' , 'red');

    }else{

      ticker_div.attr('class', 'green');

    }

		ticker_tracker++;
		i++;

	}

  //Resets the counter to 0 once we reach the end of the array
	if(ticker_tracker == coins_ticker.length){

		ticker_tracker = 0;

	}

};

//Event listener that runs function upon clicking submit.
$('#add-trade-button').on('click', function(){

  //Prevents the page from reloading.
  event.preventDefault();

  //Gets the inputted values for the employees from the form and increments
  //employee count.
  current_date = $('#date-input').val();
  current_symbol = $('#symbol-input').val();
  current_price = $('#price-input').val();
  current_units = $('#units-input').val();



  //Pushes the individual entry to the database. Push adds it as one 
  //item with a single unique id.
  database.ref().push({

    date: current_date,
    symbol: current_symbol,
    price: current_price,
    units: current_units,

  });
});

//Displays the new employee upon being added. Takes only a snapshot of the 
//added child.
database.ref().on('child_added', function(child_snapshot){

  //Gets the snapshot values.
  current_date = child_snapshot.val().date;
  current_symbol = child_snapshot.val().symbol;
  current_price = child_snapshot.val().price;
  current_units = child_snapshot.val().units;

  //Creates the table row
  var table_row = $('<tr>');

  //Creates the date column.
  var date_col = $('<td>').text(current_date);
  date_col.attr('date', 'date');
  table_row.append(date_col);

  //Creates the symbol column.
  var symbol_col = $('<td>').text(current_symbol);
  symbol_col.attr('symbol', current_symbol);
  table_row.append(symbol_col);

  //Creates the trade price column.
  var price_col = $('<td>').text(current_price);
  price_col.attr('price', current_price);
  table_row.append(price_col);


  //Creates the units column.
  var units_col = $('<td>').text(current_units);
  units_col.attr('units', current_units);
  table_row.append(units_col);

  //Creates the current price column
  var real_price = coins_price[current_symbol];
  var current_price_col = $('<td>').text(real_price);
  current_price_col.attr('current-price', real_price);
  table_row.append(current_price_col);

  //Creates the net gain/loss column.
  var net_gain_loss = (coins_price[current_symbol] - current_price) * current_units;
  var gain_loss_col = $('<td>').text(net_gain_loss);
  gain_loss_col.attr('net-gain-loss', net_gain_loss);
  table_row.append(gain_loss_col);

  //Appends entire row to the table.
  $('#trade-table').append(table_row);

}, function(errorObject){

    console.log("The read failed: " + errorObject.code);

});

//Updates the navbar ticker every five seconds.
window.setInterval(function(){

	displayTicker();

}, 5000);


//Updates the two coin data structures used every thirty minutes.
window.setInterval(function(){

	$.ajax({
		url: 'https://api.coinmarketcap.com/v1/ticker/',
		type: 'GET'
	}).done(function(response){

		coins_ticker = response;

    for(var j = 0; j < coins_ticker.length; j++){

      var key = coins_ticker[j].symbol;
      coins_price[key] = coins_ticker[j].price_usd;

    }
	});

}, 1800000);
