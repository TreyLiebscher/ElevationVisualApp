'use strict';

const googleElevationURL = 'https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/elevation/json?'

const geoCodingURL = 'https://maps.google.com/maps/api/geocode/json?'

function getCoordinates(address, callback) {
    const query = {
        'address': `${address}`,
        key: 'AIzaSyAPUXTrCYlQ-XYOH_G6Ct_hTkCOfAeRChM'
    }
    $.getJSON(geoCodingURL, query, callback)
}

function getElevationData(coordinates, callback) {
    const query = {
        'locations': `${coordinates}` ,
        key: 'AIzaSyD819M3CdI9bJbgpG8T_Exb9Hxbsy0Jd5Q'
    }
    $.getJSON(googleElevationURL, query, callback);
}

function renderResult(result) {
    return `
    <div class="elevateDisplay">${(result.elevation) * 3.28}</div>
    `
}

function renderCoordinates(result) {
    return `
    <div class="latDisplay">${result.geometry.location.lat}</div>
    <div class="lngDisplay">${result.geometry.location.lng}</div>
    `
}

function displayElevation(data) {
    const results = data.results.map((item, index) => renderResult(item));
    $('#js-result').html(results);
}

function displayCoordinates(data) {
    const results = data.results.map((item, index) => renderCoordinates(item));
    $('.rawCoA').html(results);
}

function watchSubmit() {
    $('#js-search-form').submit(event => {
        event.preventDefault();
        const findCood = $(event.currentTarget).find('#addressEntry');
        const coordinates = findCood.val();
        getCoordinates(coordinates, displayCoordinates);
    });   
}

function calculateElevation() {
    $('#js-elevate-button').on('click', function(event) {
        event.preventDefault();
        const lat = $('.latDisplay').text();
        const lng = $('.lngDisplay').text();
        const coordinates = lat + ',' + lng;
        getElevationData(coordinates, displayElevation);
    });
}



$(calculateElevation);
$(watchSubmit);




