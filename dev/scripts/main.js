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

commuterApp.callGoogle = () => {
    console.log('call google')
}


$(document).ready(function () {
    // greetUser()

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
                    console.log('response', response)
                    const loggedInTemplateUser = template(response);
                    $('#login').hide();
                    $('#loggedIn').show();
                    $('#loggedIn').append(loggedInTemplateUser)
                   
                }
            });
        } else {
            $('#login').show();
            $('#loggedIn').hide();
        }
    }


    $('#loginBtn').on('click', (e) => {
        e.preventDefault();
        commuterApp.getTokenObj();
    })

    $('#userInput').on('click', (e) => {
        e.preventDefault();
        commuterApp.callGoogle();
    })

});