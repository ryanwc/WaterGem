/*
*	Client-side WaterGem application.
*
*	Written with the KnockoutJS framework.
*
*/

/*
*
*	CSS manupilation that should not be done in .css file
*
*/
setMapDivHeight();
window.onresize = function(event) {
    
    setMapDivHeight();
};

/*
*
*	Models
*
*/

/* TO-DO: implement after Udacity
var User = function (data) {
// don't need this for Udacity
	var self = this;

	self.init = function () {

		ajax call to get logged in user
	}
}
*/

var Gems = function (data) {

	var self = this;

	self.getAllGems = function() {

		$.ajax({
			type: "GET",
			url: "/GetGems"
		}).done(function(data) {
			
			console.log(typeof data);
			var dataJSON = JSON.parse(data);
			console.log(dataJSON);

			var thisPicSrc = "data:image;base64," + dataJSON[0].picture;

			$("#imgtest").attr("src", thisPicSrc);

		});
	};
}

var Gem = function (data) {

	var self = this;

	self.location = ko.observable(data["location"]);
	self.neighborhood = ko.observable(data["neighborhood"]);
	self.picture = ko.observable(data["picture"]);
	self.prices = ko.observableArray(data["price"]);
	self.uv = ko.observable(data["uv"]);
	self.ozone = ko.observable(data["ozone"]);
	self.confirmed = ko.observable(data["confirmed"]);
	self.company = ko.observable(data["company"]);
	self.notes = ko.observable(data["notes"]);
	self.gemfinder = ko.observable(data["gemfinder"]);
	self.gemusers = observableArray(data["gemusers"]);
}

var Country = function (data) {

	var self = this;

	self.name = ko.observable(data["name"]);
	self.cities = ko.observableArray(data["cities"]);
}

var City = function (data) {

	var self = this;

	self.name = ko.observable(data["name"]);
	self.country = ko.observable(data["country"]);
	self.Neighborhoods = ko.observableArray(data["neighborhoods"]);
}

var Neighborhood = function (data) {

	var self = this;

	self.name = ko.observable(data["name"]);
	self.city = ko.observable(data["city"]);
	self.gems = ko.observableArray(data["gems"]);
}

var Neighborhoods = function (data) {

	var self = this;

	self.getAllCountries = function() {

		$.ajax({
			type: "GET",
			url: "/AllLocations",
			headers: {"locale":"neighborhood"}
		}).done(function(data) {
			
			console.log(typeof data);
			var dataJSON = JSON.parse(data);
			console.log(dataJSON);
		});
	};
}

/*
*
*	ViewModel
*
*/
var ViewModel = function () {

	var self = this;

	self.countries = ko.observableArray();
	self.cities = ko.observableArray();
	self.neighborhoods = ko.observableArray();
	self.gems = ko.observableArray([]);

	self.selectedGem = ko.observable();
	self.selectedNeighborhood = ko.observable();
	self.selectedCity = ko.observable();
	self.selectedCountry = ko.observable();

	// run once on initialization
	(function() {

		// get countries and populate select
		$.ajax({
			type: "GET",
			url: "/GetLocales",
			headers: {"Kind":"country", "Queryparams":""}
		}).done(function(data) {
			
			var dataJSON = JSON.parse(data);
			var countrySelect = $("#countryselect");
			var country;

			for (var i = 0; i < dataJSON.length; i++) {
			
				countrySelect.append("<option class='countryselectoption' value='"+dataJSON[i]["name"]+"'>"+dataJSON[i]['name']+"</option>");
				country = new Country(dataJSON[i]);
				self.countries.push(country);
			}
		});

		// get cities and populate select
		$.ajax({
			type: "GET",
			url: "/GetLocales",
			headers: {"Kind":"city", "Queryparams":""}
		}).done(function(data) {
			
			var dataJSON = JSON.parse(data);
			var citySelect = $("#cityselect");
			var city;

			for (var i = 0; i < dataJSON.length; i++) {
				
				citySelect.append("<option class='cityselectoption' value='"+dataJSON[i]["name"]+"'>"+dataJSON[i]['name']+"</option>");
				city = new City(dataJSON[i]);
				self.cities.push(city);
			}
		});
	})();
}

/*
*
*	GoogleMaps
*
*/
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

/*
*
*	Helper functions
*
*/
function setMapDivHeight() {

    var width = $('#googlemapdiv').width();
	$('#googlemapdiv').css({'height':width+'px'});
}

/*
*
*	Initialize and run the app
*
*/
// enable the KnockoutJS framework
ko.applyBindings(new ViewModel);

allGems = new Gems();
console.log(allGems);
//allGems.getAllGems();

