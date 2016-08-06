/*
*	Client-side WaterGem application.
*
*	Written with the KnockoutJS framework.
*
*/

// some css manipulation that cannot be done in the .css file
window.onresize = function(event) {
    
    setMapDivHeight();
};

// helper functions
function setMapDivHeight() {

    var width = $('#googlemapdiv').width();
	$('#googlemapdiv').css({'height':width+'px'});
}

// define the Models
var User = function (data) {

	var self = this;

	/*

	ajax calls to server to get user data

	*/
}

var Gem = function (data) {

	var self = this;

	self.property = ko.observable(0);
	self.name = ko.observable(data.name);
	self.imgSrc = ko.observable(data.imgSrc);
	self.price = ko.observable(data.price);

	/*

	ajax calls to server to get gems

	*/
}

var Location = function (data) {

	var self = this;

	/*

	ajax calls to server to get locations

	*/
}

// define the ViewModel
var ViewModel = function () {

	var self = this;

	self.locations = ko.observableArray([]);

	self.gems = ko.observableArray([]);

	populateGems = function(locations) {

		/*
		locations.forEach(function(location) {

			self.locations.push(new Location(location));
		});
*/
	};

	self.selectedGem = ko.observable();
}

// enable the KnockoutJS framework
ko.applyBindings(new ViewModel);


// embed the Google Map
function initMap() {

	var map = new google.maps.Map(document.getElementById('googlemap'), {
	  	
	  	center: {lat: 18.7061, lng: 98.9817},
	  	scrollwheel: false,
	  	zoom: 13
	});

	var infoWindow = new google.maps.InfoWindow({map: map});

	// Try HTML5 geolocation.
    if (navigator.geolocation) {

      	navigator.geolocation.getCurrentPosition(function(position) {
        	var pos = {
          		lat: position.coords.latitude,
          		lng: position.coords.longitude
        	};

        	infoWindow.setPosition(pos);
        	infoWindow.setContent('Location found.');
        	map.setCenter(pos);
        	map.setZoom(15);
      	}, function() {
        	
        	handleLocationError(true, infoWindow, map.getCenter());
      	});
    } else {
     
    	// Browser doesn't support Geolocation
      	handleLocationError(false, infoWindow, map.getCenter());
    }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
	
	infoWindow.setPosition(pos);
	infoWindow.setContent(browserHasGeolocation ?
                      'Error: The Geolocation service failed.' :
                      'Error: Your browser doesn\'t support geolocation.');
}

// pass google map to this function and make it an onclick?
function showDirections(destination, origin, travelMode, googleMap) {

    var directionsDisplay = new google.maps.DirectionsRenderer({
      	map: googleMap
    });

    // Set destination, origin and travel mode.
    var request = {
      	destination: destination,
      	origin: origin,
      	travelMode: travelMode
    };

    // Pass the directions request to the directions service.
    var directionsService = new google.maps.DirectionsService();

    directionsService.route(request, function(response, status) {

      	if (status == 'OK') {
        	// Display the route on the map.
        	directionsDisplay.setDirections(response);
      	}
    });
}

