'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var commuterApp = {};
var accessToken = void 0;

// SET ACCESS TOKEN FOR SPOTIFY

commuterApp.getTokenObj = function () {
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
    var scope = 'user-read-private user-read-email playlist-modify-public playlist-modify-private';

    var url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(client_id);
    url += '&scope=' + encodeURIComponent(scope);
    url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
    url += '&state=' + encodeURIComponent(state);

    window.location = url;
};

commuterApp.setToken = function () {
    var hashParams = {};
    var e = void 0;
    var r = /([^&;=]+)=?([^&;]*)/g;
    var q = window.location.hash.substring(1);
    while (e = r.exec(q)) {
        hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
};

// HANDLES USER GREETING IN COMMUTE CALCULATOR SECTION
commuterApp.greetUser = function () {
    var today = new Date();
    //if local time is between 5am to 11:59 am print "Good Morning! Hope you have a lovely early commute"
    var todayHour = today.getHours();
    var greetMarkup = void 0;

    if (todayHour >= 5 && todayHour < 12) {
        greetMarkup = '<h3>Good Morning! Hope you have a lovely early commute.</h3>';
    }
    //else if local time is between 12pm to  4:59pm print "Good afternoon! Hope you have a great commute"
    else if (todayHour >= 12 && todayHour < 17) {
            greetMarkup = '<h3>Good afternoon! Hope you have a great commute.</h3>';
        }
        //if local time is between 5pm to 4:59am print "Good Evening! Hope you have a safe commute!" 
        else {
                greetMarkup = '<h3>Good Evening! Hope you have a safe commute.</h3>';
            }
    $('.greeting').append(greetMarkup);
};

// TAKE USER INPUT AND CALCULATE COMMUTE TIME
commuterApp.getCommuteData = function (start, end, mode) {
    console.log('call google', start, end, mode);
    var service = new google.maps.DistanceMatrixService();
    console.log('distanceSerice', service);

    service.getDistanceMatrix({
        origins: [start],
        destinations: [end],
        travelMode: mode.toUpperCase()

    }, commuterApp.handleCommuteData);
};

commuterApp.handleCommuteData = function (res, stat) {
    if (stat !== 'OK') {
        console.log('there was an error');
    } else {
        var durationText = res.rows[0].elements[0].duration.text;
        var durationVal = res.rows[0].elements[0].duration.value;
        // convert durationVal to milliseconds to use for later
        commuterApp.commuteTime = Math.round(durationVal * 1000);
        console.log('commutertime', commuterApp.commuteTime);

        var timeResultMarkup = '\n        <div class="commuteTimeResults">\n            <p class="commuteTimeMin">Your commute will take ' + durationText + '</p>\n        </div>';

        $('.commuteTimeResults').remove();
        $('.userInput .calculateCommuterTime').append(timeResultMarkup);
        //make .createPlaylist appear
        $('.createPlaylist').addClass('show');
    }
};

//CREATE A NEW PLAYLIST
commuterApp.createPlaylist = function () {
    console.log('createPlaylist');
    var userId = commuterApp.userInfo.id;
    console.log('user', userId);
    $.ajax({
        url: 'https://api.spotify.com/v1/users/' + userId + '/playlists',
        dataType: 'json',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        },
        data: JSON.stringify({ name: 'The Commuter Buddy' }),
        success: function success(res) {
            console.log('success', res);
            // store playlistInfo for later
            commuterApp.playlistInfo = res;
            commuterApp.collectGenres();
        },
        error: function error(err) {
            console.log('err', err);
        }
    });
};

// collect genres chosen by user; output: array ['pop', 'rock']
commuterApp.collectGenres = function () {
    var genresElems = [].concat(_toConsumableArray(document.querySelectorAll('.createPlaylist input:checked')));
    console.log('genresElem', genresElems);
    var genres = genresElems.map(function (genresElem, i) {
        return genresElem.value;
    });
    console.log('genres', genres);
    commuterApp.getArtists(genres);
};

