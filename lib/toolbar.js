var {Cc, Ci} = require("chrome");
var mediator = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);

exports.ToolbarButton = function (options) {

    var document = mediator.getMostRecentWindow("navigator:browser").document;      
    var btn = document.createElement("toolbarbutton");  

    btn.setAttribute('id', options.id);
    btn.setAttribute('type', 'button');
    btn.setAttribute('orient', options.orient || 'horizontal');
    btn.setAttribute('label', options.label);
    btn.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");

    if (options.image) 
        btn.setAttribute('image', options.image);

    if (options.onClick)
        btn.addEventListener('click', options.onClick, false);

    if (options.events) 
        for (evt in options.events) 
            btn.addEventListener(evt, options.events[evt], false);
    
    document.getElementById("navigator-toolbox").palette.appendChild(btn);

    if (options.show) {
        var nav = document.getElementById("nav-bar");
        var currentset = nav.getAttribute('currentset').split(',');

        if (-1 < currentset.indexOf(options.id)) {
            currentset.push(options.id);
            nav.setAttribute('currentset', currentset.join(','));
        }
    }


   

    
}
