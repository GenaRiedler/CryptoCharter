//Global variables
var coins_ticker = ""; //Stores response from Coinmap API
var ticker_tracker = 0; //Tracks where we are in the ticker
var coins_price = {}; //Stores object to link symbol to current price
var valid_symbols = []; //Tracks the list of valid symbols for our application
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
$('#trade-table').hide();
$('#load-view').show();
//Gets the coin data from the API and builds the coins_price object
$.ajax({
	url: 'https://api.coinmarketcap.com/v1/ticker/',
	type: 'GET'
}).done(function(response){

	coins_ticker = response; //saves the ticker.

  //Displays the ticker
	displayTicker();

  //Creates object linking coin symbol to price and getting our valid symbols
	for(var j = 0; j < coins_ticker.length; j++){

		var key = coins_ticker[j].symbol;
    valid_symbols.push(key);
		coins_price[key] = coins_ticker[j].price_usd;

	}

  //Hides the loading view and shows the table.
  $('#trade-table').show();
  $('#load-view').hide();

  //Displays the new employee upon being added. Takes only a snapshot of the 
  //added child. Used after AJAX call because the table relies on data from
  //response.
  database.ref().on('child_added', function(child_snapshot){

    //Gets the snapshot values.
    current_date = child_snapshot.val().date;
    current_symbol = child_snapshot.val().symbol;
    current_price = child_snapshot.val().price;
    current_units = child_snapshot.val().units;
    current_id = child_snapshot.key;

    //Creates the table row
    var table_row = $('<tr>');
    table_row.attr('id', current_id);

    //Creates the date column.
    var date_col = $('<td>').text(current_date);
    date_col.attr('date', current_date);
    date_col.attr('id', 'date');
    table_row.append(date_col);

    //Creates the symbol column.
    var symbol_col = $('<td>').text(current_symbol);
    symbol_col.attr('symbol', current_symbol);
    symbol_col.attr('id', 'symbol');
    table_row.append(symbol_col);

    //Creates the trade price column.
    var price_col = $('<td>').text(current_price);
    price_col.attr('price', current_price);
    price_col.attr('id', 'bought-price');
    table_row.append(price_col);


    //Creates the units column.
    var units_col = $('<td>').text(current_units);
    units_col.attr('units', current_units);
    units_col.attr('id', 'units');
    table_row.append(units_col);

    //Creates the current price column
    var real_price = coins_price[current_symbol];
    var current_price_col = $('<td>').text(real_price);
    current_price_col.attr('current-price', real_price);
    current_price_col.attr('id', 'current-price');
    table_row.append(current_price_col);

    //Creates the net gain/loss column. Paints it red for losses, green for gains.
    var net_gain_loss = (coins_price[current_symbol] - current_price) * current_units;
    var gain_loss_col = $('<td>').text(net_gain_loss);
    gain_loss_col.attr('net-gain-loss', net_gain_loss);
    gain_loss_col.attr('id', 'net-gain-loss');

    if(net_gain_loss >= 0){

      gain_loss_col.addClass('green');

    }
    else if(net_gain_loss < 0){

      gain_loss_col.addClass('red');

    }

    table_row.append(gain_loss_col);

    //Creates a button to remove a trade.
    var remove_btn = $('<button>').text('Remove');
    remove_btn.attr('class', 'btn btn-default btn-xs center-block');
    remove_btn.attr('id', 'remove-btn');
    remove_btn.attr('entry-id', current_id);
    table_row.append(remove_btn);

    //Appends entire row to the table.
    $('#trade-table').append(table_row);

    //displays the graphs
    displayChart();

  }, function(errorObject){

      console.log("The read failed: " + errorObject.code);

  });
});

//Builds and displays the ticker at the top of the navbar. Displays only the first five.
function displayTicker(){

	$('#ticker-view').empty();

	var i = 1;

  //Loops through a specified amount of times each time, 
  //displaying five different coins and their information.
  //Currently set to show 7.
	while(i%8 != 0){

    //Creates list item and puts coin data into it.
		var ticker_div = $('<li>');
		ticker_div.attr('id', ticker_tracker);
		ticker_div.text(" " + 
                    coins_ticker[ticker_tracker].symbol + 
                    " " + "$" + coins_ticker[ticker_tracker].price_usd + 
                    " " + 
                    coins_ticker[ticker_tracker].percent_change_24h + "%");
		$('#ticker-view').append(ticker_div);

    //Adds red if the coin is going down, green if the coin is going up.
    if(coins_ticker[ticker_tracker].percent_change_24h < 0){

      ticker_div.attr('class' , 'red');

    }else{

      ticker_div.attr('class', 'green');

    }

		ticker_tracker++;
		i++;

    //resets ticker_tracker if there is no next item in the list.
    if(coins_ticker[ticker_tracker] == undefined){

      ticker_tracker = 0;

    }


	}

  //Resets the counter to 0 once we reach the end of the array
	if(ticker_tracker == coins_ticker.length){

		ticker_tracker = 0;

	}

};

