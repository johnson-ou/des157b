(function () {
    'use strict';
    console.log('reading');

    const button = document.querySelector('button');
    const body = document.querySelector('body');
    let mode = 'dark';

    button.addEventListener('click', function () {
        if (mode === 'dark') {
            body.className = 'switch';
            mode = 'light';
        } else {
            body.removeAttribute('class');
            mode = 'dark';
        }
    });
})();