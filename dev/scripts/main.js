// console.log('helloo world')
// var myTemplate = $('#welcome').html();
// var template = Handlebars.compile(myTemplate);
// var person = {
//     name: 'Joe Smith'
// };

// var personTemplate = template(person);
// $('#prompt').append(personTemplate);
const commuterApp = {}
let accessToken;

commuterApp.init = () => {
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

$(document).ready(function(){
	// greetUser()
    $('#loginBtn').on('click', (e) => {
        e.preventDefault();
	    commuterApp.init();
    })
	// searchItem.init();


	//smoothscroll
	// $('a.btn').smoothScroll({
	// 	speed: 400
	// });
});