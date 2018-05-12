'use strict';

const startInput = $('#startDirection');

const endInput = $('#endDirection');


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


// MAIN CHART
function formatElevationChart(data) {

    console.log('data returns:', data);
    const results = data.map((item, index) => renderDataSet(item));

}

function renderDataSet(result) {
    let labels = Math.floor(result.elevation/10);
    addData(chart, labels, result.elevation);
}

// SECONDARY CHART
function formatStepElevationChart(data) {
    const results = data.map((item, index) => renderStepData(item));
}

function renderStepData(result) {
    let labels = Math.floor(result.elevation/10);
    addData(stepsChart, labels, result.elevation);
}


function addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    chart.update();
}

function removeData(chart) {
    chart.data.labels.splice(0, chart.data.labels.length)
    chart.data.datasets.forEach((dataset) => {
        dataset.data.splice(0, dataset.data.length);
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


function displaySecondaryChart() {
    $('.directionListItem').on('click', function (event) {
        event.preventDefault();
        removeData(stepsChart);
        let xxx = decode(this.id);
        let stepCoords = reducePolyPoints(xxx, 100);
        console.log('stepCoords returns:', stepCoords);
        getElevationP(stepCoords).then(elevationArr=>{
            formatStepElevationChart(elevationArr)
        }).catch(err=>{
            //TODO display an error message and clear the charts
            console.error('getElevationP ERROR', err)
        });
    });
}

function watchGo() {
    $('#js-direction-form').submit(event => {
        event.preventDefault();
        const findOrigin = $(event.currentTarget).find('#startDirection');
        const origin = findOrigin.val();
        const findDest = $(event.currentTarget).find('#endDirection');
        const destination = findDest.val();
        removeData(chart);
        removeData(stepsChart)
        const dpromise = getDirectionsP(origin, destination)

        //if something bad happens...
        dpromise.catch(err=>{

            //TODO display an error message and clear the charts
            console.error('ERROR', err)
        })

        dpromise.then(directionsResponse => {

            //directions were fetched, display them
            const steps = directionsResponse.routes[0].legs[0].steps
            const pathArr = buildPathArray(steps)

            displayDirections(pathArr)
            displaySecondaryChart()

            //go fetch elevation and return that promise so we can cascade catch the errors
            return getElevationP(pathArr).then(elevationArr => {
                console.log('Got journey elevation', elevationArr)
                formatElevationChart(elevationArr)
            })
        })
    })
}

function clearResults() {
    $('.js-clearResults').on('click', function (event) {
        event.preventDefault();
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
