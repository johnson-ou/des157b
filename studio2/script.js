(function () {
    'use strict';
    console.log('reading js');

    const myVideo = document.querySelector('#myVideo');
    const loader = document.querySelector('.loader');
    const muteBtn = document.querySelector('#muteToggle');
    const muteIcon = muteBtn.querySelector('i');
    const line1 = document.querySelector('#line1');
    const line2 = document.querySelector('#line2');
    const line3 = document.querySelector('#line3');
    const line4 = document.querySelector('#line4');
    const line5 = document.querySelector('#line5');

    // for lyric timing
    const lyrics = {
        start: [1, 5, 8, 15, 21],
        stop: [4, 7, 14, 20, 27],
        line: [line1, line2, line3, line4, line5]
    };

    // hide the loader once the video starts playing
    myVideo.addEventListener('playing', function () {
        loader.style.display = 'none';
    });

    // check the video time once per second
    const intervalID = setInterval(checkTime, 1000);

    function checkTime() {
        for (let i = 0; i < lyrics.start.length; i++) {
            if (lyrics.start[i] < myVideo.currentTime && myVideo.currentTime < lyrics.stop[i]) {
                lyrics.line[i].className = 'showing';
            } else {
                lyrics.line[i].className = 'hidden';
            }
        }
    }

    // toggle to mute and unmute
    muteBtn.addEventListener('click', function () {
        if (myVideo.muted) {
            myVideo.muted = false;
            document.body.className = 'unmuted';
            muteIcon.className = 'fa-solid fa-volume-high';
        } else {
            myVideo.muted = true;
            document.body.className = '';
            muteIcon.className = 'fa-solid fa-volume-xmark';
        }
    });
})();
