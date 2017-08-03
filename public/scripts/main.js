'use strict';

console.log('helloo world');
var myTemplate = $('#welcome').html();
var template = Handlebars.compile(myTemplate);
var person = {
    name: 'Joe Smith'
};

var personTemplate = template(person);
$('#prompt').append(personTemplate);