// These are the highlighted places that will be shown to the user.
var locations = [
    {title: 'Alamo Drafthouse Cinema - Mueller', location: {lat: 30.2983881, lng: -97.7069012}, type: "Entertainment"},
    {title: 'Mueller Lake Park', location: {lat: 30.2967706, lng: -97.7080463}, type: "Park"},
    {title: 'The University of Texas at Austin', location: {lat: 30.2849185, lng: -97.7362507}, type: "Educational"},
    {title: 'LBJ Presidential Library', location: {lat: 30.2858226, lng: -97.7314551}, type: "Educational"},
    {title: 'Texas State Capitol', location: {lat: 30.2746652, lng: -97.7425445}, type: "Landmark"},
    {title: 'Zilker Metropolitan Park', location: {lat: 30.2669624, lng: -97.7750533}, type: "Park"},
    {title: 'Congress Avenue Bridge', location: {lat: 30.2617381, lng: -97.7473572}, type: "Landmark"},
    {title: 'Esther\'s Follies', location: {lat: 30.26629, lng: -97.739697}, type: "Entertainment"},
    {title: 'Austin City Limits - Moody Theater', location: {lat: 30.2655492, lng: -97.7473226}, type: "Entertainment"},
    {title: 'Antone\'s Nightclub', location: {lat: 30.2660481, lng: -97.7404002}, type: "Entertainment"}
];

var filterTypes = ["None", "Entertainment", "Park", "Educational", "Landmark"];

// Global variable to create a single Google map
var map;

// Create a new blank array for all the listing markers.
var markers = [];

// This global polygon variable is to ensure only ONE polygon is rendered.
var polygon = null;

// This info window is used to ensure only ONE infoWindow is rendered
var largeInfowindow;

// Create ViewModel variable to be able to subscribe to later
var myViewModel;


/**
 *  KnockoutJS ViewModel
 */
var ViewModel = function () {
    var self = this;

    this.placeList = ko.observableArray([]);

    locations.forEach(function (dataItem) {
        self.placeList.push(new Locale(dataItem));
    });

    this.selectedMarker = ko.observable({});

    this.isActive = ko.observable('');

    self.toggleSidebar = function() {
        if (self.isActive() === ''){
            self.isActive('active');
        } else {
            self.isActive('');
        }
    };

    self.filters = ko.observableArray(filterTypes);
    self.filter = ko.observable('');
    self.filteredItems = ko.computed(function() {
        var filter = self.filter();
        if (!filter || filter === "None") {
            return self.placeList();
        } else {
            return ko.utils.arrayFilter(self.placeList(), function(i) {
                return i.filterType() === filter;
            });
        }
    });

    /*
     Setting up Google Markers and listeners within ViewModel
     */

    changeMarkers(locations);

    // Method to change the selected marker on the map when a location is selected from the list
    self.changeSelectedMarker = function () {
        var marker = getMarker(this.title());
        self.selectedMarker(marker);
        populateInfoWindow(marker, largeInfowindow);
        marker.setAnimation()
    }
};

var Locale = function (data) {
    this.title = ko.observable(data.title);
    this.lat = ko.observable(data.location.lat);
    this.lng = ko.observable(data.location.lng);
    this.location = ko.computed(function () {
        return {lat: this.lat, lng: this.lng};
    }, this);
    this.filterType = ko.observable(data.type);
};


function mapsError() {
    $('<div class="row"><h2 class="col-12-md error">Google Maps failed to load!</h2></div>').appendTo('#map');
}




// Helper function to get the marker from the marker array with a given title
function getMarker(markerTitle) {
    for (i=0; i < markers.length; i++){
        if (markers[i].title === markerTitle){
            return markers[i];
        }
    }
}

// Helper function to update the array of markers
function changeMarkers(current_locations) {

    // Style the markers a bit. This will be our listing marker icon.
    var defaultIcon = makeMarkerIcon('0091ff');

    // Create a "highlighted location" marker color for when the user
    // mouses over the marker.
    var highlightedIcon = makeMarkerIcon('FFFF24');

    // Create an icon color to highlight the selected marker
    var selectedIcon = makeMarkerIcon('FF8C00');

    // Loop through markers and set map to null for each
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }

    // Reset markers each time
    markers =  [];

    // The following group uses the location array to create an array of markers on initialize.
    for (var i = 0; i < current_locations.length; i++) {
        // Get the position from the location array.
        var position = current_locations[i].location;
        var title = current_locations[i].title;
        // Create a marker per location, and put into markers array.
        var marker = new google.maps.Marker({
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            icon: defaultIcon,
            id: i
        });

        // Create an onclick event to open the large infowindow at each marker.
        marker.addListener('click', function () {
            var markerSelf = this;

            populateInfoWindow(this, largeInfowindow);
            // Set current marker to selected marker
            myViewModel.selectedMarker(this);

            // Animate the marker with a bounce to show it is selected
            markerSelf.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function(){ markerSelf.setAnimation(null); }, 2100);
        });
        // Two event listeners - one for mouseover, one for mouseout,
        // to change the colors back and forth.
        marker.addListener('mouseover', function () {
            this.setIcon(highlightedIcon);
        });
        marker.addListener('mouseout', function () {
                this.setIcon(defaultIcon);
        });

        // Push the marker to our array of markers.
        markers.push(marker);
    }
}





/**
 * Google map functions not handled by KnockoutJS
 */
