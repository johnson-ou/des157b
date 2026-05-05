(function(){
    'use strict';

    // add your script here
    var map = L.map('map').setView([37.804363, -122.271111], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var marker = L.marker([37.804363, -122.27111]).addTo(map);

var circle = L.circle([37.804363, -122.27111], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);
    

var polygon = L.polygon([
    [37.804363, -122.27111],
    [37.82, -122.27],
    [37.81, -122.28]
]).addTo(map);

marker.bindPopup("<b>Hello!</b><br>This is my home.").openPopup();
circle.bindPopup("This is where I grew up");
polygon.bindPopup("This is where my relatives live.");


}());