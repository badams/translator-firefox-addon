var Request = require('request').Request;
var tabs = require('tabs');
var notifications = require('notifications');
var prefs = require('simple-prefs').prefs;
var data = require('self').data;

var API_URL = 'http://api.get-translator.com'; 

/**
 * translator.text(options, fn)
 *
 * Translates a string of text based on the given options.
 * If the text exceeds the set CHAR_LIMIT then it will 
 * be split into sections which get translated seperately 
 * and then stitched back together.
 *
 * @param options {from: 'en', to : 'fr', text: 'foo'}
 * @param fn call fuction to be executed when complete
 */
exports.text = function (options, fn) {
    var CHAR_LIMIT = 400
    var batches = [];
    var translations = [];    
    var errors = 0;

    while (0 < options.text.length) {
        var batch = options.text.substr(0, CHAR_LIMIT);
        options.text = options.text.slice(CHAR_LIMIT);
        batches.push(batch);
    }

    var cb = function (data, original_text) {
        if (data.json && data.json.result) {
            translations.push(data.json.result);
        } else {
            errors++;
            translations.push(original_text);
        }

        if (1 > batches.length) {

            var json = {
                result : translations.join(),
                status : data.status
            };

            if (errors > (translations.length/2)) {
                json['error'] = 'Translation Error';
                delete json['result'];
            }

            return fn(json);
        }
        
        BatchRequest({
            to : options.to, 
            from : options.from, 
            text : batches.splice(0, 1)[0]
        }, cb);    
    };

    BatchRequest({
            to : options.to, 
            from : options.from, 
            text : batches.splice(0, 1)[0]
    }, cb);

};

exports.detect = function (text, fn) {
    var query = '?q='+encodeURIComponent(text);
    Request({
        url : [API_URL,'detect', query].join('/'),
        onComplete : fn
    }).get();
};

exports.speak = function (options, fn) {
    Request({
        url : 'http://speak.get-translator.com/speak/?lang='+options.lang+'&q='+encodeURIComponent(options.text.substr(0, 400)),
        onComplete : fn
    }).get();
};

exports.page = function (options) {
    var google_url = 'http://translate.google.com/translate'; 
    google_url += '?&ie=UTF-8&sl='+options.from+'&tl=' + options.to + '&u=' + options.url;

    if ('https' == options.url.substr(0,5)) {
        //DOM Translation
        notifications.notify({
            'title' : 'Sorry',
            'text' : 'HTTPS Translations are not currently supported.', 
            'iconURL' : data.url('images/icons/translator-24.png')
        });
    } else {
        if (prefs.new_tab) {
            tabs.open(google_url);
        } else {
            tabs.activeTab.url = google_url;
        }
    }
};

exports.validURL = function (url) {
    var valid_url = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return valid_url.test(url);
}
/*
exports.page = function(options, fn) {

    var batches = [];
    var i = 0;

    while (options.texts.length > i){ //XXX Make this non-blocking
        var char_count = 0;
        var batch = [];
        while (char_count < CHAR_LIMIT ) {
            var text = options.texts[i];
            if (text) {
                batch.push(text);
                char_count += text.length;
            } else break;

            i++;
        }
        batches.push(batch);
    }

    var translations = [];

    var cb = function (data) {
        translations = translations.concat(data.json.result);

        if (1 > batches.length) {
            return fn(translations);
        }
        
        BatchRequest({
            to : options.to, 
            from : options.from, 
            texts : batches.splice(0, 1)[0]
        }, cb);    
    };

    BatchRequest({
            to : options.to, 
            from : options.from, 
            texts : batches.splice(0, 1)[0]
    }, cb);
};
*/

var BatchRequest = function (options, fn) {
    var query = '?to='+options.to+'&from='+options.from+'&text='+encodeURIComponent(options.text);
    Request({
        url : [API_URL, 'translate', query].join('/'),
        onComplete : function (data) {
            fn(data, options.text);
        }
    }).get();
};

