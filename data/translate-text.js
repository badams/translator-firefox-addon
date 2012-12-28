var translator;

self.port.on('init', function (options) {

    if (translator) {
        translator.container.get(0).innerHTML = '';
        delete translator;
    } 

    translator = new TabbedTranslator($('#translator'), {
        text : options.text,
        languages : options.languages,
        tabs : ['en', 'fr', 'de'],
        l10n : options.locales
    });

});


self.port.on('translation-complete', function (data) {
    if (data.result) {
        translator.setTab(data.to, data.result);
        //translated_text = data.result;
    } else {
        //translated_text = 'Error:'+ data.status
        //handle error
    }
});

self.port.on('detect-complete', function (data) {
    if (data.language) {
        translator.setOriginLanguage(data.language);
        //translated_text = data.result;
    } else {
        //translated_text = 'Error:'+ data.status
    }
});

var TabbedTranslator = function (el, options) {

    this.container = el;
    this.original_text = options.text;
    this.languages = options.languages;
    this.lang = 'Unknown';
    this.l10n = options.l10n;

    this.container.append('<ul class="tabs"></ul>');
    this.container.append('<div class="tab-content"></div>');

    this.tabs = this.container.find('ul.tabs');
    this.tab_content = this.container.find('div.tab-content');

    this.tabs.append('<li class="add-tab"><i class="icon icon-add"></i>'+this.template('languageList')+'</li>');
    this.addTab('origin').setTab('origin', this.original_text);

    this.langSelect = this.tabs.find('div.lang-select');

    if (options.tabs instanceof Array) {
        for (var t = 0; t < options.tabs.length; t++) {
            this.addTab(options.tabs[t]);
        }
    }

    this.showTab('origin');
    this.getOriginLanguage();

    this.tabs.click($.proxy(this.clickTab, this));
    this.langSelect.click($.proxy(this.selectLang, this));

    this.container.click($.proxy(function () {
        if (this.langSelect.is(':visible')) {
            this.langSelect.hide();
        }
    }, this));

    this.tab_content.find('div[data-lang="origin"] textarea').change(function () {
        $(this).attr('data-edited', new Date().getTime());
    });

    return this;
}; 


TabbedTranslator.prototype = {

    tpl : {

        tab : function (lang) {
            var content = '<li data-lang="'+lang+'"><i class="flag '+lang+'"></i>';
            if ('origin' === lang) content += this.l10n['Original_Text'];
            content += '</li>';

            return content;
        },

        tabContent : function (lang) {
            var content = '<div data-lang="'+lang+'"><textarea maxlength="2000"></textarea>';
            content += '<div class="tab-toolbar"><div class="lang-info">'
            if ('origin' == lang) {
                content += '<span class="from">'+this.lang+'</span>';
            } else {
                content += this.l10n['From'] + ': <span class="from">'+this.lang+'</span> '
                content += this.l10n['To'] + ': <span class="to">'+this.languages[lang]+'</span>';
            } 
            content += '</div><div class="spinner"></div>';
            content += '</div>';
            content += '</div>';

            return content;
        },

        languageList : function () {
            var html = '<div class="lang-select">';
            for (var lang in this.languages) {
                html += '<div data-lang="'+lang+'"><i class="flag '+lang+'"></i>'+this.languages[lang]+'</div>';
            }
            html += '</div>';
            return html;
        },
    },

    template : function (tpl, vars) {
        return $.proxy(this.tpl[tpl], this)(vars);
    },

    
    translate : function (lang, text) {
        this.tab_content.find('div[data-lang="'+lang+'"] textarea').attr('disabled', true).parent().addClass('working');
        self.port.emit('translate', {
            to : lang,
            from : '',
            text : text
        });
    },

    getOriginLanguage : function () {
        this.tab_content.find('div[data-lang="origin"]').addClass('working');
        self.port.emit('detect', this.original_text.substr(0, 180));
    },

    setOriginLanguage : function (lang) {
        this.lang = this.languages[lang];
        this.tabs.find('li[data-lang="origin"] i').addClass(lang);
        this.removeTab(lang);
        this.tab_content.find('div[data-lang="origin"]').removeClass('working');
        this.tab_content.find('div.lang-info span.from').html(this.languages[lang]);
    }, 

    addTab : function (lang) {
        if (this.tabs.find('li[data-lang='+lang+']').get(0)) {
            return this.showTab(lang);
        }

        this.tabs.find('.add-tab').before(this.template('tab', lang));
        this.tab_content.append(this.template('tabContent', lang));

        return this;
    },

    removeTab : function (lang) {
        var tab =  this.tabs.find('li[data-lang="'+lang+'"]');
        if (tab.is('active')) {
            this.showTab('origin');
        }

        tab.remove();
        this.tab_content.find('div[data-lang="'+lang+'"]').remove();
        
        return this;
    },

    showTab : function (lang) {
        this.tabs.find('li.active').removeClass('active');
        this.tabs.find('li[data-lang="'+lang+'"]').addClass('active');

        this.tab_content.find('div.active').removeClass('active');
        this.tab_content.find('div[data-lang="'+lang+'"]').addClass('active');
    

        if ('origin' !== lang) {
            var last_translate = parseInt(this.tab_content.find('div[data-lang="'+lang+'"] textarea').attr('data-edited')) || 0;
            var last_edit = parseInt(this.tab_content.find('div[data-lang="origin"] textarea').attr('data-edited'));

            if (last_edit > last_translate) {
                this.translate(lang, this.getText());
            }
        }

        return this;
    },

    setTab : function (lang, data) {
        this.tab_content.find('div[data-lang="'+lang+'"] textarea')
            .val(data)
            .attr('data-edited', new Date().getTime())
            .attr('disabled', false)
            .parent().removeClass('working');
    },

    clickTab : function (e) {
        var $t = $(e.target);
        $t = $t.is('li > i, li > a') ?  $t.parents('li') : $t;

        if ($t.is('ul.tabs > li[data-lang]')) {
            var lang = $t.attr('data-lang');
            if (lang) this.showTab(lang);
        }

        if ($t.is('li.add-tab')) {
            this.langSelect.show();
            return false;
        }
    },

    getText : function () {
        return this.tab_content.find('div[data-lang="origin"] textarea').val();
    },

    
    selectLang : function (e) {
        var $t = ('I' == e.target.nodeName) ? $(e.target.parentNode) : $(e.target);

        if ($t.is('div.lang-select > div[data-lang]')) {
            var lang = $t.attr('data-lang');
            this.langSelect.hide();
            this.addTab(lang).showTab(lang);
        }
    }
};

