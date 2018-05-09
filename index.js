'use strict';

const googleElevationURL = 'https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/elevation/json?'

const directionsURL = 'https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/directions/json?'

const placesURL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?'

const startInput = $('#startDirection');

const endInput = $('#endDirection');

function getDirections(origin, destination, callback) {
    const query = {
        'origin': `${origin}`,
        'destination': `${destination}`,
        key: 'AIzaSyD819M3CdI9bJbgpG8T_Exb9Hxbsy0Jd5Q',
        alternatives: 'false'
    }
    $.getJSON(directionsURL, query, callback);
}

function getElevationData(pathPoint, callback) {
    const query = {
        'locations': givePath(pathPoint),
        key: 'AIzaSyD819M3CdI9bJbgpG8T_Exb9Hxbsy0Jd5Q'
    }
    $.getJSON(googleElevationURL, query, callback);
}

function renderCoordinates(result) {
    let latitude = result.geometry.location.lat;
    let longitude = result.geometry.location.lng;
    return latitude + ',' + longitude;
}

function getAutoComplete(searchTerm) {
    const query = {
        input: $('#startDirection'),
        key: 'AIzaSyD819M3CdI9bJbgpG8T_Exb9Hxbsy0Jd5Q'
    }
    $.getJSON(placesURL, query);
}

// var autocomplete = new google.maps.places.Autocomplete(INPUT_BOX[0]);

//Used to store results
let pathArray = [];

function buildPathArray(result) {
    for (let i = 0; i < result.legs[0].steps.length; i++) {
        
        let latitude = result.legs[0].steps[i].start_location.lat;
        let longitude = result.legs[0].steps[i].start_location.lng;
        let polyLine = result.legs[0].steps[i].polyline.points;
        let directionSteps = result.legs[0].steps[i].html_instructions;
        let distanceText = result.legs[0].steps[i].distance.text;
        let pathPoint = {
            latitude: latitude,
            longitude: longitude,
            poly: polyLine,
            directions: directionSteps,
            distance: distanceText
        };
        pathArray.push(pathPoint);
    }
}

function formatDirections(data) {
    const results = data.routes.map((item, index) => buildPathArray(item));
}

function promiseMe(value, millis, doReject) {
    return new Promise((resolve, reject) => {
        if (doReject) {
            reject(new Error('Bad Address'));
            return;
        }
        window.setTimeout(() => {
            console.log(new Date().toUTCString(), 'Resolved:', value);
            resolve(value);
        }, millis);
    });
}

function givePath(arr) {
    let pathCoordsArr = [];
    for (let i = 0; i < arr.length; i++) {
        let chunkStr = '' + arr[i].latitude + ',' + arr[i].longitude;
        pathCoordsArr.push(chunkStr)
    }
    const retStr = pathCoordsArr.join('|')
    console.log('givePath returns:', retStr)
    return retStr
}

function directionRender(result) {
    return `
    <li class='directionListItem' id='${result.poly}'>${result.directions} (${result.distance})</li>
    <br>
    `
}

function displayDirections(arr) {
    const results = arr.map((item) => directionRender(item));
    $('#js-direction-result').html(results);
}

//Used to decode encoded polylines along a route
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
            b = encoded.charAt(index++).charCodeAt(0) - 63; //finds ascii                                                                                    //and substract it by 63
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

// MAIN CHART
function formatElevationChart(data) {
    const results = data.results.map((item, index) => renderDataSet(item));
}

function renderDataSet(result) {
    let labels = Math.floor(result.elevation);
    addData(chart, labels, result.elevation);
}

// SECONDARY CHART
function formatStepElevationChart(data) {
    const results = data.results.map((item, index) => renderStepData(item));
}

function renderStepData(result) {
    let labels = Math.floor(result.elevation);
    addData(stepsChart, labels, result.elevation);
}


async function goFetchAsyncChart() {
    try {
        var elevationResult = await promiseMe(pathArray, 1000);
    } catch (error) {
        console.error(error);
    }
    console.log('pathArray contains:', elevationResult);
    getElevationData(elevationResult, formatElevationChart);
    displayDirections(elevationResult);
    displaySecondaryChart();
}

function addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    chart.update();
}

function removeData(chart) {
    chart.data.labels.splice(0,chart.data.labels.length)
    chart.data.datasets.forEach((dataset) => {
        dataset.data.splice(0,dataset.data.length);
    });
    chart.update();
}
// The main chart
var ctx = document.getElementById('myChart').getContext('2d');
var chart = new Chart(ctx, {

    type: 'line',


    data: {
        labels: [],
        datasets: [{
            label: "Journey Elevation (meters)",
            borderColor: 'rgb(255, 99, 132)',
            data: []
        }]
    },


    options: {}
});
// The secondary chart for each step of journey
var stepsContent = document.getElementById('stepsChart').getContext('2d');
var stepsChart = new Chart(stepsContent, {

    type: 'line',


    data: {
        labels: [],
        datasets: [{
            label: "Step Elevation (meters)",
            borderColor: 'rgb(9, 214, 2)',
            data: []
        }]
    },


    options: {}
});

// If decoded polyPoints exceed the 512 location limit in Google Elevation API
function reducePolyPoints(arr) {
    const MAX = 512;
    let step = 1;
    if (arr.length > MAX) {
        step = Math.ceil(arr.length / MAX);
    }

    const sampledArr = [];

    for (let i = 0; i < arr.length; i += step) {
        sampledArr.push(arr[i]);
    }

    return sampledArr;
}

function displaySecondaryChart() {
    $('.directionListItem').on('click', function(event) {
        event.preventDefault();
        removeData(stepsChart);
        let xxx = decode(this.id);
        let stepCoords = reducePolyPoints(xxx);
        getElevationData(stepCoords, formatStepElevationChart);
        console.log('stepCoords returns:', stepCoords);
    });
}

function watchGo() {
    $('#js-direction-form').submit(event => {
        event.preventDefault();
        const findOrigin = $(event.currentTarget).find('#startDirection');
        const origin = findOrigin.val();
        const findDest = $(event.currentTarget).find('#endDirection');
        const destination = findDest.val();
        console.log(pathArray);
        goFetchAsyncChart();
        getDirections(origin, destination, formatDirections);
    })
}

function clearResults() {
    $('.js-clearResults').on('click', function(event) {
        event.preventDefault();
        pathArray.splice(0,pathArray.length);
        $('#js-direction-result').html('');
        removeData(chart);
        removeData(stepsChart);
        $('.directionInput').val('');
    });
}

// Autocomplete

function initialize() {
    var input1 = document.getElementById('startDirection');
    new google.maps.places.Autocomplete(input1);
    var input2 = document.getElementById('endDirection');
    new google.maps.places.Autocomplete(input2);
}
  
google.maps.event.addDomListener(window, 'load', initialize);

$(clearResults);
$(watchGo);