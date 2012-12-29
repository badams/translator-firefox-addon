var translator;

self.port.on('init', function (options) {

    if (translator) {
        translator.container.get(0).innerHTML = '';
        delete translator;
    } 

    translator = new TabbedTranslator($('#translator'), {
        text : options.text,
        languages : options.languages,
        tabs : options.favorites,
        l10n : options.locales
    });

});


self.port.on('translation-complete', function (data) {
    if (data && data.result) {
        translator.setTab(data.to, data.result);
    } else {
        translator.errorTab(data.to);
    }
});

self.port.on('detect-complete', function (data) {
    if (data && data.language) {
        translator.setOriginLanguage(data.language);
    } else {
        translator.errorTab('origin');
    }
});

var TabbedTranslator = function (el, options) {

    this.container = el;
    this.original_text = options.text;
    this.languages = options.languages;
    this.favs = options.tabs;
    this.l10n = options.l10n;
    this.lang = this.l10n['Unknown'];
    this.tab_count = 0;

    this.container.append('<ul class="tabs"></ul>');
    this.container.append('<div class="tab-content"></div>');

    this.tabs = this.container.find('ul.tabs');
    this.tab_content = this.container.find('div.tab-content');

    this.addTab('origin').setTab('origin', this.original_text).showTab('origin');
    this.getOriginLanguage();

    this.tabs.click($.proxy(this.clickTab, this));

    this.container.click($.proxy(function () {
        if (this.langSelect.is(':visible')) this.langSelect.hide();
    }, this));

    this.tab_content.find('div[data-lang="origin"] textarea').change(function () {
        $(this).attr('data-edited', new Date().getTime());
    });

    return this;
}; 


TabbedTranslator.prototype = {
    /* {{{ Templates */
    tpl : {

        tab : function (lang) {
            var content = '<li data-lang="'+lang+'"><i class="flag '+lang+'"></i>';
            if ('origin' === lang) content += this.l10n['Original_Text'];
            content += '</li>';

            return content;
        },

        addTab : function () {
            return '<li class="add-tab"><i class="icon icon-add"></i>'+this.template('languageList')+'</li>';
        },

        removeTab : function () {
            return '<li class="remove-tab disabled"><i class="icon icon-remove"></i></li>';
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
            content += '</div></div></div>';

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
    /* }}} */
    /* {{{ Utils */
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
        self.port.emit('detect', this.original_text.substr(0, 50));
    },

    setOriginLanguage : function (lang) {
        this.lang = this.languages[lang];
        this.tabs.find('li[data-lang="origin"] i').addClass(lang);
        this.tab_content.find('div[data-lang="origin"]').removeClass('working');
        this.tabs.append(this.template('addTab'));
        this.tabs.append(this.template('removeTab'));
        this.langSelect = this.tabs.find('div.lang-select');
        this.tab_content.find('div.lang-info span.from').html(this.languages[lang]);

        for (var t in this.favs) this.addTab(t);
    }, 

    getText : function () {
        return this.tab_content.find('div[data-lang="origin"] textarea').val();
    },

    saveFavorites : function () {
        var favs = [];
        for (var f in this.favs) favs.push(f)
        self.port.emit('save-favorites', favs);
    },
    /* }}} */
    /* {{{ Tab API */
    /* {{{ addTab(lang) */
    addTab : function (lang) {
        if (this.tabs.find('li[data-lang='+lang+']').get(0))
            return this.showTab(lang);

        if (this.lang !== this.languages[lang]) {
            if (this.tabs.find('.add-tab')[0])
                this.tabs.find('.add-tab').before(this.template('tab', lang));
            else
                this.tabs.append(this.template('tab', lang));

            this.tab_content.append(this.template('tabContent', lang));
            
            this.tab_count++;

            if (this.tab_count  > 7) {
                this.tabs.find('li.add-tab').hide();
            }

            this.favs[lang] = this.languages[lang];
        }
        return this;
    },
    /* }}} */
    /* {{{ removeTab (lang) */
    removeTab : function (lang) {
        var tab =  this.tabs.find('li[data-lang="'+lang+'"]');
        if (tab.is('.active')) {
            this.showTab(tab.prev().attr('data-lang') || 'origin');
        }

        tab.remove();
        this.tab_content.find('div[data-lang="'+lang+'"]').remove();
        this.tab_count--;
        this.saveFavorites();
        
        if (this.tab_count <= 7) this.tabs.find('li.add-tab').show();
        
        delete this.favs[lang];

        return this;
    },
    /* }}} */
    /* {{{ showTab(lang) */
    showTab : function (lang) {
        this.tabs.find('li.active').removeClass('active');
        this.tabs.find('li[data-lang="'+lang+'"]').addClass('active');

        this.tab_content.find('div.active').removeClass('active');
        this.tab_content.find('div[data-lang="'+lang+'"]').addClass('active');
    

        if ('origin' !== lang) {
            this.tabs.find('li.remove-tab').removeClass('disabled');
            var last_translate = parseInt(this.tab_content.find('div[data-lang="'+lang+'"] textarea').attr('data-edited')) || 0;
            var last_edit = parseInt(this.tab_content.find('div[data-lang="origin"] textarea').attr('data-edited'));

            if (last_edit > last_translate) {
                this.translate(lang, this.getText());
            }
        } else {
            this.tabs.find('li.remove-tab').addClass('disabled');
        }

        return this;
    },
    /* }}} */
    /* {{{ setTab(lang, content)*/
    setTab : function (lang, data) {
        this.tab_content.find('div[data-lang="'+lang+'"] textarea')
            .val(data)
            .attr('data-edited', new Date().getTime())
            .attr('disabled', false)
            .parent().removeClass('working');

        return this;
    },
    /* }}} */
    /* {{{ errorTab(lang) */
    errorTab : function (lang) {
        this.tabs.find('li[data-lang="'+lang+'"] i').addClass('icon icon-error');
        this.tab_content.find('div[data-lang="'+lang+'"]').addClass('error');
        this.setTab(lang, this.l10n['Translation_Error']);
    },
    /* }}} */
    /* }}} */
    /* {{{ Events */
    clickTab : function (e) {
        var $t = $(e.target);
        $t = $t.is('i') ?  $t.parent() : $t;

        if ($t.is('ul.tabs > li[data-lang]')) {
            var lang = $t.attr('data-lang');
            if (lang) this.showTab(lang);
        }

        if ($t.is('li.add-tab')) {
            var left  = parseInt(this.langSelect.toggle().css('left').replace('px', ''));

            // Stop the lang-select from going past the edge of the viewport.
            if (left < 130) 
                this.langSelect.css('left', 130);
            else 
                this.langSelect.css('left', 'auto');

            return false;
        }

        if ($t.is('li.remove-tab:not(.disabled)')) {
            this.removeTab(this.tabs.find('li.active').attr('data-lang'));
            this.saveFavorites();
        }
    
        if ($t.is('div.lang-select > div[data-lang]')) {
            var lang = $t.attr('data-lang');
            this.langSelect.hide();

            if (this.lang !== this.languages[lang]) 
                this.addTab(lang).showTab(lang);
                this.saveFavorites();
        }
    },
    /* }}} */
};

