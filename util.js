const googleElevationURL = 'https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/elevation/json?'

const directionsURL = 'https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/directions/json?'

const placesURL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?'

function getDirectionsP(origin, destination) {
    const query = {
        'origin': `${origin}`,
        'destination': `${destination}`,
        key: 'AIzaSyD819M3CdI9bJbgpG8T_Exb9Hxbsy0Jd5Q',
        alternatives: 'false'
    }
    return $.getJSON(directionsURL, query);
}

function getElevationP(pathPoints) {

    // splits URL in half so it will not exceed length limit
    if (pathPoints.length > 1) {
        const half = Math.floor(pathPoints.length / 2)
        const firstHalfArr = pathPoints.slice(0, half)
        const secondHalfArr = pathPoints.slice(half, pathPoints.length)

        const queryOne = {
            'locations': getPathStr(firstHalfArr),
            key: 'AIzaSyD819M3CdI9bJbgpG8T_Exb9Hxbsy0Jd5Q'
        }

        const queryTwo = {
            'locations': getPathStr(secondHalfArr),
            key: 'AIzaSyD819M3CdI9bJbgpG8T_Exb9Hxbsy0Jd5Q'
        }

        const p1 = $.getJSON(googleElevationURL, queryOne)
        const p2 = $.getJSON(googleElevationURL, queryTwo)

        return Promise.all([p1, p2]).then(responses => {

            const finalResults = [].concat(responses[0].results).concat(responses[1].results)
            console.log('getElevationP returns:', finalResults)
            return finalResults
        })

    }

    const query = {
        'locations': getPathStr(pathPoints),
        key: 'AIzaSyD819M3CdI9bJbgpG8T_Exb9Hxbsy0Jd5Q'
    }
    return $.getJSON(googleElevationURL, query).then(response => {
        return response.results
    });
}


function getPathStr(arr) {
    let pathCoordsArr = [];
    for (let i = 0; i < arr.length; i++) {
        let chunkStr = '' + arr[i].latitude + ',' + arr[i].longitude;
        pathCoordsArr.push(chunkStr)
    }
    const retStr = pathCoordsArr.join('|')
    return retStr
}


//Used to decode encoded polylines along a route
//Source: https://gist.github.com/ismaels/6636986
function decode(encoded) {
    var points = []
    var index = 0,
        len = encoded.length;
    var lat = 0,
        lng = 0;
    while (index < len) {
        var b, shift = 0,
            result = 0;
        do {
            b = encoded.charAt(index++).charCodeAt(0) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        var dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
        lat += dlat;
        shift = 0;
        result = 0;
        do {
            b = encoded.charAt(index++).charCodeAt(0) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        var dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        points.push({
            latitude: (lat / 1E5),
            longitude: (lng / 1E5)
        })

    }
    return points
}

// If decoded polyPoints exceed the 512 location limit in Google Elevation API
function reducePolyPoints(arr, max) {
    maxValue = max || 512;
    let step = 1;
    if (arr.length > maxValue) {
        step = Math.ceil(arr.length / maxValue);
    }

    const sampledArr = [];

    for (let i = 0; i < arr.length; i += step) {
        sampledArr.push(arr[i]);
    }

    return sampledArr;
}

// builds new object from API results that this app can work with 
function buildPathArray(steps) {
    const returnArr = []
    for (let i = 0; i < steps.length; i++) {

        let latitude = steps[i].start_location.lat;
        let longitude = steps[i].start_location.lng;
        let polyLine = steps[i].polyline.points;
        let directionSteps = steps[i].html_instructions;
        let distanceText = steps[i].distance.text;
        let pathPoint = {
            latitude: latitude,
            longitude: longitude,
            poly: polyLine,
            directions: directionSteps,
            distance: distanceText
        };
        returnArr.push(pathPoint);
    }
    return returnArr
}

// the following are used for building the a11y friendly table
function renderA11yFriendlyDirections(result) {
    return `
    <tr class="a11yTableData">
        <td>${result.directions}</td>
        <td>${result.distance}</td>
    </tr>
    `
}

function renderA11yViewDirectionsHeader() {
    return `
    <tr>
    <th scope="col">Directions</th>
    <th scope="col">Distance</th>
    </tr>
    `
}

function displayA11yFriendlyDirections(arr) {
    const results = arr.map((item) => renderA11yFriendlyDirections(item));
    const resultsHeader = renderA11yViewDirectionsHeader();
    $('.js-a11y-directions').append(resultsHeader, results);
}