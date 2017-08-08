const commuterApp = {}
let accessToken;

// COMMUTER HELPER FUNCTIONS 
commuterApp.generateRandomString = (length) => {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    // console.log('text', text)
    return text;
}

// SET ACCESS TOKEN FOR SPOTIFY

commuterApp.getTokenObj = () => {
    commuterApp.directSpotify()
}


commuterApp.directSpotify = () => {
    console.log('reached direct spotify')
    const client_id = '0799860bd8cb460bbfe7ddeefa8e73d2'
    const redirect_uri = 'http://localhost:3000'
    const state = commuterApp.generateRandomString(5);
    const stateKey = 'spotify_auth_state';
    localStorage.setItem(stateKey, state);
    const scope = 'user-read-private user-read-email playlist-modify-public playlist-modify-private';

    let url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(client_id);
    url += '&scope=' + encodeURIComponent(scope);
    url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
    url += '&state=' + encodeURIComponent(state);

    window.location = url;
}

commuterApp.setToken = () => {
    const hashParams = {};
    let e;
    const r = /([^&;=]+)=?([^&;]*)/g
    const q = window.location.hash.substring(1);
    while (e = r.exec(q)) {
        hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
}

// HANDLES USER GREETING IN COMMUTE CALCULATOR SECTION
commuterApp.greetUser = () => {
    const today = new Date();
    //if local time is between 5am to 11:59 am print "Good Morning! Hope you have a lovely early commute"
    const todayHour = today.getHours();
    let greetMarkup;

    if (todayHour >= 5 && todayHour < 12) {
        greetMarkup = `<h3>Good Morning! Hope you have a lovely early commute.</h3>`
    }
    //else if local time is between 12pm to  4:59pm print "Good afternoon! Hope you have a great commute"
    else if (todayHour >= 12 && todayHour < 17) {
        greetMarkup = `<h3>Good afternoon! Hope you have a great commute.</h3>`

    }
    //if local time is between 5pm to 4:59am print "Good Evening! Hope you have a safe commute!" 
    else {
        greetMarkup = `<h3>Good Evening! Hope you have a safe commute.</h3>`
    }
    $('.greeting').append(greetMarkup);
}

// TAKE USER INPUT AND CALCULATE COMMUTE TIME
commuterApp.getCommuteData = (start, end, mode) => {
    console.log('call google', start, end, mode)
    const service = new google.maps.DistanceMatrixService();
    console.log('distanceSerice', service)

    service.getDistanceMatrix(
        {
            origins: [start],
            destinations: [end],
            travelMode: mode.toUpperCase(),

        }, commuterApp.handleCommuteData);
}

commuterApp.handleCommuteData = (res, stat) => {
    if (stat !== 'OK') {
        console.log('there was an error')
    } else {
        const durationText = res.rows[0].elements[0].duration.text;
        let durationVal = res.rows[0].elements[0].duration.value;
        // convert durationVal to milliseconds to use for later
        commuterApp.commuteTime = Math.round(durationVal * 1000);
        console.log('commutertime', commuterApp.commuteTime);

        const timeResultMarkup = `
        <div class="commuteTimeResults">
            <p class="commuteTimeMin">Your commute will take ${durationText}</p>
        </div>`

        $('.commuteTimeResults').remove();
        $('.userInput .calculateCommuterTime').append(timeResultMarkup);
        //make .createPlaylist appear
        $('.createPlaylist').addClass('show');
    }
}

//CREATE A NEW PLAYLIST
commuterApp.createPlaylist = () => {
    console.log('createPlaylist')
    const userId = commuterApp.userInfo.id;
    console.log('user', userId);
    $.ajax({
        url: `https://api.spotify.com/v1/users/${userId}/playlists`,
        dataType: 'json',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken,
        },
        data: JSON.stringify({ name: 'The Commuter Buddy' }),
        success: function (res) {
            console.log('success', res)
            // store playlistInfo for later
            commuterApp.playlistInfo = res;
            commuterApp.collectGenres();
        },
        error: function (err) {
            console.log('err', err)
        }
    });

}

// collect genres chosen by user; output: array ['pop', 'rock']
commuterApp.collectGenres = () => {
    const genresElems = [...document.querySelectorAll('.createPlaylist input:checked')];
    console.log('genresElem', genresElems);
    const genres = genresElems.map((genresElem, i) => { return genresElem.value });
    console.log('genres', genres);
    commuterApp.getArtists(genres);
}

// get 20 top artists per genre chosen
commuterApp.getArtists = (genres) => {
    console.log('about to search', accessToken)
    const getArtists = genres.map(function (genre) {
        return $.ajax({
            url: 'https://api.spotify.com/v1/search',
            dataType: 'json',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken,
            },
            data: {
                q: 'genre:' + genre,
                type: 'artist'
            },
            success: function (res) {
                console.log('success', res);
            },
            error: function (err) {
                console.log('err', err);
            }
        });
    });

    $.when.apply(null, getArtists)
        .then(function (res) {
            // get artists ids
            const artistsArray = Array.from(arguments);
            let artistsIds = [];

            if (res.length) {
                artistsIds = artistsArray.map((arr, i) => { return arr[0].artists.items; })
                    .reduce(function (a, b) { return a.concat(b); }, [])
                    .map((arr, i) => { return arr.id; });

            } else {
                console.log('JUST ONE')
                artistsIds = artistsArray[0].artists.items.map((artist, i) => {
                    return artist.id;
                });
            }

            console.log('artistsIds', artistsIds);

            // commuterApp.randomizeArtists(artistsIds);
            commuterApp.getTopTracks(artistsIds);

        });
    console.log('getting artists');
}

