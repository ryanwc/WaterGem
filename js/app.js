/*
*	Client-side WaterGem application.
*
*	Written with the KnockoutJS framework.
*
*/

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
	});

	self.selectedGem = ko.observable();
}

ko.applyBindings(new ViewModel);

