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

function getElevationData(coordStart, coordEnd, callback) {
    const query = {
        'path': `${coordStart}|${coordEnd}`,
        'samples': 256,
        key: 'AIzaSyD819M3CdI9bJbgpG8T_Exb9Hxbsy0Jd5Q'
    }
    $.getJSON(googleElevationURL, query, callback);
}

function renderResult(result) {
    return `
    <div style='height:${(result.elevation) / 5}px' class='elevateDisplay'><p class='hiddenElevation'>${Math.floor((result.elevation) * 3.28)}</p></div>
    `
}

function renderCoordinates(result) {
    let latitude = result.geometry.location.lat;
    let longitude = result.geometry.location.lng;
    return latitude + ',' + longitude;
}

function displayElevation(data) {
    const results = data.results.map((item, index) => renderResult(item));
    $('#js-result').html(results);
}
// Could use this for some type of identifier of where an elevation bar actually is
// function displayCoordinates(data) {
//     const results = data.results.map((item, index) => renderCoordinates(item));
//     $('.rawCoA').html(results);
//     console.log(results);
//     return results;
// }

function watchSubmit() {
    $('#js-search-form').submit(event => {
        event.preventDefault();
        goFetch();
    });
}

function goFetch() {
    const findStartAddress = $(event.currentTarget).find('.start');
    const findEndAddress = $(event.currentTarget).find('.end');
    const startAddress = findStartAddress.val();
    const endAddress = findEndAddress.val();
    getCoordinates(startAddress, function (result) {
        const coordStart = result.results.map((item, index) => renderCoordinates(item));
        getCoordinates(endAddress, function (result) {
            const coordEnd = result.results.map((item, index) => renderCoordinates(item));
            getElevationData(coordStart, coordEnd, displayElevation);
        })
    })
}

$(watchSubmit);