//Function that displays both of the graphs
function displayChart() {

  var net_gain_list = []; //keeps track of the gains/losses from our trades
  var symbols = []; //keeps track of the symbols fro our trades
  var background_bar_list = []; //keeps track of color for bar graph
  var border_bar_list = []; //keeps track of color bar graph
  var background_line_list = []; //keeps track of color for line graph
  var border_line_list = []; //keeps track of color for line graph
  var date_list = []; //keeps track of dates from our trades
  var total_list = []; //keeps track of our total net gains for each date
  var current_total = 0; //keeps track of current total
  var trade_counter = 0; //tracks number of trades

  //Loops through the html for the table, assembling the needed data for the 
  //graph from the table information.
  $('tr').each(function(index){

    var trade_profit = 0;

    //Skips the table header.
    if(index != 0){

      //If the symbol for the trade is a coin we haven't seen before, 
      //add it to symbols and calculate
      //trade profit. Else, find the index, and add it to the previous 
      //trade profit for that coin.
      if(symbols.indexOf($(this).find('#symbol').attr('symbol')) == -1){

        symbols.push($(this).find('#symbol').attr('symbol'));
        trade_profit = $(this).find('#net-gain-loss').attr('net-gain-loss');
        trade_profit = parseInt(trade_profit);
        net_gain_list.push(trade_profit);

      }
      else if(symbols.indexOf($(this).find('#symbol').attr('symbol')) != -1){

        var index_to_change = symbols.indexOf($(this).find('#symbol').attr('symbol'));
        trade_profit = $(this).find('#net-gain-loss').attr('net-gain-loss');
        trade_profit = parseInt(trade_profit);
        net_gain_list[index_to_change] = net_gain_list[index_to_change] + trade_profit;
        trade_counter--;

      }

      //If the trade has occurred on a date we haven't traded on before,
      //add the date to the list. Else, find the date and to the profit
      //for that day.
      if(date_list.indexOf($(this).find("#date").attr("date")) == -1){
        
        date_list.push($(this).find("#date").attr("date"));

        current_total = current_total + trade_profit;

        total_list.push(current_total);

      }
      else if(date_list.indexOf($(this).find("#date").attr("date")) != -1){

        var index_to_change = date_list.indexOf(

          $(this).find('#date').attr('date')

        );
        total_list[index_to_change] = total_list[index_to_change] + trade_profit;
        trade_counter--;

      }

      trade_counter++;

      //If we are at the end of the table, loop through the lists, pushing
      //rgb for red for losses and rgb for green for gains. This edits
      //the line graph's color.
      if($(this).next().length == 0 && current_total > 0){

        for(var j = 0; j < trade_counter; j++){

          background_line_list.push("rgba(81, 255, 0, 0.5)");
          border_line_list.push("rgba(81, 255, 0, 1)");

        }

      }
      else if($(this).next().length == 0 && current_total < 0){

        for(var j = 0; j < trade_counter; j++){

            background_line_list.push("rgba(255, 0, 0, 0.5)");
            border_line_list.push("rgba(255, 0, 0, 1)");

        }

      }
    }

  });

  //Sets the total view to current total and colors it depending on
  //value.
  var total_display = current_total.toString();

  //If its a negative number, adjust string so the - is before the $
  if(total_display.charAt(0) == '-'){

    total_display = total_display.slice(0, 1) + ' $' + 
                    total_display.slice(1, total_display.length);

    $('#total-view').addClass('red');

  }
  else{

    total_display = '$' + total_display;
    $('#total-view').addClass('green');

  }

  //Displays the total profit.
  $('#total-view').text(total_display);

  //Loops through the net gains, pushing red for losses,
  //green for gains for the bar graph.
  for (var i = 0; i < net_gain_list.length; i++) {

    if(net_gain_list[i] < 0) {
      background_bar_list.push("rgba(255, 0, 0, 0.5)");
      border_bar_list.push("rgba(255, 0, 0, 1)");
    }
    
    else if (net_gain_list[i] > 0) {
      background_bar_list.push("rgba(81, 255, 0, 0.5)");
      border_bar_list.push("rgba(81, 255, 0, 1)");
    }

    else {
      background_bar_list.push();
      border_bar_list.push();
    }
    
  };

  //Creates the bar graph using chartjs
  var chart = document.getElementById('net-gain').getContext("2d");
  var net_gain_chart = new Chart(chart, {
    type: "bar",
    data: {
      labels: symbols,
      datasets: [{
        label: "Total Net Profit/Loss $ per Coin",
        data: net_gain_list,
        backgroundColor: background_bar_list,
        borderColor: border_bar_list,
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        yAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'Profit / Loss'
          },
          ticks: {
            beginAtZero:true
          }
        }],
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'Coin Symbol'
        }
      }]
      },
      legend: {
        display: false
      }
    }
  });

  //Creates the line graph using chartjs
  var profit_chart = document.getElementById('total-profit').getContext("2d");
  var total_profit_chart = new Chart(profit_chart, {
    type: "line",
    data: {
      labels: date_list,
      datasets: [{
        label: "Total Trade Profit",
        data: total_list,
        backgroundColor: background_line_list,
        borderColor: border_line_list,
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        yAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'Profit / Loss'
          },
          ticks: {
            beginAtZero:true
          }

        }],
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'Date'
        }
      }]
      },
      legend: {
        display: false
      }
    }
  });


};

