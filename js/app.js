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
setLocationLoadingPosition();
window.onresize = function(event) {
    
    setMapDivHeight();
    setLocationLoadingPosition();
};

/*
*
*	Helpful global vars
*
*/

var map;
var infoWindow;
var directionsService;
var directionsDisplay;
var geocoder;
var yourLocationMarker;
var viewModel;
var chiangMaiLatLon = {lat: 18.7869, lng: 98.9865};
var bangkokLatLon = {lat: 13.7563, lng: 100.5018};

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

var GemMarker = function (data) {
	// a marker is a google map marker that holds a gem object
	var self = this;

	var coords = data["location"]().split(",");

	self.gemKey = data["key"]();
	self.isDisplayed = ko.observable(true);

	// marker is not a knockout observable
	// check if google map is there before making
	if (typeof google === 'object' && typeof google.maps === 'object') {

		self.marker = new google.maps.Marker({

			position: {lat: parseFloat(coords[0]), lng: parseFloat(coords[1])},
			map: map,
			animation: google.maps.Animation.DROP,
			title: data["name"]()
		});
	}
	else {

		self.marker = null;
		window.alert("gem marker created without google map api marker");
	}
}

var Gem = function (data) {

	var self = this;

	// data from server -- decode
	self.name = ko.observable(decodeURIComponent(data["name"]));
	
	self.key = ko.observable(data["key"]);
	self.location = ko.observable(data["location"]);
	self.neighborhood = ko.observable(data["neighborhood"]);
	self.neighborhoodName = ko.observable(data["neighborhoodName"]);
	self.picture = ko.observable(data["picture"]);
	// picture stored ready for display as 'src' attribute in html <img> tag
	self.pictureSRC = ko.observable("data:image;base64,"+data["picture"]);
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

var WikipediaInfo = function (data) {

	var self = this;

	self.articleID = ko.observable(data["articleID"]);
	self.title = ko.observable(data["title"]);
	self.linkText = ko.observable(data["linkText"]);
	self.linkRef = ko.observable(data["linkRef"]);
	self.extraText = ko.observable(data["extraText"]);
}

var NYTimesInfo = function (data) {

	var self = this;

	self.title = ko.observable(data["title"]);
	self.linkText = ko.observable(data["linkText"]);
	self.linkRef = ko.observable(data["linkRef"]);
	self.extraText = ko.observable(data["extraText"]);
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

	// track all currently executing ajax requests
	self.currentAjaxCalls = {"country":{},"city":{},"neighborhood":{},"gem":{},
							 "wiki":{}, "nytimes":{},"google":{}};

	// track current user selections
	self.selectedGem = ko.observable();
	self.selectedNeighborhood = ko.observable();
	self.selectedCity = ko.observable();
	self.selectedCountry = ko.observable();

	// displayed options
	self.optionCountries = ko.observableArray([]);
	self.optionCities = ko.observableArray([]);
	self.optionNeighborhoods = ko.observableArray([]);

	self.googleMapIsLoaded = ko.observable((function() {
		return (typeof google === 'object' && typeof google.maps === 'object')? true : false;
	}));
	// holds Markers (with data as gem and marker as google api marker)
	self.displayedGemMarkers = ko.observableArray([]);

	self.selectedLocationNumDisplayedGems = ko.observable("N/A") 

	// holds wiki and nyt info for selected location
	self.selectedLocationWikiInfo = ko.observableArray([]);
	self.selectedLocationNYTimesInfo = ko.observableArray([]);

	self.selectedLocationName = ko.computed(function() {

		// to make the logic easier to read
		var countryIsSelected = (typeof self.selectedCountry() != 'undefined');
		var cityIsSelected = (typeof self.selectedCity() != 'undefined');
		var neighborhoodIsSelected = (typeof self.selectedNeighborhood() != 'undefined');

    	if (neighborhoodIsSelected) {

    		if (cityIsSelected && countryIsSelected) {

    			return self.selectedNeighborhood().name() + ", " + self.selectedCity().name() + ", " + self.selectedCountry().name();
    		}
    		else if (cityIsSelected) {

    			return self.selectedNeighborhood().name() + ", " + self.selectedCity().name();
    		}
    		else if (countryIsSelected) {

    			return self.selectedNeighborhood().name() + ", " + self.selectedCountry().name();
    		}
    		else {

    			return self.selectedNeighborhood().name();
    		}
    	}
    	else if (cityIsSelected) {

    		if (countryIsSelected) {
  			
    			return self.selectedCity().name() + ", " + self.selectedCountry().name();
    		}
    		else {

        		return self.selectedCity().name();			
    		}
    	}
    	else if (typeof self.selectedCountry() != 'undefined') {

    		return self.selectedCountry().name();
    	}
    	else {

    		return "[select location]";
    	}
	}, self);

	self.showingDirections = ko.observable(false);

	/* helpers
	*/

	self.setNumDisplayedGems = function () {

		if (typeof self.selectedNeighborhood() != "undefined") {

			self.selectedLocationNumDisplayedGems(self.selectedNeighborhood().gems().length);
		}
		else if (typeof self.selectedCity() != "undefined") {

			var numCityGems = 0;

			for (var i = 0; i < self.selectedCity().neighborhoods().length; i++) {

				var thisNeighborhoodKey = self.selectedCity().neighborhoods()[i];
				var neighborhood = self.loadedNeighborhoods[thisNeighborhoodKey];

				// maybe it's not loaded yet
				if (neighborhood) {

					numCityGems += neighborhood.gems().length;
				}
			}

			self.selectedLocationNumDisplayedGems(numCityGems);
		}
		else {

			self.selectedLocationNumDisplayedGems("N/A");
		}
    };

	self.abortAjaxCalls = function (type) {

		if (type == "country" || type == "city" || type == "neighborhood" || 
			type == "gem" || type == "wiki" || type == "nytimes" || type == "google") {

			for (var key in self.currentAjaxCalls[type]) {

				if (typeof key == "") {

					self.abortAjaxCall(self.currentAjaxCalls[type][key]);
					delete self.currentAjaxCalls[type][key];
				}
			}
		}
	}

	self.abortAjaxCall = function (jqXHRObject) {

		jqXHRObject.abort();
	}

	self.getLoadedGemName = function (gemKey) {

		return self.loadedGems[gemKey].name();
	}

	self.toggleShowingDirections = function() {

		self.showingDirections(!self.showingDirections());
	};

	self.clickGemFromListView = function (clickedGemMarker) {

		infoWindow.close();

		if (clickedGemMarker.marker) {

			new google.maps.event.trigger(clickedGemMarker.marker, 'click');
		}
		else {

			window.alert("Google Map was not loaded correctly, so there's nothing to show.");
		}
	};

	/* Custom listeners for selection changes
	*/

	// TO-DO: improve inefficient alphabetical sort of dropdowns after every change

	self.googleMapIsLoaded.subscribe(function(newSelection) {

		if (newSelection) {

			self.ensureGemMarkersHaveMarker();
		}
	});

	self.showingDirections.subscribe(function(newSelection) {

		if (newSelection) {

			for (var i = 0; i < self.displayedGemMarkers().length; i++) {

				if (self.displayedGemMarkers()[i].gemKey != self.selectedGem().key()) {
					
					self.displayedGemMarkers()[i].marker.setMap(null);
					self.displayedGemMarkers()[i].isDisplayed(false);
				}
			}
			$("#hidedirectionsdiv").removeClass("displaynone");
		}
		else {

			for (var i = 0; i < self.displayedGemMarkers().length; i++) {
				
				var thisGem = self.loadedGems[self.displayedGemMarkers()[i].gemKey];

				// display only if within current selection
				if (typeof self.selectedNeighborhood() == "undefined" ||
					(thisGem.neighborhood()[0][0] == self.selectedNeighborhood().key()[0] &&
					 thisGem.neighborhood()[0][1] == self.selectedNeighborhood().key()[1])) {


					self.displayedGemMarkers()[i].marker.setMap(map);
					self.displayedGemMarkers()[i].isDisplayed(true);
				}
			}
			
			directionsDisplay.setMap(null);
			$("#hidedirectionsdiv").addClass("displaynone");
		}
	});

	self.selectedCountry.subscribe(function(newSelection) {

		self.abortAjaxCalls("city");
		self.abortAjaxCalls("neighborhood");
		self.abortAjaxCalls("gem");
		self.abortAjaxCalls("wiki");
		self.abortAjaxCalls("nytimes");

    	self.filterCities();
    	self.resetOptions("neighborhood");
    	self.destroyDisplayedGemMarkers();
    	self.setSeletedLocationInfo();
    	self.showingDirections(false);

    	if (newSelection) {
    		//map.setCenter(newSelection.location());
    	}

    	self.setNumDisplayedGems();
	});

	self.selectedCity.subscribe(function(newSelection) {

		self.abortAjaxCalls("neighborhood");
		self.abortAjaxCalls("gem");
		self.abortAjaxCalls("wiki");
		self.abortAjaxCalls("nytimes");

    	self.destroyDisplayedGemMarkers();
		self.filterNeighborhoods();
		self.setSeletedLocationInfo();
		self.showingDirections(false);

    	if (newSelection) {

    		console.log(newSelection);
    		if (newSelection.name() == "Chiang Mai") {

    			map.setCenter(chiangMaiLatLon);
       			map.setZoom(13);
    		}
    		else if (newSelection.name() == "Bangkok") {

    			map.setCenter(bangkokLatLon);
    			map.setZoom(12);
    		}
    	}

    	self.setNumDisplayedGems();
	});

	self.selectedNeighborhood.subscribe(function(newSelection) {

		self.abortAjaxCalls("gem");
		self.abortAjaxCalls("wiki");
		self.abortAjaxCalls("nytimes");

    	self.showingDirections(false);

    	if (newSelection) {

			self.setSeletedLocationInfo();
    		self.filterGems(newSelection["key"]());
    		//map.setCenter(newSelection.location());
    	}
    	else {

    		self.filterNeighborhoods();
    	}

    	self.setNumDisplayedGems();
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

		self.setNumDisplayedGems();
	}

	// maybe i could pass a singular ajax call a callback function instead of re-typing?
	// could also map country -> list of cityobj to make this simpler
	// (also for cities -> neighborhoods etc)

	self.filterCities = function () {
		// filter cities by populating select options from selected country city keys
		// if city has not been loaded into client memory, load from server
		self.resetOptions("city");
		self.resetOptions("neighborhood");
		self.destroyDisplayedGemMarkers();

		if (typeof self.selectedCountry() != "undefined") {

			var cityKeyList = self.selectedCountry().cities();

			for (var i = 0; i < cityKeyList.length; i++) {

				var thisCityKey = cityKeyList[i];

				if (thisCityKey in self.loadedCities) {

					self.optionCities.push(self.loadedCities[thisCityKey]);
					self.optionCities.sort();
				}
				else {

					$("#googlemaploadinggif").removeClass("displaynone");
					(function(thisCityKey) {

						var ajaxCityCall = $.ajax({
							type: "GET",
							url: "/GetByKey",
							headers: {"key":thisCityKey}
						}).done(function(data) {
							$("#googlemaploadinggif").addClass("displaynone");
							var dataJSON = JSON.parse(data);
							// add city to loaded cities add to options
							var thisCity = new City(dataJSON);
							self.loadedCities[thisCityKey] = thisCity;
							self.optionCities.push(thisCity);
							self.optionCities.sort();
							// to meet udacity requirements of "display at least 5 markers at start"
							// remove for production
							if (thisCity.name() == "Chiang Mai") {

								self.selectedCity(thisCity);
							}
						}).fail(function(error) {

							$("#googlemaploadinggif").addClass("displaynone");
							window.alert("Error retrieving cities from the server");
						});

						self.currentAjaxCalls["city"][ajaxCityCall] = true;
						ajaxCityCall.complete(function() {

							delete self.currentAjaxCalls["city"][ajaxCityCall];
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
		self.destroyDisplayedGemMarkers();

		// question: set bool for "came from user selection"?

		if (typeof self.selectedCity() != "undefined") {

			var neighborhoodKeyList = self.selectedCity().neighborhoods();

			for (var i = 0; i < neighborhoodKeyList.length; i++) {

				var thisNeighborhoodKey = neighborhoodKeyList[i];

				if (thisNeighborhoodKey in self.loadedNeighborhoods) {

					self.optionNeighborhoods.push(self.loadedNeighborhoods[thisNeighborhoodKey]);
					self.optionNeighborhoods.sort();
					self.displayGems(thisNeighborhoodKey);
				}
				else {
		
					$("#googlemaploadinggif").removeClass("displaynone");
					(function(thisNeighborhoodKey) {

						var ajaxNeighborhoodCall = $.ajax({
							type: "GET",
							url: "/GetByKey",
							headers: {"key":thisNeighborhoodKey}
						}).done(function(data) {
							
							$("#googlemaploadinggif").addClass("displaynone");
							var dataJSON = JSON.parse(data);
							// add neighborhood to loaded neighborhoods, add to options, then display gems
							var thisNeighborhood = new Neighborhood(dataJSON);
							self.loadedNeighborhoods[thisNeighborhoodKey] = thisNeighborhood;

							//next line could be more efficient if use observable
							self.setNumDisplayedGems();

							self.optionNeighborhoods.push(thisNeighborhood);
							self.optionNeighborhoods.sort();
							self.displayGems(thisNeighborhoodKey);
						}).fail(function(error) {

							$("#googlemaploadinggif").addClass("displaynone");
							window.alert("Error retrieving neighborhoods from the server");
						});

						self.currentAjaxCalls["neighborhood"][ajaxNeighborhoodCall] = true;
						ajaxNeighborhoodCall.complete(function() {

	    					delete self.currentAjaxCalls["neighborhood"][ajaxNeighborhoodCall];
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

			if (thisGemKey in self.loadedGems) {

				thisGem = self.loadedGems[thisGemKey];
				// cant put this after if because need to do it inside async ajax call below
				// probably could use refactoring
				var thisGemMarker = new GemMarker(thisGem, self.loadedNeighborhoods[neighborhoodKey]["name"]);
				
				if (thisGemMarker.marker) {

					thisGemMarker.marker.addListener("click", 
						function(gemMarker) {
							
							return function() {self.toggleGemMarker(gemMarker)};
						}(thisGemMarker)
					);
				}
				self.displayedGemMarkers.push(thisGemMarker);
			}
			else {

				$("#googlemaploadinggif").removeClass("displaynone");

				(function(thisGemKey) {

					var ajaxGemCall = $.ajax({
						type: "GET",
						url: "/GetByKey",
						headers: {"key":thisGemKey}
					}).done(function(data) {
						
						$("#googlemaploadinggif").addClass("displaynone");
						var dataJSON = JSON.parse(data);
						dataJSON["neighborhoodName"] = self.loadedNeighborhoods[neighborhoodKey].name();
						// add gem to loaded gems, then to displayed gems
						var newGem = new Gem(dataJSON);

						setTimeout(function(){self.setGemNameOnServer(newGem);}, 2000);

						self.loadedGems[newGem["key"]()] = newGem;
						var thisGemMarker = new GemMarker(newGem);

						if (thisGemMarker.marker) {

							thisGemMarker.marker.addListener("click", 
								function(gemMarker) {
									 
									return function() {self.toggleGemMarker(gemMarker)};
								}(thisGemMarker)
							);
						}
						self.displayedGemMarkers.push(thisGemMarker);
					}).fail(function(error) {

						$("#googlemaploadinggif").addClass("displaynone");
						window.alert("Error retrieving gems from the server");
					});

					self.currentAjaxCalls["gem"][ajaxGemCall] = true;
					ajaxGemCall.complete(function() {

	    				delete self.currentAjaxCalls["gem"][ajaxGemCall];
	    			});
				})(thisGemKey);
			}
		}
	};

	self.filterGems = function (neighborhoodKey) {
		// filter gems by selected neighborhood

		var displayedGemMarker;
		var displayedGemKey;
		var displayedGem;

		// take care of any gems that have already been loaded
		for (var i = 0; i < self.displayedGemMarkers().length; i++) {

			displayedGemMarker = self.displayedGemMarkers()[i];
			displayedGemKey = displayedGemMarker.gemKey;
			displayedGem = self.loadedGems[displayedGemKey];

			if (displayedGem.neighborhood()[0][1] == neighborhoodKey[1]) {

				if (displayedGemMarker.marker) {

					displayedGemMarker.marker.setMap(map);
				}
				
				displayedGemMarker.isDisplayed(true);
			}
			else {

				if (displayedGemMarker.marker) {
					
					displayedGemMarker.marker.setMap(null);
				}
				
				displayedGemMarker.isDisplayed(false);
			}
		}

		// take care of any stragglers that were not loaded due to aborting ajax calls
		// because of quick user selections (remember, newly created gems are automatically displayed)

		var neighborhood = self.loadedNeighborhoods[neighborhoodKey];

		for (var i = 0; i < neighborhood.gems().length; i++) {

			var thisGemKey = neighborhood.gems()[i];
			
			if (!(thisGemKey in self.loadedGems)) {
				// TO-DO: refactor with other similar calls

				$("#googlemaploadinggif").removeClass("displaynone");
				(function(thisGemKey) {

					var ajaxGemCall = $.ajax({
						type: "GET",
						url: "/GetByKey",
						headers: {"key":thisGemKey}
					}).done(function(data) {
						
						$("#googlemaploadinggif").addClass("displaynone");
						var dataJSON = JSON.parse(data);
						dataJSON["neighborhoodName"] = neighborhood.name();
						// add gem to loaded gems, then to displayed gems
						var newGem = new Gem(dataJSON);

						setTimeout(function(){self.setGemNameOnServer(newGem);}, 2000);

						self.loadedGems[newGem["key"]()] = newGem;
						var thisGemMarker = new GemMarker(newGem);

						if (thisGemMarker.marker) {

							thisGemMarker.marker.addListener("click", 
								function(gemMarker) {
									 
									return function() {self.toggleGemMarker(gemMarker)};
								}(thisGemMarker)
							);
						}
						self.displayedGemMarkers.push(thisGemMarker);
					}).fail(function(error) {

						$("#googlemaploadinggif").addClass("displaynone");
						window.alert("Error retrieving gems from the server");
					});

					self.currentAjaxCalls["gem"][ajaxGemCall] = true;
					ajaxGemCall.complete(function() {

	    				delete self.currentAjaxCalls["gem"][ajaxGemCall];
	    			});
				})(thisGemKey);	
			}
		}
	}

	self.destroyDisplayedGemMarkers = function () {

		for (var i = 0; i < self.displayedGemMarkers().length; i++) {

			if (self.displayedGemMarkers()[i].marker) {
				
				self.displayedGemMarkers()[i].marker.setMap(null);
				self.displayedGemMarkers()[i].marker = null;
			}

			self.displayedGemMarkers()[i].isDisplayed(false);
			self.displayedGemMarkers()[i].data = null;
		}

		self.displayedGemMarkers.removeAll();
		// now no references to my Marker object or the related google map Marker object
		// are stored anywhere, so will be destroyed
	}

	self.populateCountries = function (countriesJSON) {

		for (var i = 0; i < countriesJSON.length; i++) {
		
			country = new Country(countriesJSON[i]);
			self.loadedCountries[country["key"]()] = country;
			self.optionCountries.push(country);
			self.optionCountries.sort();

			// to meet udacity requirements of "display at least 5 markers at start"
			// remove for production
			if (country.name() == "Thailand") {

				self.selectedCountry(country);
			}
		}
	};

	self.populateCities = function (citiesJSON) {

		for (var i = 0; i < citiesJSON.length; i++) {
		
			city = new City(citiesJSON[i]);
			self.loadedCities[city["key"]()] = city;
			self.optionCities.push(city);
			self.optionCountries.sort();
		}
	};

	self.populateInitialCountries = function(pythonDictParamString) {
		// ajax query to server for initial country

		$("#googlemaploadinggif").removeClass("displaynone");
		var ajaxCountryCall = $.ajax({
			type: "GET",
			url: "/GetLocales",
			headers: {"Kind":"country", "Queryparams":pythonDictParamString}
		}).done(function(data) {
			
			$("#googlemaploadinggif").addClass("displaynone");
			var dataJSON = JSON.parse(data);

			self.populateCountries(dataJSON);
		}).fail(function(error) {

			$("#googlemaploadinggif").addClass("displaynone");
			window.alert("Error retrieving data from the server");
		});

		self.currentAjaxCalls["country"][ajaxCountryCall] = true;
		ajaxCountryCall.complete(function() {

	    	delete self.currentAjaxCalls["country"][ajaxCountryCall];
	    });
	};

	self.toggleGemMarker = function (gemMarker) {
		// set selected gem and infowindo html, and toggle animation	
		if (!gemMarker.marker) {

			return;
		}

		var thisGem = self.loadedGems[gemMarker.gemKey];
		self.selectedGem(thisGem);

    	infoWindow.close();
    	infoWindow.open(map, gemMarker.marker);

    	// clone node, remove class display none and change id
    	// or else only one info window will ever appear because the div is destroyed
    	var info = document.getElementById("geminfowindowselector");
    	var clone = info.cloneNode(true);
    	clone.id = "realwindow";
    	clone.className = "";

    	// attach event listener to infobox button because data-bind="click: $parent.getDirections"
    	// does not work when cloned into the infobox
		var directionsButton = clone.getElementsByTagName("div")[0].getElementsByTagName("button")[0];
		directionsButton.addEventListener("click", function () {

			self.getDirections(gemMarker.marker.position);
		});

    	infoWindow.setContent(clone);

    	if (gemMarker.marker) {
			
			gemMarker.marker.setAnimation(google.maps.Animation.BOUNCE);
			setTimeout(function(){ gemMarker.marker.setAnimation(null); }, 1500);
		}
	};

	/* Third Party API Related
	*/

	// utility only for completely new gems
	// gets nearest, most specific place name from reverse geocode call and sets on server
	self.setGemNameOnServer = function (gem) {

		if (gem.name() == "Generic Gem") {

			var latlngStr = gem.location().split(',');
			var latlng = {lat: parseFloat(latlngStr[0]), lng: parseFloat(latlngStr[1])};

			// TO-DO: change language based on user language
			geocoder.geocode({'location': latlng, 'language':"en"}, function(results, status) {

				if (status === 'OK') {
					
					if (results[0] && results[0]["address_components"][0]) {

						var number;
						var lessSpecific;
						var newName = "Gem near ";

						// assumes if there is a number, there is also at least one less specific
						if (results[0]["address_components"][0]["types"].includes("street_number")) {

							number = results[0]["address_components"][0]["long_name"];
							lessSpecific = results[0]["address_components"][1]["long_name"];
							newName += number + " " + lessSpecific;
						}
						else {
							//test comment!
							newName += results[0]["address_components"][0]["long_name"];
						}

						// set the name for this client instance
						gem.name(newName);

						// set on server for good
						(function(thisGemKey) {
							var ajaxGemCall = $.ajax({
								type: "GET",
								url: "/SetGemName",
								headers: {"key":thisGemKey, "newName": encodeURIComponent(newName)}
							}).done(function(response) {

							}).fail(function(error) {

								window.alert("Failed to put new name in server");
							});
							self.currentAjaxCalls["gem"][ajaxGemCall] = true;
							ajaxGemCall.complete(function() {

	    						delete self.currentAjaxCalls["gem"][ajaxGemCall];
	    					});
						})(gem.key());					
					} 
					else {
			    
			    		window.alert('No results found for reverse geolocation');
			 		}
				}
				else {
				  
				  window.alert('Geocoder failed due to: ' + status);
				}
			});
		}
	};

	self.ensureGemMarkersHaveMarker = function() {
		// useful if async google map api load finished after GemMarkers are created

		var thisGemMarker;

		for (var i = 0; i < self.displayedGemMarkers().length; i++) {

			thisGemMarker = self.displayedGemMarkers()[i];
			
			if (!thisGemMarker.marker) {
				// candidate for re-factor -- use same code to create a gem elsewhere

				var thisGem = self.loadedGems[self.displayedGemMarkers()[i].gemKey];
				var coords = thisGem.location().split(",");

				thisGemMarker.marker = new google.maps.Marker({

					position: {lat: parseFloat(coords[0]), lng: parseFloat(coords[1])},
					map: map,
					animation: google.maps.Animation.DROP,
					title: thisGem.name()
				});

				thisGemMarker.marker.addListener("click", 
					function(gemMarker) {
						 
						return function() {self.toggleGemMarker(gemMarker)};
					}(thisGemMarker)
				);
			}
		}
	};

	self.setCurrentGoogleMapLocation = function () {

		detectUserLocation();
	};

    self.getDirections = function (endLocation) {

    	if (yourLocationMarker) {

			showDirections(endLocation, yourLocationMarker.position, "WALKING");
			self.showingDirections(true);
    	}
    	else {

    		window.alert("Location services don't seem to be enabled. \
    			Try pressing the green \"Center map on my location\" button.");
    	}
    };

    self.setSeletedLocationInfo = function () {
    	// do async calls or other view setting for selected location

    	// reset the info
    	self.selectedLocationWikiInfo([]);
    	self.selectedLocationNYTimesInfo([]);

    	// customize third part API calls
    	if (typeof self.selectedNeighborhood() != 'undefined') {

	    	self.setSelectedLocationWikiInfo(self.selectedNeighborhood().name());
	    	self.setSelectedLocationNYTimesInfo(self.selectedNeighborhood().name());
    	}
    	else if (typeof self.selectedCity() != 'undefined') {

	    	self.setSelectedLocationWikiInfo(self.selectedCity().name() + ", " + self.selectedCountry().name());
	    	self.setSelectedLocationNYTimesInfo(self.selectedCity().name() + ", " + self.selectedCountry().name());
    	}
    	else if (typeof self.selectedCountry() != 'undefined') {

	    	self.setSelectedLocationWikiInfo(self.selectedCountry().name());
	    	self.setSelectedLocationNYTimesInfo(self.selectedCountry().name());
    	}
    };

    self.setSelectedLocationWikiInfo = function(location) {
    	// load wikipedia links related to a location

    	// TO-DO: is there a better (more accurate/secure) way of determining 
    	// whether the user is at the https or http version?
    	// (wiki ajax call fails if user is at https and wiki ajax url is http)
    	/*
    	var currentURL = document.URL;
    	var wikiAjaxURL;
    	if (currentURL.substring(0, 5) == "https") {

    		wikiAjaxURL = "https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch="+location+"&prop=revisions|links&rvprop=content&callback=?";
    	}
    	else {
    	*/

		wikiAjaxURL = "https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch="+location+"&prop=revisions|links&rvprop=content&callback=?";

	    var titles = [];

		$("#wikiinfoloadinggif").removeClass("displaynone");
	    // get the titles
	    var ajaxWikiCall = $.ajax({
	        url: wikiAjaxURL,
	        dataType: "json",
	        type: "GET",
	        success: function(data) {

	            if ("query" in data) {

	                $(data.query.search).each(function(key, value) {

	                    var thisTitle = $(this)[0].title;

	                    // instead of another ajax call to get pageid, 
	                    // could probably link to directly
	                    var thisArticleAjax = "https://en.wikipedia.org/w/api.php?action=query&format=json&titles="+thisTitle+"&prop=revisions&rvprop=content&callback=?";
	                    
	                    $.ajax({
	                        url: thisArticleAjax,
	                        dataType: "json",
	                        type: "GET",
	                        success: function(data) {
								
								$("#wikiinfoloadinggif").addClass("displaynone");
	                            var thisID = "";

	                            for (var name in data.query.pages) {

	                                thisID = name.toString();
	                            }

	                            var infoObj = {
	                            	title: data.query.pages[thisID].title,
	                            	articleID: thisID,
	                            	linkText: data.query.pages[thisID].title,
	                            	linkRef: "http://en.wikipedia.org/?curid="+thisID,
	                            	extraText: ""
	                            }

	                            var thisWikiInfo = new WikipediaInfo(infoObj);
	                            self.selectedLocationWikiInfo.push(thisWikiInfo);
	                        }
	                    }).fail(function(error) {

							$("#wikiinfoloadinggif").addClass("displaynone");
	                        window.alert("Error retrieving Wikipedia link to '"+thisTitle+".");
	                    });
	                });
	            }
	            else {

					$("#wikiinfoloadinggif").addClass("displaynone");
	                window.alert("No Wikipedia pages matching '" + location + "'");   
	            }    
	        }
	    }).fail(function(error) {

			$("#wikiinfoloadinggif").addClass("displaynone");
	        window.alert("Error retrieving Wikipedia links");
	    });
	    self.currentAjaxCalls["wiki"][ajaxWikiCall] = true;
	    ajaxWikiCall.complete(function() {

	    	delete self.currentAjaxCalls["wiki"][ajaxWikiCall];
	    });
    };

    self.setSelectedLocationNYTimesInfo = function(location) {
	    // load NY Times articles related to a location

	    var nyTimesArticleAjaxURL =  "https://api.nytimes.com/svc/search/v2/articlesearch.json?";
	    var nyTimesArticleAjaxQuery = "q="+location;
	    var nyTimesAPIKey = "api-key=89e8e32dba894924b8bbfefe96c5f71c";

	    nyTimesArticleAjaxURL = nyTimesArticleAjaxURL+nyTimesArticleAjaxQuery+"&"+nyTimesAPIKey;

		$("#nytimesinfoloadinggif").removeClass("displaynone");
	    var ajaxNYTimesCall = $.getJSON(nyTimesArticleAjaxURL, function(data) {  

			$("#nytimesinfoloadinggif").addClass("displaynone");
	        articles = data.response.docs;

	        for (i = 0; i < articles.length; i++) {

	            var link = "";
	            var headline = "";

	            var article = articles[i];

	            articleObj = {
	            	title: article.headline.main,
	            	linkText: article.headline.main,
	            	linkRef: article.web_url,
	            	extraText: ""
	            }

	            thisNYTimesInfo = new NYTimesInfo(articleObj);
	            self.selectedLocationNYTimesInfo.push(thisNYTimesInfo);
	        }
	    }).fail(function (error) {

			$("#nytimesinfoloadinggif").addClass("displaynone");
	        window.alert("Error retrieving NY Times articles");
	    });

	    self.currentAjaxCalls["nytimes"][ajaxNYTimesCall] = true;
	    ajaxNYTimesCall.complete(function() {

	    	delete self.currentAjaxCalls["nytimes"][ajaxNYTimesCall];
	    });
    };

    /* Initialization
    */
	(function() {

		// if more than one country, should not populate cities at start
		// so do not have to set country upon city selection by user
		self.populateInitialCountries("");
	})();
}

/*
*
*	GoogleMaps
*
*/
// embed the Google Map
function initMap() {

	// check if Google Map api called failed
	if (typeof google != 'object' && typeof google.maps != 'object') {

		window.alert("Google Map failed to load.");
		return;
	}

	map = new google.maps.Map(document.getElementById('googlemap'), {
	  	
	  	center: chiangMaiLatLon, // TO-DO: change for production?
	  	scrollwheel: false,
	  	zoom: 13
	});

    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;
    geocoder = new google.maps.Geocoder;
	infoWindow = new google.maps.InfoWindow({map: null});

	//uncomment next line for production (this is commented to meet udacity requirements)
	//detectUserLocation();

    directionsDisplay.setMap(map);

    // tell the view model the google map has been loaded so gems can be connected to markers
    if (typeof viewModel != "undefined") {

    	viewModel.googleMapIsLoaded(true);
    }
}

function detectUserLocation () {
	// Try HTML5 geolocation and render marker

	if (typeof google != 'object' && typeof google.maps != 'object') {

		window.alert("Google Map was not loaded correctly, so there's no location to show.");
		return;		
	}

    if (navigator.geolocation) {

		$("#googlemaploadinggif").removeClass("displaynone");
      	navigator.geolocation.getCurrentPosition(function(position) {
        	var pos = {
          		lat: position.coords.latitude,
          		lng: position.coords.longitude
        	};

        	map.setCenter(pos);
        	map.setZoom(15);

			$("#googlemaploadinggif").addClass("displaynone");
        	createAndRenderLocationMarker(map.getCenter());
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

function createAndRenderLocationMarker(yourLocation) {
	// show location on map

	if (typeof google != 'object' && typeof google.maps != 'object') {

		window.alert("Google Map was not loaded correctly, so there's no location to show.");
		return;
	}

	// if already showing, destroy old marker
	if (yourLocationMarker != null) {

		yourLocationMarker.setMap(null);
		yourLocationMarker = null;
	}

	var yourLocationIcon = {

		path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
		fillColor: '#009900',
		fillOpacity: 1.0,
		scale: 4,
		strokeColor: '#000000',
		strokeWeight: 1
	};

	yourLocationMarker = new google.maps.Marker({

		position: yourLocation,
		icon: yourLocationIcon,
		map: map
	});

    infoWindow.open(map, yourLocationMarker);
    infoWindow.setContent("You are here");

	yourLocationMarker.addListener("click", function() {

		infoWindow.close();
    	infoWindow.open(map, yourLocationMarker);

    	infoWindow.setContent("You are here");
	});
}

// show directions from current location to selected marker
function showDirections(destination, origin, travelMode) {

	if (typeof google != 'object' && typeof google.maps != 'object') {

		window.alert("Google Map was not loaded correctly, so there's no directions to show.");
		return;
	}

    var request = {
      	destination: destination,
      	origin: origin,
      	travelMode: travelMode
    };

    directionsService.route(request, function(response, status) {

		if (status === 'OK') {

			directionsDisplay.setMap(map);
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

    var width = $("#googlemapdiv").width();
	$("#googlemapdiv").css({"height":width+"px"});
}

function setLocationLoadingPosition() {

	var heightOffset = $("#googlemapdiv").height() / 2;
	$("#googlemaploadinggif").css({"top":"-"+heightOffset+"px"});
}

function alertUserOfError(errorMessage) {

	window.alert(errorMessage);
}

/*
*
*	Initialize and run the app
*
*/
// enable the KnockoutJS framework
viewModel = new ViewModel;
ko.applyBindings(viewModel);

/*

problem: 

factors:
1. GemMarkers are created with google marker from google api as a property
2. Google api might not be loaded yet when GemMarkers are made 
(e.g., if app init sets selections, GemMarkers might be created before map api loads)

therefore: GemMarkers might not function properly (clicks, display).

solution:

*/

