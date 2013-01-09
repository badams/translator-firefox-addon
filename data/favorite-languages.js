var Manager;

self.port.on('init', function (options) {
    Manager = new LanguageManager(document.getElementById('LangManager'), options); 
});

/* {{{ LanguageManager */
/* {{{ Constructor */
var LanguageManager = function (el, options) {
    this.container = el;
    this.languages = options.languages;
    this.favorites = options.favorites;
    this.tts_langs = options.tts_langs;

    this.list = this.container.querySelector('div.favorite-languages');
    this.toolbar = this.container.querySelector('div.language-toolbar');
    this.langSelect = this.toolbar.querySelector('div.lang-select');

    this.list.innerHTML = '';
    this.langSelect.innerHTML = '';

    this.createLangSelect();

    for (var f in this.favorites) this.addItem(f);

    var that = this;
    this.container.onclick =  function (e) {
        that.click.apply(that, [e]);
    };

    return this;
};
/* }}} */
/* {{{ Api */
LanguageManager.prototype = {
    /* {{{ save() */
    /**
     * Saves the current list of languages to favorites
     */
    save : function () {
        var items = this.list.children, data = [];
        for (var i = 0; i < items.length; i++) 
            data.push(items[i].getAttribute('data-lang'));

        self.port.emit('save', data);
        self.port.emit('close');
    },
    /* }}} */
    /* {{{ getItem(lang) */
    /**
     * returns an item from the list of favorite languages.
     * 
     * @param lang (language code)
     * @return DOM Element
     */
    getItem : function (lang) {
        return this.list.querySelector('div[data-lang="'+lang+'"]') || false;
    },
    /* }}} */
    /* {{{  addItem(lang) */
    /**
     * Adds a new Item to the favorites list based on the given language code.
     * @param lang (language code)
     */
    addItem : function (lang) {
        if (!this.getItem(lang)) {
            this.list.innerHTML += this.createItem(lang);
        }
    },
    /* }}} */
    /* {{{  removeItem(lang) */
    /**
     * Removes an item from the list.
     * @param lang (language code)
     */
    removeItem : function (lang) {
        this.list.removeChild(this.getItem(lang));
    },
    /* }}} */
    /* {{{ createItem(lang) */
    /**
     * Generates the html for a item in the favorites list, 
     * based on the given language code.
     *
     * @param lang (language code)
     */
    createItem : function (lang) {
        var html = '<div data-lang="'+lang+'" class="language-item">';
        
        html += '<span class="item-title flag '+lang+'">'+this.languages[lang]+' ('+lang.toUpperCase()+')</span>';
        html += '<div class="controls">';

        if (-1 < this.tts_langs.indexOf(lang)) {
            html += '<i class="icon icon-sound"></i>';
        }
        
        html += '<button class="btn remove"><i class="icon icon-remove"></i></button></div>';
        html += '</div>';

        return html;
    },
    /* }}} */
    /* {{{ click */
    /**
     * Click handler for enire widget, 
     * delegates actions based on what element was clicked.
     * 
     * @arg (Event Object)
     */
    click : function (e) {
        if ('btn remove' === e.target.className) {
            var lang = e.target.parentNode.parentNode.getAttribute('data-lang');
            this.removeItem(lang);
        }

        if ('btn add' === e.target.className) {
            this.toggleLangSelect();
            return false;
        }

        if ('new-lang' === e.target.className) {
            this.addItem(e.target.getAttribute('data-lang'));
            this.toggleLangSelect();
            return false;
        }

        if ('block' === this.langSelect.style.display) {
            this.langSelect.style.display = 'none';
            return false;
        }

        if ('save' === e.target.getAttribute('id')) {
            this.save();
            return false;
        }

        if ('close' === e.target.getAttribute('id')) {
            self.port.emit('close');
            return false;
        }
    },
    /* }}} */
    /* {{{ createLangSelect() */
    /** 
     *  Generates the html for the drop-down language selector.
     */
    createLangSelect : function () {
        var html = '';
        for (var lang in this.languages) {
            html += '<div class="new-lang" data-lang="'+lang+'"><i class="flag '+lang+'"></i>'+this.languages[lang]+'</div>';
        }

        this.langSelect.innerHTML = html;
    },
    /* }}} */
    /* {{{ toggleLangSelect() */
    /** 
     * toggles the visiblity of the drop-down
     * language selector.
     */
    toggleLangSelect : function () {
        this.langSelect.style.display =  ('block' === this.langSelect.style.display) ? 'none' : 'block';
    },
    /* }}} */
};
/* }}} */
/* }}} */
