'use strict';

// console.log('helloo world')
// var myTemplate = $('#welcome').html();
// var template = Handlebars.compile(myTemplate);
// var person = {
//     name: 'Joe Smith'
// };

// var personTemplate = template(person);
// $('#prompt').append(personTemplate);
var commuterApp = {};
var accessToken = void 0;

commuterApp.init = function () {
    commuterApp.directSpotify();
};

commuterApp.generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    // console.log('text', text)
    return text;
};

commuterApp.directSpotify = function () {
    console.log('reached direct spotify');
    var client_id = '0799860bd8cb460bbfe7ddeefa8e73d2';
    var redirect_uri = 'http://localhost:3000';
    var state = commuterApp.generateRandomString(5);
    var stateKey = 'spotify_auth_state';
    localStorage.setItem(stateKey, state);
    var scope = 'user-read-private user-read-email';

    var url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(client_id);
    url += '&scope=' + encodeURIComponent(scope);
    url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
    url += '&state=' + encodeURIComponent(state);

    window.location = url;
};

$(document).ready(function () {
    // greetUser()
    $('#loginBtn').on('click', function (e) {
        e.preventDefault();
        commuterApp.init();
    });
    // searchItem.init();


    //smoothscroll
    // $('a.btn').smoothScroll({
    // 	speed: 400
    // });
});