'use strict';

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


// build MAIN CHART
function formatElevationChart(data) {

    console.log('data returns:', data);
    const results = data.map((item, index) => renderDataSet(item, index));

}

function renderDataSet(result, index) {
    let labels = index + 1;
    addData(chart, labels, result.elevation);
}

// build SECONDARY CHART
function formatStepElevationChart(data) {
    const results = data.map((item, index) => renderStepData(item, index));
}

function renderStepData(result, index) {
    let labels = '';
    addData(stepsChart, labels, result.elevation);
}

// adding data to harts
function addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    chart.update();
}

// removing data from charts
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
            label: 'Journey Elevation (meters)',
            borderColor: '#50b4db',
            backgroundColor: '#377f9b',
            data: []
        }]
    },


    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            xAxes: [{
                display: true,
                gridLines: {
                    display: true,
                    color: '#000000'
                }
            }],
            yAxes: [{
                display: true,
                gridLines: {
                    display: true,
                    color: '#000000'
                }
            }]
        }
    }

});

// The secondary chart for each step of journey
var stepsContent = document.getElementById('stepsChart').getContext('2d');
var stepsChart = new Chart(stepsContent, {

    type: 'line',


    data: {
        labels: [],
        datasets: [{
            label: 'Step Elevation (meters)',
            borderColor: '#e79f31',
            backgroundColor: '#af7824',
            data: []
        }]
    },


    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            xAxes: [{
                display: true,
                gridLines: {
                    display: true,
                    color: '#000000'
                }
            }],
            yAxes: [{
                display: true,
                gridLines: {
                    display: true,
                    color: '#000000'
                }
            }]
        }
    }

});

function displaySecondaryChart() {
    $('.directionListItem').on('click', function (event) {
        event.preventDefault();
        removeData(stepsChart);
        $(this).toggleClass('activeDirectionListItem').siblings().removeClass('activeDirectionListItem');
        let decodedPolyPoints = decode(this.id);
        let stepCoords = reducePolyPoints(decodedPolyPoints, 100);
        console.log('stepCoords returns:', stepCoords);
        getElevationP(stepCoords).then(elevationArr => {
            formatStepElevationChart(elevationArr)
        }).catch(err => {
            alert('Something went wrong, please try again');
            clearResults();
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
        $('.js-a11y-directions').empty();
        $('.js-a11y-elevation').empty();
        const dpromise = getDirectionsP(origin, destination)

        //if something bad happens...
        dpromise.catch(err => {
            alert('Something went wrong, please try again');
            clearResults();
            console.error('ERROR', err)
        })

        dpromise.then(directionsResponse => {

            //directions were fetched, display them
            const steps = directionsResponse.routes[0].legs[0].steps
            const pathArr = buildPathArray(steps)

            displayDirections(pathArr)
            displayA11yFriendlyDirections(pathArr)
            displaySecondaryChart()

            //go fetch elevation and return that promise so we can cascade catch the errors
            return getElevationP(pathArr).then(elevationArr => {
                console.log('Got journey elevation', elevationArr)
                formatElevationChart(elevationArr)
                $('.directionContainer').scrollTop(1).scrollTop(0);
                displayA11yFriendlyElevation(elevationArr)
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
        $('.js-a11y-directions').empty();
        $('.js-a11y-elevation').empty();
        $('.directionInput').val('');
    });
}

function displayAboutSection() {
    $('#js-about').on('click', function (event) {
        event.preventDefault();
        $('.aboutContainer').show();
    });
}

function displayA11yFriendlyView() {
    $('#js-a11yFriendlyView').on('click', function (event) {
        event.preventDefault();
        $('.mainChartHolder').hide();
        $('.stepsChartHolder').hide();
        $('.directionContainer').hide();
        $('.js-a11y-view-container').show();
    });
}

function displayStandardView() {
    $('#js-standard-view').on('click', function (event) {
        event.preventDefault();
        $('.js-a11y-view-container').hide();
        $('.mainChartHolder').show();
        $('.stepsChartHolder').show();
        $('.directionContainer').show();
    })
}

$(document).on('click', '#js-close-about', function () {
    $(this).parent().parent().hide();
});

// Display about section for first-time users
$(() => {
    const popupWasShown = Cookies.get('popupWasShown')
    console.log('popupWasShown', popupWasShown)
    if (!popupWasShown) {
        Cookies.set('popupWasShown', true)
        $('.aboutContainer').show();
    }
})

// Loading Icon
$(document)
    .ajaxStart(function () {
        $('.loadingHolder').show();
    })
    .ajaxStop(function () {
        $('.loadingHolder').hide();
    });

// Autocomplete
function initialize() {
    var input1 = document.getElementById('startDirection');
    new google.maps.places.Autocomplete(input1);
    var input2 = document.getElementById('endDirection');
    new google.maps.places.Autocomplete(input2);
}

google.maps.event.addDomListener(window, 'load', initialize);

function handleElevationAppEvents() {
    $(displayAboutSection);
    $(displayStandardView);
    $(displayA11yFriendlyView);
    $(clearResults);
    $(watchGo);
}

$(handleElevationAppEvents);