//Adds a button to pop up a modal when adding a trade.
$('#trade-btn').on('click', function(){

  $('#trade-view').show();

});

//Adds a close button to the modal
$(document).on('click' , '.close', function(){

  $('#trade-view').hide('slow');

});

//Hides table on load. Is shown when the data is loaded.
$(document).ready(function(){

  $('#trade-table').hide();

});

//Event listener that adds a trade upon being clicked.
$('#add-trade-button').on('click', function(){

  //Prevents the page from reloading.
  event.preventDefault();

  //Gets the inputted values for the trade
  current_date = $('#date-input').val();
  current_symbol = $('#symbol-input').val();
  current_price = $('#price-input').val();
  current_units = $('#units-input').val();

  //Displays error if an invalid coin is inputted. Returns to form once
  //time has expired.
  if(valid_symbols.indexOf(current_symbol) == -1){

    $('#trade-view').empty();
    $('#trade-view').append('<span class="close">&times;</span>' +
                            '<div class="panel panel-default panel-table">' +
                            '<h2>ERROR! Symbol does not exist in database. Please choose another coin.' +
                            '</div>');
    window.setTimeout(function(){

      $('#trade-view').empty();
      $('#trade-view').append('<span class="close">&times;</span>' +
                              '<div class="panel-body text-center">' +
                              '<h3>Enter Trades</h3>' + 
                              '</div>' +   
                              '<form class="panel-body form" >' + 
                              '<div class="form-group col-md-3">' + 
                              '<label for="input-info">Trade Date</label>' + 
                              '<input type="text" class="form-control" id="date-input" placeholder="MM/DD/YYYY">' + 
                              '</div>' + 
                              '<div class="form-group col-md-3">' + 
                              '<label for="input-info">Symbol</label>' + 
                              '<input type="text" class="form-control" id="symbol-input" placeholder="Coin Symbol">' + 
                              '</div>' + 
                              '<div class="form-group col-md-3">' + 
                              '<label for="input-info">Trade Price $</label>' + 
                              '<input type="text" class="form-control" id="price-input" placeholder="$">' + 
                              '</div>' + 
                              '<div class="form-group col-md-3">' + 
                              '<label for="input-info">Units traded</label>' +
                              '<input type="text" class="form-control" id="units-input" placeholder="# units">' +
                              '</div>' +     
                              '<br>'+ 
                              '<button class="btn btn-primary center-block" id="add-trade-button" type="submit">Add Trade</button>' +
                              '</form>');
    }, 3000);

    //Skips rest of the function if error occurred.
    return; 

  }

  //Pushes the individual entry to the database. Push adds it as one 
  //item with a single unique id.
  database.ref().push({

    date: current_date,
    symbol: current_symbol,
    price: current_price,
    units: current_units,

  });

  //Displays the charts.
  displayChart();

});

//Removes a trade from the database
$(document).on('click', '#remove-btn', function(){

  var _id = $('#remove-btn').attr('entry-id');

  var to_remove = database.ref(_id);

  to_remove.remove().then(function(){

    $('#' + _id).empty();

  }).catch(function(error){

    console.log("The remove failed: " + error.code);

  });
});

//Updates the navbar ticker every five seconds.
window.setInterval(function(){

	displayTicker();

}, 5000);

window.setInterval(function(){

  displayChart();

}, 60256);


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

}, 1800274);
