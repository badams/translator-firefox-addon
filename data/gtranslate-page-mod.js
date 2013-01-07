
self.port.on('attach', function() {

    var getElementHeight = function (id) {
        return document.defaultView.getComputedStyle(
            document.getElementById(id)
        ).getPropertyValue("height");
    };

    var cFrame = document.getElementById('contentframe');
    
    cFrame.setAttribute('style', 'top: '+getElementHeight('gt-c'));
    
    cFrame.addEventListener('DOMAttrModified', function (e) {
        var new_style  = 'top: '+getElementHeight('gt-c');

        if ('style' === e.attrName && e.newValue !== new_style) {
            this.setAttribute('style', new_style);
        }
    }, false);

    var selects = document.getElementsByTagName('select');

    for (var s = 0; s < selects.length; s++) {
        selects[s].className = '';
    }

    document.getElementById('gt-appname').innerHTML = 'Google Translate';
      
});