commuterApp.getTopTracks = (ids) => {
    console.log('about to search', accessToken)
    const getTracks = ids.map((id) => {
        return $.ajax({
            url: `https://api.spotify.com/v1/artists/${id}/top-tracks`,
            dataType: 'json',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken,
            },
            data: {
                country: 'CA',
                type: 'track'
            }
        });
    });

    $.when.apply(null, getTracks)
        .then(function (res) {
            // get artists ids
            const tracksArray = Array.from(arguments);

            if (tracksArray) {
                commuterApp.massageTracks(tracksArray);
            }

        });
}

commuterApp.massageTracks = (tracks) => {
    tracks = tracks.map((track, i) => { return track[0].tracks; })
        .reduce((a, b) => { return a.concat(b); }, [])
    console.log('massage tracks', tracks);
    commuterApp.randomizeTracks(tracks);
}

commuterApp.randomizeTracks = (tracks) => {
    const randomizedTracks = tracks.sort(() => { return 0.5 - Math.random() })
    console.log('randomizedtracks', randomizedTracks);
    commuterApp.buildTracksList(randomizedTracks);
}

commuterApp.buildTracksList = (tracks) => {
    let leftOverCommuteTime = commuterApp.commuteTime;
    const playlistTracks = [];
    tracks.forEach((track, i) => {
        if (leftOverCommuteTime >= 1) {
            playlistTracks.push(track)
            leftOverCommuteTime -= track.duration_ms;
        }
    });

    const playlistUris = playlistTracks.map((track) => { return track.uri });
    commuterApp.buildPlaylist(playlistUris);
}

commuterApp.buildPlaylist = (uris) => {
    console.log('tracks', uris);
    console.log('commuterApp', commuterApp);
    const playlistId = commuterApp.playlistInfo.id;
    const userId = commuterApp.userInfo.id;
    $.ajax({
        url: `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`,
        dataType: 'json',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken,
        },
        data: JSON.stringify({ uris: uris }),
        success: function (res) {
            console.log('what is res', res);
            commuterApp.displayWidget()
        },
        error: function (err) {
            console.log('there was an error', err);
        } 
    });
}

commuterApp.displayWidget = () => {
    console.log('you are called');
    const playlistId = commuterApp.playlistInfo.id;
    console.log('what else', commuterApp.playlistInfo);
    const userId = commuterApp.userInfo.id;
    const widgetMarkup = `<iframe src="https://open.spotify.com/embed?uri=spotify:user:${userId}:playlist:${playlistId}" width="300" height="530" frameborder="0" allowtransparency="true"></iframe>`
    const iphoneMarkup = `<img src="images/iphone2.svg" alt="illustration of white iPhone"/>`

    $('.spotifyWidget').empty();
	$('.spotifyWidget').append(iphoneMarkup, widgetMarkup);
    const thanksMarkup = `<h3 class="goodbye">Thanks for using the Commuter Buddy</h3>`;

	const refreshButton = `<button class="btn">One more time!</button>`;

	$('.customizedPlaylist .btn').remove();
	$('.customizedPlaylist .goodbye').remove();
	$('.customizedPlaylist .wrapper').append(thanksMarkup, refreshButton);
	$('.customizedPlaylist button').on('click', function(){
		location.reload();
	});
}



$(document).ready(function () {
    const params = commuterApp.setToken();
    accessToken = params.access_token;
    const state = params.state;
    const stateKey = 'spotify_auth_state';
    const storedState = localStorage.getItem(stateKey);

    const loggedInTemplate = $('#loggedInTemplate').html();
    const template = Handlebars.compile(loggedInTemplate);

    console.log('accessToken', accessToken, 'state', state, 'storedState', storedState)

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
                success: function (response) {
                    console.log('response successful', response)
                    const loggedInTemplateUser = template(response);

                    // store userInfo for later
                    commuterApp.userInfo = response;
                    $('#login').hide();
                    $('#loggedIn').show();
                    $('footer, #userInput').removeClass('show');
                    $('footer, #userInput').addClass('show');
                    $('#loggedIn').append(loggedInTemplateUser);
                    commuterApp.greetUser();
                },
                error: function (err) {
                    console.log('there was an error');
                }
            });
        } else {
            $('#login').show();
            $('#loggedIn').hide();
        }
    }

    // listen for user events

    $('#loginBtn').on('click', (e) => {
        e.preventDefault();
        commuterApp.getTokenObj();
    });

    $('form.calculateCommuterTime').on('submit', (e) => {
        e.preventDefault();
        const startLoc = $('input[name=origin_addresses]').val();
        const endLoc = $('input[name=destination_addresses]').val();
        const mode = $('input[type=radio]:checked').val();
        commuterApp.getCommuteData(startLoc, endLoc, mode);
    });

    $('.createPlaylist input[type=checkbox]').on('change', function (e) {
        // need to find a better solution
        if ($(this).siblings(':checked').length >= 5) {
            this.checked = false;
        }
    });

    $('form.createPlaylist').on('submit', (e) => {
        e.preventDefault();
        console.log('submitting');
        // commuterApp.collectGenres();
        commuterApp.createPlaylist();
    });

});