// get 20 top artists per genre chosen
commuterApp.getArtists = function (genres) {
    console.log('about to search', accessToken);
    var getArtists = genres.map(function (genre) {
        return $.ajax({
            url: 'https://api.spotify.com/v1/search',
            dataType: 'json',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken
            },
            data: {
                q: 'genre:' + genre,
                type: 'artist'
            },
            success: function success(res) {
                console.log('success', res);
            },
            error: function error(err) {
                console.log('err', err);
            }
        });
    });

    $.when.apply(null, getArtists).then(function (res) {
        // get artists ids
        var artistsArray = Array.from(arguments);
        var artistsIds = [];

        if (res.length) {
            artistsIds = artistsArray.map(function (arr, i) {
                return arr[0].artists.items;
            });

            artistsIds = artistsIds.reduce(function (a, b) {
                return a.concat(b);
            }, []);

            console.log('randomized', artistsIds.sort(function () {
                return 0.5 - Math.random();
            }));

            artistsIds = artistsIds.map(function (arr, i) {
                return arr.id;
            });
        } else {
            console.log('JUST ONE');
            artistsIds = artistsArray[0].artists.items.map(function (artist, i) {
                return artist.id;
            });
        }

        console.log('artistsIds', artistsIds);

        // commuterApp.randomizeArtists(artistsIds);
    });
    console.log('getting artists');
};

// commuterApp.randomizeArtists = (ids) => {
//     console.log('ids', ids)
//     const randomizedIds  = ids.sort(() => { return 0.5 - Math.random() })
//     console.log('randomizedIds', randomizedIds);

// }


$(document).ready(function () {
    var params = commuterApp.setToken();
    accessToken = params.access_token;
    var state = params.state;
    var stateKey = 'spotify_auth_state';
    var storedState = localStorage.getItem(stateKey);

    var loggedInTemplate = $('#loggedInTemplate').html();
    var template = Handlebars.compile(loggedInTemplate);

    console.log('accessToken', accessToken, 'state', state, 'storedState', storedState);

    if (accessToken && (state == null || state !== storedState)) {
        alert('There was an error during the authentication');
    } else {
        // localStorage.removeItem(stateKey);
        if (accessToken) {
            $.ajax({
                url: 'https://api.spotify.com/v1/me',
                headers: {
                    'Authorization': 'Bearer ' + accessToken
                },
                success: function success(response) {
                    console.log('response successful', response);
                    var loggedInTemplateUser = template(response);

                    // store userInfo for later
                    commuterApp.userInfo = response;
                    $('#login').hide();
                    $('#loggedIn').show();
                    $('footer, #userInput').removeClass('show');
                    $('footer, #userInput').addClass('show');
                    $('#loggedIn').append(loggedInTemplateUser);
                    commuterApp.greetUser();
                },
                error: function error(err) {
                    console.log('there was an error');
                }
            });
        } else {
            $('#login').show();
            $('#loggedIn').hide();
        }
    }

    // listen for user events

    $('#loginBtn').on('click', function (e) {
        e.preventDefault();
        commuterApp.getTokenObj();
    });

    $('form.calculateCommuterTime').on('submit', function (e) {
        e.preventDefault();
        var startLoc = $('input[name=origin_addresses]').val();
        var endLoc = $('input[name=destination_addresses]').val();
        var mode = $('input[type=radio]:checked').val();
        commuterApp.getCommuteData(startLoc, endLoc, mode);
    });

    $('.createPlaylist input[type=checkbox]').on('change', function (e) {
        // need to find a better solution
        if ($(this).siblings(':checked').length >= 5) {
            this.checked = false;
        }
    });

    $('form.createPlaylist').on('submit', function (e) {
        e.preventDefault();
        console.log('submitting');
        // commuterApp.collectGenres();
        commuterApp.createPlaylist();
    });
});