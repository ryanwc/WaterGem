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
*	Global Google Map API vars that need to be accessed by the rest of the program
*
*/

var map;
var infoWindow;
var directionsService;
var directionsDisplay;

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

var Marker = function (data) {
	// a marker is a google map marker that holds a gem object
	var self = this;

	var coords = data["location"]().split(",");

	self.data = data;
	self.marker = new google.maps.Marker({

		position: {lat: parseFloat(coords[0]), lng: parseFloat(coords[1])},
		map: map,
		animation: google.maps.Animation.DROP,
		title: data["name"]
	});

	self.marker.toggleBounce = function () {

		if (self.marker.getAnimation() != google.maps.Animation.BOUNCE) {

			self.marker.setAnimation(google.maps.Animation.BOUNCE);
			setTimeout(self.marker.toggleBounce, 2500);
		}
		else {

			self.marker.setAnimation(null);
		}
	};

	self.marker.addListener("click", self.marker.toggleBounce);
}

var Gem = function (data) {

	var self = this;

	self.name = "Gem (water station)";
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
	self.gemusers = ko.observableArray(data["gemusers"]);
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
	self.neighborhoods = ko.observableArray(data["neighborhoods"]);
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

	// hashmaps to keep track of which objects have already been created in client memory
	// allows O(1) check instead of looping through observable arrays
	// when possible, push from here to observables instead of requesting from server
	self.loadedCountries = {};
	self.loadedCities = {};
	self.loadedNeighborhoods = {};
	self.loadedGems = {};

	// track current user selections
	self.selectedGem = ko.observable();
	self.selectedGemPic = ko.observable();
	self.selectedNeighborhood = ko.observable();
	self.selectedCity = ko.observable();
	self.selectedCountry = ko.observable();

	// displayed options
	self.optionCountries = ko.observableArray([]);
	self.optionCities = ko.observableArray([]);
	self.optionNeighborhoods = ko.observableArray([]);

	// holds Markers (with data as gem and marker as google api marker)
	self.displayedGems = [];

	/* Custom listeners for selection changes
	*/
	self.selectedCountry.subscribe(function(newSelection) {

    	self.filterCities();
    	self.resetOptions("neighborhood");
    	self.destroyDisplayedGems();

    	if (newSelection) {

    		// center map
    		// display info about country
    	}
	});

	self.selectedCity.subscribe(function(newSelection) {

		self.filterNeighborhoods();

		if (newSelection) {

    		// center map
    		// display info about city
		}
	});

	self.selectedNeighborhood.subscribe(function(newSelection) {

    	if (newSelection && !self.selectedGem()) {

    		self.displayGems(newSelection["key"]());
    		// center map / show outline of neighborhood
    		// display info about neighborhood
    	}
	});	

	self.selectedGem.subscribe(function(newSelection) {

		if (newSelection) {

			// setSelectedNeighborhood without triggering other stuff
			newSeletion["marker"].animaton = google.maps.Animation.BOUNCE;
			// display info about neighborhood
			// display info about gem in infowindow
		}
	});

	/* Modify options based on selections
	*/

	self.resetOptions = function (selectionType) {

		if (selectionType == "city") {

			self.optionCities.removeAll();
		}
		else if (selectionType == "neighborhood") {

			self.optionNeighborhoods.removeAll();
		}
	}

	self.selectGem = function (selectedGem) {

		if (selectedGem != self.selectedGem()) {

			self.selectedGem(selectedGem);
			self.animateGem(self.selectedGem);

			var thisPicSrc = "data:image;base64," + dataJSON[0].picture;

			$("#imgtest").attr("src", thisPicSrc);
		}
	};

	// maybe i could pass a singular ajax call a callback function instead of re-typing?
	// could also map country -> list of cityobj to make this simpler
	// (also for cities -> neighborhoods etc)

	self.filterCities = function () {
		// filter cities by populating select options from selected country city keys
		// if city has not been loaded into client memory, load from server
		self.resetOptions("city");
		self.resetOptions("neighborhood");
		self.destroyDisplayedGems();

		if (self.selectedCountry()) {

			var cityKeyList = self.selectedCountry().cities();

			for (var i = 0; i < cityKeyList.length; i++) {

				var thisCityKey = cityKeyList[i];

				if (thisCityKey in self.loadedCities) {

					self.optionCities.push(self.loadedCities[thisCityKey]);
				}
				else {

					(function(thisCityKey) {

						$.ajax({
							type: "GET",
							url: "/GetByKey",
							headers: {"key":thisCityKey}
						}).done(function(data) {
							
							var dataJSON = JSON.parse(data);
							// add city to loaded cities add to options
							var thisCity = new City(dataJSON);
							console.log(thisCity);
							self.loadedCities[thisCityKey] = thisCity;
							self.optionCities.push(thisCity);
						});
					})(thisCityKey);
				}
			}
		}
	};

	self.filterNeighborhoods = function () {
		// filter neighborhoods by populating select options from selected city neighborhood keys
		// if neighborhood has not been loaded into client memory, load from server
		self.resetOptions("neighborhood");
		self.destroyDisplayedGems();

		if (self.selectedCity()) {

			var neighborhoodKeyList = self.selectedCity().neighborhoods();

			for (var i = 0; i < neighborhoodKeyList.length; i++) {

				var thisNeighborhoodKey = neighborhoodKeyList[i];

				if (thisNeighborhoodKey in self.loadedNeighborhoods) {

					self.optionNeighborhoods.push(self.loadedNeighborhoods[thisNeighborhoodKey]);
					self.displayGems(thisNeighborhoodKey);
				}
				else {
		
					(function(thisNeighborhoodKey) {

						$.ajax({
							type: "GET",
							url: "/GetByKey",
							headers: {"key":thisNeighborhoodKey}
						}).done(function(data) {
							
							var dataJSON = JSON.parse(data);
							// add neighborhood to loaded neighborhoods, add to options, then display gems
							var thisNeighborhood = new Neighborhood(dataJSON);
							self.loadedNeighborhoods[thisNeighborhoodKey] = thisNeighborhood;
							self.optionNeighborhoods.push(thisNeighborhood);
							self.displayGems(thisNeighborhoodKey);
						});
					})(thisNeighborhoodKey);
				}
			}
		}
	};

	self.displayGems = function (neighborhoodKey) {
		// add gems to display from a particular neighborhood by key
		var thisNeighborhoodGemKeys = self.loadedNeighborhoods[neighborhoodKey].gems();
		var thisGemKey;
		var thisGem;

		for (var i = 0; i < thisNeighborhoodGemKeys.length; i++) {

			thisGemKey = thisNeighborhoodGemKeys[i];

			if (self.loadedGems[thisGemKey]) {

				thisGem = self.loadedGems[thisGemKey];
				// cant put this after if because need to do it inside async ajax call below
				var thisGemMarker = new Marker(thisGem);
				self.displayedGems.push(thisGemMarker);
			}
			else {

				(function(thisGemKey) {

					$.ajax({
						type: "GET",
						url: "/GetByKey",
						headers: {"key":thisGemKey}
					}).done(function(data) {
						
						var dataJSON = JSON.parse(data);
						// add gem to loaded gems, then to displayed gems
						var newGem = new Gem(dataJSON);
						self.loadedGems[newGem["key"]()] = newGem;
						var thisGemMarker = new Marker(newGem);
						self.displayedGems.push(thisGemMarker);
					});
				})(thisGemKey);
			}
		}
	};

	self.destroyDisplayedGems = function () {

		for (var i = 0; i < self.displayedGems.length; i++) {

			self.displayedGems[i].marker.setMap(null);
			self.displayedGems[i].marker = null;
			self.displayedGems[i].data = null;
		}

		self.displayedGems = [];
		// now no references to my Marker object or the related google map Marker object
		// are stored anywhere, so will be destroyed
	}

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

	self.populateCountries = function (countriesJSON) {

		for (var i = 0; i < countriesJSON.length; i++) {
		
			country = new Country(countriesJSON[i]);
			self.loadedCountries[country["key"]()] = country;
			self.optionCountries.push(country);
		}
	};

	self.populateCities = function (citiesJSON) {

		for (var i = 0; i < citiesJSON.length; i++) {
		
			city = new City(citiesJSON[i]);
			self.loadedCities[city["key"]()] = city;
			self.optionCities.push(city);
		}
	};

	self.populateLocale = function(kind, pythonDictParamString) {
		// ajax query to server for initial select options locales (e.g., countries, cities)
		// if have many more countries, mofify to only populate cities by country select
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
		});
	};

	// initialize country and city selects when app starts
	(function() {

		// if more than one country, should not populate cities at start
		// so do not have to set country upon city selection by user
		self.populateLocale("country", "");
	})();
}

/*
*
*	GoogleMaps
*
*/
// embed the Google Map
function initMap() {

	map = new google.maps.Map(document.getElementById('googlemap'), {
	  	
	  	center: {lat: 18.7061, lng: 98.9817},
	  	scrollwheel: false,
	  	zoom: 13
	});

    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;
	infoWindow = new google.maps.InfoWindow({map: map});

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

    directionsDisplay.setMap(map);
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
	
	infoWindow.setPosition(pos);
	infoWindow.setContent(browserHasGeolocation ?
                      'Error: The Geolocation service failed.' :
                      'Error: Your browser doesn\'t support geolocation.');
}

// show directions from current location to selected marker
function showDirections(destination, origin, travelMode) {

    var request = {
      	destination: destination,
      	origin: origin,
      	travelMode: travelMode
    };

    directionsService.route(request, function(response, status) {

		if (status === 'OK') {

			directionsDisplay.setDirections(response);
		} else {

			window.alert('Directions request failed due to ' + status);
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

