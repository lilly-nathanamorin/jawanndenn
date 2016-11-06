/* Copyright (C) 2016 Sebastian Pipping <sebastian@pipping.org>
** Licensed under GNU GPL v3 or later
*/
var _REPLACEMENTS_IN_ORDER = [
    ['**', '<strong>', '</strong>'],
    ['*', '<em>', '</em>'],
    ['__', '<strong>', '</strong>'],
    ['_', '<em>', '</em>'],
    ['`', '<tt>', '</tt>'],
];

var _CLOSING_OF = {};
$.each( _REPLACEMENTS_IN_ORDER, function(_, row) {
    prefix = row[0];
    closing = row[2];

    _CLOSING_OF[prefix] = closing;
});

var exampleOptions = ['Apple', 'Banana', 'Orange', 'Papaya'];

var createExampleVotes = function(options) {
    var examplePeople = ['Joe', 'Lisa', 'Monica', 'Astrid'];

    var exampleVotes = [];
    $.each( examplePeople, function( i, person ) {
        var votes = [];
        $.each( options, function() {
            votes.push( Math.random() > 0.5 );
        });
        exampleVotes.push( [person, votes] );
    });
    return exampleVotes;
};

var exampleConfigJson = JSON.stringify( {
        title: 'Which fruit do *you* like?',
        options: exampleOptions
        }, null, '  ' );

var resetConfig = function() {
    $('#config').val( exampleConfigJson );
};

// Excapes HTML and renders subset of markdown
var textToSafeHtml = function(text) {
    // KEEP IN SYNC with python server side!
    text = text
            .replace( /&/g, '&amp;' )
            .replace( /</g, '&lt;' )
            .replace( />/g, '&gt;' );

    chunks = [];

    opened = [];
    while (text.length) {
        var matched = false;

        $.each( _REPLACEMENTS_IN_ORDER, function(_, row) {
            prefix = row[0];
            opening = row[1];
            closing = row[2];

            if ( text.startsWith(prefix) ) {
                if (opened.length && opened[opened.length - 1] == prefix) {
                    // Close tag
                    chunks.push( closing );
                    opened.pop();
                } else {
                    // Open tag
                    chunks.push( opening );
                    opened.push( prefix );
                }

                text = text.slice( prefix.length );

                matched = true;
                return false;
            }
        });

        if (! matched) {
            chunks.push( text[0] );
            text = text.slice(1);
        }
    }

    // Close all unclosed tags
    opened.reverse();
    $.each( opened, function(_, prefix) {
        chunks.push( _CLOSING_OF[prefix] );
    });

    return chunks.join('');
};

var processConfig = function(config) {
    return {
        title: textToSafeHtml( config.title ),
        options: $.map( config.options, textToSafeHtml )
    };
};

var prevConfigJson = '';
var prevWellformed = null;

var sync = function() {
    var configJson = $( '#config' ).val();

    var wellformed = true;
    var config = null;
    try {
        config = jQuery.parseJSON( configJson );
    } catch( err ) {
        wellformed = false;
    }

    if (wellformed != prevWellformed) {
        addRemoveGoodBad( $( "#config" ),
                'wellformed', 'malformed', wellformed );
        enableButton( $('#createButton'), wellformed );
        prevWellformed = wellformed;
    }

    if (wellformed) {
        var configJsonNormalized = JSON.stringify( config );
        if (configJsonNormalized != prevConfigJson) {
            prevConfigJson = configJsonNormalized;

            config = processConfig( config );

            $( "#poll" ).html( createPollHtml( config,
                    createExampleVotes( config.options ),
                    Mode.PREVIEW ) );
        }
    }
};

$( document ).ready(function() {
    resetConfig();
    sync();
    setInterval( sync, 500 );
});