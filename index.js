var self = require("sdk/self")
var { ActionButton } = require("sdk/ui/button/action");
var Panel = require("sdk/panel").Panel;
var tabs = require("sdk/tabs");
var simplePrefs = require("sdk/simple-prefs");
var preferences = simplePrefs.prefs;
var prefs = require("sdk/preferences/service");
var _ = require("sdk/l10n").get;
var cm = require("sdk/context-menu");
var pageMod = require("sdk/page-mod");

var translator = require("lib/translator");
var languages = require("lib/languages");
var prefs_branch = 'extensions.translator@dontfollowme.net';

exports.main = function (options, callbacks) {
    if ('startup' != options.loadReason) {
        languages.setup();
    }
}

var button = ActionButton({
      id: "translator-toolbar-button",
      label: "Translator",
      icon: {
        "16": self.data.url("images/icons/translator-16.png"),
        "32": self.data.url("images/icons/translator-32.png"),
      },
      onClick : function (state) {
          if (translator.validURL(tabs.activeTab.url)) {
              if (preferences.one_click) {
                  translator.page({
                      from : '',
                      to : languages.getFavorite()['code'],
                      url : tabs.activeTab.url
                  });
              } else {
                  translatePanel.show();
              }
          }
      }
  });



  var translatePanel = Panel({
      width : 200,
      height: 170,
      contentURL : self.data.url('translate-page.html'),
      contentScriptFile : [
          self.data.url('translate-page.js'),
          self.data.url('jquery-2.1.4.min.js')
      ]
  });

  translatePanel.on('show', function () {
      this.port.emit('init', {
          languages : languages.generateSelectList(),
          locales : {'Auto_Detect' : _('Auto_Detect')}
      });
  });

  translatePanel.port.on('close', function () {
      translatePanel.hide();
  });

  translatePanel.port.on('translate-page', function (options) {

      if (true == options.auto) {
          languages.setFavorite(options.to);
          prefs.set(prefs_branch+'.one_click', true);
      }

      translator.page({
          from : options.from,
          to : options.to,
          url : tabs.activeTab.url
      });

      translatePanel.hide();
  });

  /**
   *
   */
  var onTranslateText = function (text) {
      textTranslatePanel.show();
      textTranslatePanel.port.emit('init', {
          text : text,
          languages : languages.languages,
          favorites : languages.getFavorites(),
          speakLanguages : languages.speakLanguages,
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
      image : self.data.url('images/icons/translator-16.png'),
      context : cm.SelectionContext(),
      contentScript : 'self.on("click", function () { self.postMessage(window.getSelection().toString());});',
      onMessage : onTranslateText
  });

  var textTranslatePanel = Panel({
      width: 400,
      height: 320,
      contentURL : self.data.url('translate-text.html'),
      contentScriptFile : [self.data.url('jquery-2.1.4.min.js'), self.data.url('translate-text.js')],
  });

  textTranslatePanel.on('hide', function () {
      textTranslatePanel.port.emit('hide');
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
      languages.saveFavorites(favorites);
  });

  simplePrefs.on('FavoriteLanguages', function () {
      LanguagesPanel.show();

      LanguagesPanel.port.emit('init', {
          languages : languages.languages,
          favorites : languages.getFavorites(),
          tts_langs : languages.speakLanguages,
      });
  });

  var LanguagesPanel = Panel({
      width: 380,
      height: 280,
      contentURL : self.data.url('favorite-languages.html'),
      contentScriptFile : self.data.url('favorite-languages.js')
  });

  LanguagesPanel.port.on('close', function () {
      LanguagesPanel.hide();
  });

  LanguagesPanel.port.on('save', function (favs) {
      languages.saveFavorites(favs);
      LanguagesPanel.hide();
  });

  pageMod.PageMod({
      include: 'http://translate.google.com/translate?*',
      contentScriptFile: self.data.url("gtranslate-page-mod.js"),
      contentStyleFile: self.data.url("gtranslate-page-mod.css"),
      onAttach: function(worker) {
          worker.port.emit('attach');
      }
  });
