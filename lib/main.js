var widgets = require('widget')
    , pageMod = require('page-mod')
    , panels = require('panel')
    , cm = require('context-menu')
    , tabs = require('tabs')
    , notifications = require('notifications')
    , data = require('self').data
    , _ = require('l10n').get
    , translator = require('translator')
    , Languages = require('languages')
    , simple_prefs = require('simple-prefs')
    , prefs = require('preferences-service')
    , prefs_branch = 'extensions.translator@dontfollowme.net'; 

exports.main = function (options, callbacks) {
    /* {{{ First-Run */
    //Languages.setup(); //XXX Remove this.

    if ('startup' != options.loadReason) {
        Languages.setup();
    }

    /* }}} */
    /* {{{ Settings */
    simple_prefs.on('FavoriteLanguages', function () {
        LanguagesPanel.show();
        
        LanguagesPanel.port.emit('init', {
            languages : Languages.languages,
            favorites : Languages.getFavorites()
        });
    });

    var LanguagesPanel = panels.Panel({
        width: 400,
        height: 250,
        contentURL : data.url('favorite-languages.html'),
        contentScriptFile : [data.url('jquery-1.8.2.min.js'), data.url('favorite-languages.js')]
    });

    LanguagesPanel.port.on('close', function () {
        LanguagesPanel.hide();
    });

    LanguagesPanel.port.on('save', function (favs) {
        Languages.saveFavorites(favs);
        LanguagesPanel.hide();
    });
    

    /* }}} */
    /* {{{ Text Translation */
    var onTranslateText = function (text) {
        textTranslatePanel.show();
        textTranslatePanel.port.emit('init', {
            text : text,
            languages : Languages.languages,
            favorites : Languages.getFavorites(),
            speakLanguages : Languages.speakLanguages,
            locales : {
                'Original_Text' : _('Original_Text'),
                'To' : _('To'),
                'From' : _('From'),
                'Unknown' : _('Unknown'),
                'Translation_Error' : _('Translation_Error'),
                'Close' : _('Close')
            }
        });
    };

    cm.Item({
        label : _('Translate_This_Text'),
        image : data.url('images/icons/translator-16.png'),
        context : cm.SelectionContext(),
        contentScript : 'self.on("click", function () { self.postMessage(window.getSelection().toString());});',
        onMessage : onTranslateText
    });

    var textTranslatePanel = panels.Panel({
        width: 400,
        height: 320,
        contentURL : data.url('translate-text.html'),
        contentScriptFile : [data.url('jquery-1.8.2.min.js'), data.url('translate-text.js')],
    });

    textTranslatePanel.port.on('close', function () {
        textTranslatePanel.hide();
    });

    textTranslatePanel.port.on('translate', function (options) {
        translator.text(options, function (data) {
            textTranslatePanel.port.emit('translation-complete', {
                result : data.result,
                status: data.status,
                to : options.to  
            });
        });
    });
    
    textTranslatePanel.port.on('detect', function (text) {
        translator.detect(text, function (data) {
            textTranslatePanel.port.emit('detect-complete', data.json);
        });
    });

    textTranslatePanel.port.on('speak', function (options) {
        translator.speak(options, function (data) {
            textTranslatePanel.port.emit('speak-complete', data.json);
        });
    });

    textTranslatePanel.port.on('save-favorites', function (favorites) {
        Languages.saveFavorites(favorites);
    });
    /* }}} */
    /* {{{ Webpage Translation */
    var translatePanel = panels.Panel({
        width : 200,
        height: 170,
        contentURL : data.url('translate-page.html'),
        contentScriptFile : [
            data.url('translate-page.js'),
            data.url('jquery-1.8.2.min.js')
        ]
    });

    translatePanel.on('show', function () {
        this.port.emit('init', {
            languages : Languages.generateSelectList(),
            locales : {'Auto_Detect' : _('Auto_Detect')}
        });
    });
    
    translatePanel.port.on('close', function () {
        translatePanel.hide();
    });

    translatePanel.port.on('translate-page', function (options) {

        if (true == options.auto) {
            Languages.setFavorite(options.to);
            prefs.set(prefs_branch+'.one_click', true);
        }

        translator.page({
            from : options.from, 
            to : options.to, 
            url : tabs.activeTab.url
        });

        translatePanel.hide();
    });

    var widget = widgets.Widget({
        id: "translator-toolbar-button",
        label: "Translator",
        contentURL: data.url('images/icons/translator-16.png'),
        onClick : function () {
            if (translator.validURL(tabs.activeTab.url)) { 
                if (simple_prefs.prefs.one_click) {
                    translator.page({
                        from : '',
                        to : Languages.getFavorite()['code'],
                        url : tabs.activeTab.url
                    }); 
                } else {
                    translatePanel.show();
                }
            }
        }
    });

    /* }}} */
};
