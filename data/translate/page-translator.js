

var BAD_NODES = ["SCRIPT", "LINK", "STYLE", "CODE", "HTML:SCRIPT", "NOSCRIPT"];
var MAX_CHARS = 900;
var MAX_NODES = 1999;

var text_nodes = [];

self.port.on('detect-language', function () {

    console.log(getLanguageSample());

});

var nodeIsTranslatable = function (node) {
    return (node.nodeType ==3 && node.nodeValue !== null &&
        0 > BAD_NODES.indexOf(node.parentNode.nodeName.toUpperCase()) &&
        1 < node.nodeValue.replace(/^\s+|\s+$/g, '').length);
};



self.port.on('translate', function (options) {
    console.log('Translating');
    text_nodes = [];
    options.texts = [];
    var char_count = 0;

    (function recursiveWalk(node) {
        if (node /*&& MAX_CHARS > char_count && MAX_NODES > text_nodes.length*/) {
            node = node.firstChild;
            while (node != null) {
                if (nodeIsTranslatable(node)) {
                        char_count += node.nodeValue.length;
                        options.texts.push(node.nodeValue);
                        text_nodes.push(node);
                } else if (node.nodeType == 1) {
                    recursiveWalk(node);
                }
                node = node.nextSibling;
            }
        }
    })(document.body);


    console.log(options.texts)
    console.log('nodes : ' + options.texts.length);
    console.log('characters : ' + char_count);

    self.port.emit('translate', options);
});


self.port.on('translation-complete', function (data) {
    for (var n = 0; n < text_nodes.length;n++) {
        text_nodes[n].nodeValue = data[n];
    }
});

var getLanguageSample = function () {
    var sample = document.title + ' ';
      var selectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'cite','div', '*'];

      while (sample.length < 128 && 0 < selectors.length) {

        var nodes = document.body.querySelectorAll(selectors.shift());
        if (0 < nodes.length) {
          for (var n = 0, l = nodes.length; n < l; n++) {
            sample += nodes[n].textContent + ' ';
          }
        }
      }

      return sample.substring(0, 128);
}

