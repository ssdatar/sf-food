var food_data = data; //Import data

//Initialize map, so that you can add-remove it
var map = L.map('map', {
      scrollWheelZoom: false,
      center: [37.773972, -122.431297],
      zoom: 12
    });
L.tileLayer("http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png", 
        {
            attribution: '&copy; Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
            maxZoom: 18
    }).addTo(map);

$(document).ready(function() {
    //Don't show container until user has fed in values
    // $('#map').hide();
    $('#user-error').hide();
    
    $('form').submit(function (e) {
        var userInput = $('#location-input').val();
        e.preventDefault();

        //Get coordinates for user input
        var mapzen = 'https://search.mapzen.com/v1/search?'
        $.getJSON( mapzen, {
            api_key: 'search-66RFD1I',
            text: userInput,
            size: 1
        })
        .done(function (data) {
            var foodPts, foodGeoJson;

            //If it is not in SF, show default
            if (data.features[0].properties.county !== "San Francisco County") {
                $('#user-error').show().delay(3000).fadeOut();

                foodPts = pointsToPlot(37.774833, -122.418284);
                foodGeoJson = toGeoJSON(foodPts);
                drawMap(37.774833, -122.418284, foodGeoJson);

            } else {
                var userCoordinates = data.features[0].geometry.coordinates;
                var userLat = userCoordinates[1],
                    userLong = userCoordinates[0];

                foodPts = pointsToPlot(userLat, userLong);
                //console.log(foodPts);

                var openNum = foodPts.length;
                //console.log(openNum)

                //Get GeoJSON of all points within one-mile radius
                foodGeoJson = toGeoJSON(foodPts);
            
                var text = openNum + ' food carts/trucks are open around you.';

                drawMap(userLat, userLong, foodGeoJson);

                //Scroll to map
                // $('html, body').animate({
                //     scrollTop: $('#map').offset().top }, 2000);
            }
        });
    });



/*------- DRAW THE MAP ---*/

function drawMap(userLat, userLong, points) {

    $('#location-input').val('');
    $('#user-error').empty();

    if (map) { map.remove(); }

    map = L.map('map', {
      scrollWheelZoom: false,
      center: [userLat, userLong],
      zoom: 14
    });

    L.tileLayer("http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png", 
        {
            attribution: '&copy; Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
            maxZoom: 18
    }).addTo(map);


    var marker = L.marker([userLat, userLong]).addTo(map);

    var markerOptions = {
                radius: 10,
                fillColor: "darkred",
                color: "#006CBA",
                weight: .5,
                opacity: .5,
                fillOpacity: 0.7
            };

    var dataLayer = L.geoJson(points, {
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, markerOptions);
        },
        onEachFeature: function(feature, layer) {
            console.log(feature.properties)
            var tooltip = feature.properties.location;
            var timings = '<p>Closes at: ' + feature.properties.ends + '</p>';

            //layer.bindPopup(feature.properties.desc);

            layer.bindPopup('<p>Location: '+ tooltip + '</p>' + '\n' + timings + '<p class="menu">' + feature.properties.desc + '</p>');
      }
    });
    map.addLayer(dataLayer);
    map.fitBounds(dataLayer.getBounds());
}



/*------- DISTANCE BETWEEN USER POINT AND EVICTION POINTS ---*/

//http://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula/27943
function calculateDist (userLat, userLong, evLat, evLong) {
    var p = 0.017453292519943295;    // Math.PI / 180
    var c = Math.cos;
    
    var a = 0.5 - c((evLat - userLat) * p)/2 + 
         c(userLat * p) * c(evLat * p) * 
         (1 - c((evLong - userLong) * p))/2; 

    var d = 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km

    return d * 0.621371;
}

/*------- GET POINTS TO PLOT BASED ON USER INPUT ---*/

function pointsToPlot (userLat, userLong) {

    var filtered_data = [];
    // var dist, evLat, evLong;

    for (var i = 0; i < food_data.length; i++) {
    //  fdLat = parseFloat(food_data[i]['Latitude']);
    //  fdLong = parseFloat(food_data[i]['Longitude']);
    //  dist = calculateDist(userLat, userLong, fdLat, fdLong);
    
    if (isOpen(food_data[i])) {
        filtered_data.push(food_data[i]);
       }
    //console.log(filtered_data)
    }
    return filtered_data;
}

/*------- CHECK IF CART IS OPEN ---*/

function isOpen(cart) {
    //console.log(cart);
    var hoursNow = new Date().getHours();
    var startTime = cart.starts.split(':')[0],
        endTime = cart.ends.split(':')[0];

    var dayNow = new Date().getDay();
    cart.Day = parseInt(cart.Day);

    if (dayNow !== cart.Day) {
        return false;
    } else if (hoursNow >= startTime && hoursNow < endTime) {
        return true;
    } else {
        return false;
    }
}


/*------- CONVERT TO GEOJSON TO DISPLAY ON LEAFLET MAP ---*/

function toGeoJSON (pointsArray) {

    var geoArray = [];
    var featureObj = {};

    var geoData = {
              "type": "FeatureCollection"
            };

    for (var obj in pointsArray) {
        featureObj = {
            "type": "Feature",
            "properties": {
                "day": pointsArray[obj]['Day'],
                "desc": pointsArray[obj]['optionaltext'],
                "starts": pointsArray[obj]['starts'],
                "ends": pointsArray[obj]['ends'],
                "location": pointsArray[obj]['PermitLocation']
            },
            "geometry" : {
                "type": "Point",
                "coordinates" : [pointsArray[obj]['Longitude'], pointsArray[obj]['Latitude']]
            }
        };
        geoArray.push(featureObj);
    }

    geoData["features"] = geoArray;

    return geoData;
  }
});