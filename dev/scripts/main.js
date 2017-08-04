const commuterApp = {}
let accessToken;

// SET ACCESS TOKEN FOR SPOTIFY

commuterApp.getTokenObj = () => {
    commuterApp.directSpotify()
}

commuterApp.generateRandomString = (length) => {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    // console.log('text', text)
    return text;
}

commuterApp.directSpotify = () => {
    console.log('reached direct spotify')
    const client_id = '0799860bd8cb460bbfe7ddeefa8e73d2'
    const redirect_uri = 'http://localhost:3000'
    const state = commuterApp.generateRandomString(5);
    const stateKey = 'spotify_auth_state';
    localStorage.setItem(stateKey, state);
    const scope = 'user-read-private user-read-email';

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
    if(stat !== 'OK') {
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
    })

    $('#calculateCommuteBtn').on('click', (e) => {
        e.preventDefault();
        const startLoc = $('input[name=origin_addresses]').val();
        const endLoc = $('input[name=destination_addresses]').val();
        const mode = $('input[type=radio]:checked').val();
        commuterApp.getCommuteData(startLoc, endLoc, mode);
    })

    $('.createPlaylist input[type=checkbox]').on('change', function(e) {
        // need to find a better solution
        if($(this).siblings(':checked').length >= 5){
            this.checked = false;
        }
    });

});