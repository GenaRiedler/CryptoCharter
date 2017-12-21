var coins_ticker = "";

var ticker_tracker = 0;


$.ajax({
	url: 'https://api.coinmarketcap.com/v1/ticker/',
	type: 'GET'
}).done(function(response){

	coins_ticker = response;

	console.log(response);
	displayTicker();

});

function displayTicker(){

	$('#ticker-view').empty();

	var i = 1;
	while(i%6 != 0){

		var ticker_div = $('<li>');
		ticker_div.attr('id', ticker_tracker);
		ticker_div.text(coins_ticker[ticker_tracker].symbol + " " + coins_ticker[ticker_tracker].percent_change_24h);
		$('#ticker-view').append(ticker_div);
		ticker_tracker++;
		i++;

	}

	if(ticker_tracker == coins_ticker.length){

		ticker_tracker = 0;

	}

};

window.setInterval(function(){

	displayTicker();

}, 5000)



window.setInterval(function(){

	$.ajax({
		url: 'https://api.coinmarketcap.com/v1/ticker/',
		type: 'GET'
	}).done(function(response){

		coins_ticker = response;
		
	});
	
}, 1,800,000)
