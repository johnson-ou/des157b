(function () {
    'use strict';
    console.log('reading');

    let globalData;
    let currentIndex = 0;

    async function getData() {
        const response = await fetch('music_listening_data.json');
        const data = await response.json();
        //console.log(data);
        globalData = data;
        updateInterface(currentIndex, globalData);
    }

    function updateInterface(index, data) {
        const scenes = ['time-morning', 'time-midday', 'time-midday', 'time-midday', 'time-evening', 'time-evening', 'time-night', 'time-late-night'];
        const entry = data[index];
        document.querySelector('#clock').innerHTML = entry.time;
        document.querySelector('#activity').innerHTML = entry.activity;
        document.querySelector('#song-title').innerHTML = entry.songTitle;
        document.querySelector('#artist').innerHTML = entry.artist;
        document.querySelector('#album-art').style.backgroundImage = `url(${entry.albumCover})`;
        document.body.className = scenes[index];
    }

    //randomly generates 40 stars and drops them into #stars
    function createStars() {
        let html = '';
        for (let i = 0; i < 40; i++) {
            const top = Math.random() * 60;
            const left = Math.random() * 100;
            const size = Math.random() * 2 + 1;
            html += `<div class="star" style="top: ${top}%; left: ${left}%; width: ${size}px; height: ${size}px;"></div>`;
        }
        document.querySelector('#stars').innerHTML = html;
    }

    createStars();
    getData();

    document.querySelector('#next-btn').addEventListener('click', function () {
        currentIndex = currentIndex + 1;
        if (currentIndex >= globalData.length) {
            currentIndex = 0;
        }
        updateInterface(currentIndex, globalData);
    });

    document.querySelector('#prev-btn').addEventListener('click', function () {
        currentIndex = currentIndex - 1;
        if (currentIndex < 0) {
            currentIndex = globalData.length - 1;
        }
        updateInterface(currentIndex, globalData);
    });

})();