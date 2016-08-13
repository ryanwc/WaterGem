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

var Gem = function (data) {

	var self = this;

	self.key = ko.observable(data["key"]);
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

	self.key = ko.observable(data["key"]);
	self.name = ko.observable(data["name"]);
	self.cities = ko.observableArray(data["cities"]);
}

var City = function (data) {

	var self = this;

	self.key = ko.observable(data["key"]);
	self.name = ko.observable(data["name"]);
	self.country = ko.observable(data["country"]);
	self.Neighborhoods = ko.observableArray(data["neighborhoods"]);
}

var Neighborhood = function (data) {

	var self = this;

	self.key = ko.observable(data["key"]);
	self.name = ko.observable(data["name"]);
	self.city = ko.observable(data["city"]);
	self.gems = ko.observableArray(data["gems"]);
}

/*
*
*	ViewModel
*
*/
var ViewModel = function () {

	var self = this;

	// arrays hold all of type seen in this session
	self.countries = ko.observableArray([]);
	self.cities = ko.observableArray([]);
	self.neighborhoods = ko.observableArray([]);
	self.gems = ko.observableArray([]);

	// holds user selections
	self.selectedGem = ko.observable();
	self.selectedGemPic = ko.observable();
	self.selectedNeighborhood = ko.observable();
	self.selectedCity = ko.observable();
	self.selectedCountry = ko.observable();

	// narrow options based on selections
	self.optionCities = ko.observableArray([]);
	self.optionNeighborhoods = ko.observableArray([]);
	self.optionGems = ko.observableArray([]);

	/* Do stuff when selections change 
	*/
	self.selectedCountry.subscribe(function(newSelection) {

    	self.filterCities();
    	self.resetOptions("neighborhood");
    	self.resetOptions("gem");
    	// center map
    	// display info about country
	});

	self.selectedCity.subscribe(function(newSelection) {

		self.filterNeighborhoods();
    	self.filterGems();
    	// center map
    	// show selected city gems
    	// display info about city
	});

	self.selectedNeighborhood.subscribe(function(newSelection) {

    	self.filterGems();

    	if (!self.selectedGem()) {
    		// triggered by selecting neighborhood

	      	// center map on neighborhood, hopefully showing boundaries
	    	// show selected neighborhood gems
	    	// display info about neighborhood  		
	    }
	    else {
	    	// triggered by 
	    	// hopefully show neighborhood boundaries
	    }
	});	

	self.resetOptions = function (selectionType) {

		if (selectionType == "city") {

			self.optionCities.removeAll();
		}
		else if (selectionType == "neighborhood") {

			self.optionNeighborhoods.removeAll();
		}
		else if (selectionType == "gem") {

			self.optionGems.removeAll();
		}
	}

	self.selectedGem.subscribe(function(newSelection) {

		if (newSelection) {

			// setSelectedNeighborhood
			// center map on gem
			// animate gem
			// display info about neighborhood
			// display info about gem
		}
	});

	self.selectGem = function (selectedGem) {

		if (selectedGem != self.selectedGem()) {

			self.selectedGem(selectedGem);
			self.animateGem(self.selectedGem);

			var thisPicSrc = "data:image;base64," + dataJSON[0].picture;

			$("#imgtest").attr("src", thisPicSrc);
		}
	};

	self.filterCities = function () {
		// filter cities by getting country from datastore and seeing
		// if it matches the selected country
		self.resetOptions("city");

		for (var i = 0; i < self.cities().length; i++) {

			var thisCity = self.cities()[i];
			var thisCityCountryKey = self.cities()[i].country();
			var currentCountryName = self.selectedCountry().name();

			// to preserve current city and country in for loop
			(function(thisCity, thisCityCountryKey, currentCountryName) {

				$.ajax({
					type: "GET",
					url: "/GetByKey",
					headers: {"key":thisCityCountryKey}
				}).done(function(data) {
					
					var dataJSON = JSON.parse(data);

					if (dataJSON["name"] == self.selectedCountry().name()) {

						self.optionCities.push(thisCity);
					}
				});
			})(thisCity, thisCityCountryKey, currentCountryName);
		}
	};

	// maybe i could pass a singular ajax call a callback function instead of re-typing?

	self.filterNeighborhoods = function () {
		// filter neighborhoods by getting city from datastore and seeing
		// if it matches the selected city
		self.resetOptions("neighborhood");

		for (var i = 0; i < self.neighborhoods().length; i++) {

			$.ajax({
				type: "GET",
				url: "/GetByKey",
				headers: {"key":self.neighborhoods()[i]["key"]}
			}).done(function(data) {
				
				var dataJSON = JSON.parse(data);

				if (dataJSON["name"] == self.selectedCity().name) {

					self.optionNeighborhoods().push(self.neighborhoods()[i]);
				}
			});
		}
	};

	self.filterGems = function () {
		// filter gems by getting city from datastore and seeing
		// if it matches the selected city
		self.resetOptions("gem");

		for (var i = 0; i < self.gems().length; i++) {

			// nested because gems store key to neighborhood, neighborhood stores key to city
			$.ajax({
				type: "GET",
				url: "/GetByKey",
				headers: {"key":self.gems()[i]["key"]}
			}).done(function(data) {
				
				var neighborhoodDataJSON = JSON.parse(data);

				$.ajax({
					type: "GET",
					url: "/GetByKey",
					headers: {"key":neighborhoodDataJSON["key"]}
				}).done(function(data) {
					
					if (dataJSON["name"] == self.selectedCity().name) {

						var cityDataJSON = JSON.parse(data);
						self.optionGems().push(self.gems()[i]);
					}
				});
			});
		}
	};



	self.resetSelectedCity = function () {

		$("#cityselect").val("-1");
	};

	self.resetSelectedNeighborhood = function () {

		$("#neighborhoodselect").val("-1");
	};

	self.resetSelectedGem = function () {

		$("#gemselect").val("-1");
	};

	self.animateGem = function (gem) {


	};

	self.getCountry = function (countryName) {
		// get country from list of countries by name

		for (var i = 0; i < self.countries.length; i++) {

			if (self.countries[i]().name() == countryName) {

				return self.countries[i];
			}
		}

		return null;
	};

	self.getCity = function (cityName) {
		// get city from list of cities by name

		for (var i = 0; i < self.cities.length; i++) {

			if (self.cities[i]().name() == cityName) {

				return self.cities[i];
			}
		}

		return null;		
	};

	self.getNeighborhood = function (neighborhoodName) {
		// get city from list of cities by name

		for (var i = 0; i < self.neighborhoods.length; i++) {

			if (self.neighborhoods[i]().name() == neighborhoodName) {

				return self.neighborhoods[i];
			}
		}

		return null;
	};

	self.getGem = function (location) {
		// get gem from list of gems by location

		for (var i = 0; i < self.gems.length; i++) {

			if (self.gems[i].location() == location) {

				return self.gems[i];
			}
		}

		return null;			
	};

	self.populateCountries = function (countriesJSON) {

		self.countries.removeAll();

		for (var i = 0; i < countriesJSON.length; i++) {
		
			country = new Country(countriesJSON[i]);
			self.countries.push(country);
		}
	};

	self.populateCities = function (citiesJSON) {

		self.cities.removeAll();

		for (var i = 0; i < citiesJSON.length; i++) {
		
			city = new City(citiesJSON[i]);
			self.cities.push(city);
		}
	};

	self.populateNeighborhoods = function (neighborhoodsJSON) {

		self.neighborhoods.removeAll();

		for (var i = 0; i < neighborhoodsJSON.length; i++) {
		
			neighborhood = new Neighborhood(neighborhoodsJSON[i]);
			self.neighborhoods.push(neighborhood);
		}
	};

	self.populateLocale = function(kind, pythonDictParamString) {
		// ajax query to server for locales (e.g., countries, cities)
		$.ajax({
			type: "GET",
			url: "/GetLocales",
			headers: {"Kind":kind, "Queryparams":pythonDictParamString}
		}).done(function(data) {
			
			var dataJSON = JSON.parse(data);

			if (kind == "country") {

				self.populateCountries(dataJSON);
			}
			else if (kind == "city") {

				self.populateCities(dataJSON);
			}
			else if (kind == "neighborhood") {

				self.populateNeighborhoods(dataJSON);
			}
		});
	};

	self.populateGems = function(neighborhoodKey) {

		$.ajax({
			type: "GET",
			url: "/GetGems"
		}).done(function(data) {

			var dataJSON = JSON.parse(data);
		});
	};

	// initialize country and city selects when app starts
	(function() {

		// if more than one country, should not populate cities at start
		// so do not have to set country upon city selection by user
		self.populateLocale("country", "");
		self.populateLocale("city", "");
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

