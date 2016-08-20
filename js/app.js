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
*	Global Google Map API vars that need to be accessed by the rest of the program
*
*/

var map;
var infoWindow;
var directionsService;
var directionsDisplay;
var yourLocationMarker;

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
	self.marker = new google.maps.Marker({

		position: {lat: parseFloat(coords[0]), lng: parseFloat(coords[1])},
		map: map,
		animation: google.maps.Animation.DROP,
		title: data["name"]()
	});
}

var Gem = function (data) {

	var self = this;

	// data from server
	self.name = ko.observable("Gem (water refill)");
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

	// track current user selections
	self.selectedGem = ko.observable();
	self.selectedNeighborhood = ko.observable();
	self.selectedCity = ko.observable();
	self.selectedCountry = ko.observable();

	// displayed options
	self.optionCountries = ko.observableArray([]);
	self.optionCities = ko.observableArray([]);
	self.optionNeighborhoods = ko.observableArray([]);

	// holds Markers (with data as gem and marker as google api marker)
	self.displayedGemMarkers = ko.observableArray([]);

	// holds wiki and nyt info for selected location
	self.selectedLocationWikiInfo = ko.observableArray([]);
	self.selectedLocationNYTimesInfo = ko.observableArray([]);
	self.selectedLocationName = ko.observable("[select location]");

	self.showingDirections = ko.observable(false);

	/* helpers
	*/

	self.toggleShowingDirections = function() {

		self.showingDirections(!self.showingDirections());
	};

	self.clickGemFromListView = function (clickedGemMarker) {

		infoWindow.close();
		new google.maps.event.trigger(clickedGemMarker.marker, 'click' );
	};

	/* Custom listeners for selection changes
	*/

	// TO-DO: improve inefficient alphabetical sort of dropdowns after every change

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
					
				// should probaby only display if was displayed before
				self.displayedGemMarkers()[i].marker.setMap(map);
				self.displayedGemMarkers()[i].isDisplayed(true);
			}
			
			directionsDisplay.setMap(null);
			$("#hidedirectionsdiv").addClass("displaynone");
		}
	});

	self.selectedCountry.subscribe(function(newSelection) {

    	self.filterCities();
    	self.resetOptions("neighborhood");
    	self.destroyDisplayedGemMarkers();
    	self.setSeletedLocationInfo();
    	self.showingDirections(false);

    	if (newSelection) {
    		//map.setCenter(newSelection.location());
    	}
	});

	self.selectedCity.subscribe(function(newSelection) {

    	self.destroyDisplayedGemMarkers();
		self.filterNeighborhoods();
		self.setSeletedLocationInfo();
		self.showingDirections(false);

    	if (newSelection) {

    		//map.setCenter(newSelection.location());
    	}
	});

	self.selectedNeighborhood.subscribe(function(newSelection) {

    	self.showingDirections(false);

    	if (newSelection) {

			self.setSeletedLocationInfo();
    		self.filterGems(newSelection["key"]());
    		//map.setCenter(newSelection.location());
    	}
    	else {

    		self.filterNeighborhoods();
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

						$.ajax({
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

						$.ajax({
							type: "GET",
							url: "/GetByKey",
							headers: {"key":thisNeighborhoodKey}
						}).done(function(data) {
							
							$("#googlemaploadinggif").addClass("displaynone");
							var dataJSON = JSON.parse(data);
							// add neighborhood to loaded neighborhoods, add to options, then display gems
							var thisNeighborhood = new Neighborhood(dataJSON);
							self.loadedNeighborhoods[thisNeighborhoodKey] = thisNeighborhood;
							self.optionNeighborhoods.push(thisNeighborhood);
							self.optionNeighborhoods.sort();
							self.displayGems(thisNeighborhoodKey);
						}).fail(function(error) {

							$("#googlemaploadinggif").addClass("displaynone");
							window.alert("Error retrieving neighborhoods from the server");
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
				thisGemMarker.marker.addListener("click", 
					function(gemMarker) {
						 
						return function() {self.toggleGemMarker(gemMarker)};
					}(thisGemMarker)
				);
				self.displayedGemMarkers.push(thisGemMarker);
			}
			else {

				$("#googlemaploadinggif").removeClass("displaynone");

				(function(thisGemKey) {

					$.ajax({
						type: "GET",
						url: "/GetByKey",
						headers: {"key":thisGemKey}
					}).done(function(data) {
						
						$("#googlemaploadinggif").addClass("displaynone");
						var dataJSON = JSON.parse(data);
						dataJSON["neighborhoodName"] = self.loadedNeighborhoods[neighborhoodKey].name();
						// add gem to loaded gems, then to displayed gems
						var newGem = new Gem(dataJSON);
						self.loadedGems[newGem["key"]()] = newGem;
						var thisGemMarker = new GemMarker(newGem);
						thisGemMarker.marker.addListener("click", 
							function(gemMarker) {
								 
								return function() {self.toggleGemMarker(gemMarker)};
							}(thisGemMarker)
						);
						self.displayedGemMarkers.push(thisGemMarker);
					}).fail(function(error) {

						$("#googlemaploadinggif").addClass("displaynone");
						window.alert("Error retrieving gems from the server");
					});
				})(thisGemKey);
			}
		}
	};

	self.filterGems = function (neighborhoodKey) {
		// if selecting neighborhood, 
		// we know all of the gems in this city are displayed already
		var displayedGemMarker;
		var displayedGemKey;
		var displayedGem;

		for (var i = 0; i < self.displayedGemMarkers().length; i++) {

			displayedGemMarker = self.displayedGemMarkers()[i];
			displayedGemKey = displayedGemMarker.gemKey;
			displayedGem = self.loadedGems[displayedGemKey];

			if (displayedGem.neighborhood()[0][1] == neighborhoodKey[1]) {

				displayedGemMarker.marker.setMap(map);
				displayedGemMarker.isDisplayed(true);
			}
			else {

				displayedGemMarker.marker.setMap(null);
				displayedGemMarker.isDisplayed(false);
			}
		}
	}

	self.destroyDisplayedGemMarkers = function () {

		for (var i = 0; i < self.displayedGemMarkers().length; i++) {

			self.displayedGemMarkers()[i].marker.setMap(null);
			self.displayedGemMarkers()[i].isDisplayed(false);
			self.displayedGemMarkers()[i].marker = null;
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

	self.populateLocale = function(kind, pythonDictParamString) {
		// ajax query to server for initial select options locales (e.g., countries, cities)
		// if have many more countries, mofify to only populate cities by country select
		$("#googlemaploadinggif").removeClass("displaynone");
		$.ajax({
			type: "GET",
			url: "/GetLocales",
			headers: {"Kind":kind, "Queryparams":pythonDictParamString}
		}).done(function(data) {
			
			$("#googlemaploadinggif").addClass("displaynone");
			var dataJSON = JSON.parse(data);

			if (kind == "country") {

				self.populateCountries(dataJSON);
			}
			else if (kind == "city") {

				self.populateCities(dataJSON);
			}
		}).fail(function(error) {

			$("#googlemaploadinggif").addClass("displaynone");
			window.alert("Error retrieving data from the server");
		});
	};

	self.toggleGemMarker = function (gemMarker) {
		// set selected gem and infowindo html, and toggle animation	
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

		gemMarker.marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function(){ gemMarker.marker.setAnimation(null); }, 1500);
	};

	/* Third Party API Related
	*/

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

    	// reset the info
    	self.selectedLocationWikiInfo([]);
    	self.selectedLocationNYTimesInfo([]);

    	var location;
    	var name;

    	if (typeof self.selectedNeighborhood() != 'undefined') {

    		location = self.selectedNeighborhood().name();
    		name = location + ", " + self.selectedCity().name() + ", " + self.selectedCountry().name();
    		self.selectedLocationName(name);
    	}
    	else if (typeof self.selectedCity() != 'undefined') {

    		location = self.selectedCity().name();
    		name = location + ", " + self.selectedCountry().name();
    		self.selectedLocationName(name);
    	}
    	else if (typeof self.selectedCountry() != 'undefined') {

    		location = self.selectedCountry().name();
    		self.selectedLocationName(location);
    	}
    	else {

    		self.selectedLocationName("[select location]");
    		// don't search for no location
    		return;
    	}

    	// set top 3 related wiki entries and top 5 related nytimes articles
    	self.setSelectedLocationWikiInfo(location);
    	self.setSelectedLocationNYTimesInfo(location);
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
	    $.ajax({
	        url: wikiAjaxURL,
	        dataType: "json",
	        type: "GET",
	        success: function(data) {

	            if ("query" in data) {

	                $(data.query.search).each(function(key, value) {

	                    var thisTitle = $(this)[0].title;

	                    // instead of another ajax call to get pageid, 
	                    // could probably link to directly
	                    // TO-DO: why does this still give a mixed content error, thinking
	                    // the below URL is http and not https? (even prints to console as http
	                    // in the error message... really weird)
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
    };

    self.setSelectedLocationNYTimesInfo = function(location) {
	    // load NY Times articles related to a location

	    var nyTimesArticleAjaxURL =  "https://api.nytimes.com/svc/search/v2/articlesearch.json?";
	    var nyTimesArticleAjaxQuery = "q="+location;
	    var nyTimesAPIKey = "api-key=89e8e32dba894924b8bbfefe96c5f71c";

	    nyTimesArticleAjaxURL = nyTimesArticleAjaxURL+nyTimesArticleAjaxQuery+"&"+nyTimesAPIKey;

		$("#nytimesinfoloadinggif").removeClass("displaynone");
	    $.getJSON(nyTimesArticleAjaxURL, function(data) {  

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
    };

    /* Initialization
    */
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
	  	
	  	center: {lat: 18.7869, lng: 98.9865}, // should be lat: 18.7061, lng: 98.9817 for production
	  	scrollwheel: false,
	  	zoom: 15 // should be 13 for production
	});

    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;
	infoWindow = new google.maps.InfoWindow({map: null});

	//uncomment next line for production (this is commented to meet udacity requirements)
	//detectUserLocation();



    directionsDisplay.setMap(map);
}

function detectUserLocation () {
	// Try HTML5 geolocation and render marker

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

/*
*
*	Initialize and run the app
*
*/
// enable the KnockoutJS framework
ko.applyBindings(new ViewModel);

