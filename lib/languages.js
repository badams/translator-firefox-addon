var prefs = require('preferences-service')
    , _ = require('l10n').get;

var languages = {
    'ar' : _('Arabic'),
    'bg' : _('Bulgarian'),
    'ca' : _('Catalan'),
    'zh-CHS' : _('Chinese_Simplified'),
    'zh-CHT' : _('Chinese_Traditional'),
    'cs' : _('Czech'),
    'da' : _('Danish'),
    'nl' : _('Dutch'),
    'en' : _('English'),
    'et' : _('Estonian'),
    'fa' : _('Persian'),
    'fi' : _('Finnish'),
    'fr' : _('French'),
    'de' : _('German'),
    'el' : _('Greek'),
    'ht' : _('Haitian_Creole'),
    'he' : _('Hebrew'),
    'hi' : _('Hindi'),
    'hu' : _('Hungarian'),
    'id' : _('Indonesian'),
    'it' : _('Italian'),
    'ja' : _('Japanese'),
    'ko' : _('Korean'),
    'lv' : _('Latvian'),
    'lt' : _('Lithuanian'),
    'mww' : _('Hmong Daw'),
    'no' : _('Norwegian'),
    'pl' : _('Polish'),
    'pt' : _('Portuguese'),
    'ro' : _('Romanian'),
    'ru' : _('Russian'),
    'sk' : _('Slovak'),
    'sl' : _('Slovenian'),
    'es' : _('Spanish'),
    'sv' : _('Swedish'),
    'th' : _('Thai'),
    'tr' : _('Turkish'),
    'uk' : _('Ukranian'),
    'vi' : _('Vietnamese')
};

/**
 * Build the favorite languages list
 */
var favorites = {};
var pref_name = 'extensions.translator@dontfollowme.net.favorite_langs'; 

var updateFavorites = function () {
    if (prefs.isSet(pref_name)) {
        favorites = {};
        var favs = prefs.get(pref_name).split(',');

        favs.forEach(function (el) {
            if (languages[el])
                favorites[el] = languages[el];
        });
    }
}

updateFavorites();

/**
 * Languages.setup()
 *
 * This gets executed on 1st run or on upgrade, it determines 
 * the user's locale and sets it as the favorite language.
 */
exports.setup = function () {
    var locale = prefs.getLocalized('general.useragent.locale');

    locale = (!locale)? 'en' : locale.split('-')[0];   

    if (languages[locale] && !prefs.isSet(pref_name)) {
        prefs.set(pref_name, locale);
        favorites[locale] = languages[locale];
    }

};

/**
 * This is called to save a new set of favorites
 * with the internal preferences-service.
 */
exports.saveFavorites = function (favs) {
    prefs.set(pref_name, favs.join(','));
    updateFavorites();
};


exports.getFavorite = function () {

    var fav = prefs.get(pref_name).split(',')[0];

    return {
        code : fav,
        name : languages[fav] 
    };
};

/**
 * Languages.generateSelectList()
 *
 * Generates a string of HTML <option> elements for language dropdowns.
 * favorite languages are highlighted and put at the top of the list.
 */
exports.generateSelectList = function () {
    var html = '';
    for (var f in favorites)
        html += '<option class="favorite flag '+f+'" value="'+f+'">'+ favorites[f] + '</option>';

    for (var o in languages)
        if (!favorites[o])
            html += '<option class="flag '+o+'" value="'+o+'">'+ languages[o] + '</option>';

    return html;
};

exports.languages = languages;
exports.getFavorites = function () { return favorites};