function initMap() {
    myViewModel = new ViewModel();

    ko.applyBindings(myViewModel);

    largeInfowindow = new google.maps.InfoWindow()

    // Create a styles array to use with the map.
    var styles = [
        {
            featureType: 'water',
            stylers: [
                {color: '#19a0d8'}
            ]
        }, {
            featureType: 'administrative',
            elementType: 'labels.text.stroke',
            stylers: [
                {color: '#ffffff'},
                {weight: 6}
            ]
        }, {
            featureType: 'administrative',
            elementType: 'labels.text.fill',
            stylers: [
                {color: '#e85113'}
            ]
        }, {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [
                {color: '#efe9e4'},
                {lightness: -40}
            ]
        }, {
            featureType: 'transit.station',
            stylers: [
                {weight: 9},
                {hue: '#e85113'}
            ]
        }, {
            featureType: 'road.highway',
            elementType: 'labels.icon',
            stylers: [
                {visibility: 'off'}
            ]
        }, {
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [
                {lightness: 100}
            ]
        }, {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [
                {lightness: -100}
            ]
        }, {
            featureType: 'poi',
            elementType: 'geometry',
            stylers: [
                {visibility: 'on'},
                {color: '#f0e4d3'}
            ]
        }, {
            featureType: 'road.highway',
            elementType: 'geometry.fill',
            stylers: [
                {color: '#efe9e4'},
                {lightness: -25}
            ]
        }
    ];


    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 30.2672, lng: -97.7431},
        zoom: 11,
        styles: styles,
        mapTypeControl: false
    });


    // Initialize the drawing manager.
    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_LEFT,
            drawingModes: [
                google.maps.drawing.OverlayType.POLYGON
            ]
        }
    });


    // Add an event listener so that the polygon is captured,  call the
    // searchWithinPolygon function. This will show the markers in the polygon,
    // and hide any outside of it.
    drawingManager.addListener('overlaycomplete', function (event) {
        // First, check if there is an existing polygon.
        // If there is, get rid of it and remove the markers
        if (polygon) {
            polygon.setMap(null);
            hideMarkers(markers);
        }
        // Switching the drawing mode to the HAND (i.e., no longer drawing).
        drawingManager.setDrawingMode(null);
        // Creating a new editable polygon from the overlay.
        polygon = event.overlay;
        polygon.setEditable(true);
        // Searching within the polygon.
        searchWithinPolygon(polygon);
        // Make sure the search is re-done if the poly is changed.
        polygon.getPath().addListener('set_at', searchWithinPolygon);
        polygon.getPath().addListener('insert_at', searchWithinPolygon);
    });

    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);

    // Add listener to adjust bounds as user resizes their window
    google.maps.event.addDomListener(window, 'resize', function() {
        console.log("this was called");
        map.fitBounds(bounds);
    });

    /**
     * Helper subscribe function to update the markers on the map when
     * the associated item is selected from the list
     *
     */
    myViewModel.filteredItems.subscribe(function(newValues){
        var locationCopy = [];
        if(myViewModel.filter() === "None"){
            locationCopy = locations;
        } else {
            for (var i=0; i < locations.length; i++){
                for (var j=0; j < newValues.length; j++){
                    if (locations[i].title === myViewModel.filteredItems()[j].title()){
                        locationCopy.push(locations[i]);
                    }
                }
            }
        }
        changeMarkers(locationCopy);
        // Rerender the markers
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(map);
        }
    });
}


// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        // Clear the infowindow content to give the content time to load.
        infowindow.setContent('');
        infowindow.marker = marker;
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        });

        // var content = '<h5 id="infoContent">' + marker.title + '</h5>';
        // infowindow.setContent(content);
        // Get the foursquare reviews
        getFoursquareReviews(marker, infowindow);
        // Open the infowindow on the correct marker.
        infowindow.open(map, marker);
    }
}

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21,34));
    return markerImage;
}


/**
 *  Methods to handle Foursquare calls when the info window is populated
 *
 */

// Helper method to make an AJAX call to return some Yelp reviews for each location
function getFoursquareReviews(marker, infoWindow) {
    var baseFoursquareUrl = "https://api.foursquare.com/v2/venues/search?v=20161016";
    var foursquareAuth = "&client_id=CCNYGKJN5N4U5IGZMAPQAD4DKBGUFYUEQF3NGZ1113UEEHL5&client_secret=10XV4FYB5F5QISKXPBKSVGKO3KOWLBIVKONSRXK0BBR0FHFG";
    var searchUrl = baseFoursquareUrl + "&near=Austin,TX&query=" + marker.title + "&intent=checkin" + foursquareAuth;
    $.getJSON(encodeURI(searchUrl)).done(function(data){
        var foursquareId = data.response.venues[0].id;
        getReviewFromFoursquareId(foursquareId, marker, infoWindow);

    }).fail(function(){
        infoWindow.setContent('<br/><div class="infoText">Failed to load Foursquare Information</div>');
    });
}

// Helper function to get Foursquare reviews based on the location's Foursquare ID
function getReviewFromFoursquareId(fid, marker, infoWindow){
    var foursquareAuth = "&client_id=CCNYGKJN5N4U5IGZMAPQAD4DKBGUFYUEQF3NGZ1113UEEHL5&client_secret=10XV4FYB5F5QISKXPBKSVGKO3KOWLBIVKONSRXK0BBR0FHFG";
    var foursquareTipsUrl = "https://api.foursquare.com/v2/venues/" + fid
        + "/tips?v=20161016&sort=popular&limit=3" + foursquareAuth;
    $.getJSON(encodeURI(foursquareTipsUrl)).done(function(data){
        var items = data.response.tips.items;
        var content = '<h5 id="infoContent">' + marker.title + '</h5>';
        // Get top three reviews only
        for(var i=0; i < 3; i ++){
            content = content + '<br/><div class="infoText">' + items[i].text + ' -- ' + items[i].user.firstName + '</div>';
        }
        infoWindow.setContent(content);
    }).fail(function(){
       infoWindow.setContent('<br/><div class="infoText">Failed to load Foursquare Tips</div>');
    });
}
