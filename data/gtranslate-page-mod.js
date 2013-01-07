
self.port.on('attach', function() {
    setTimeout(function () {
        document.getElementById('contentframe').style.top = '40px';
    }, 500);

    var selects = document.getElementsByTagName('select');

    for (var s = 0; s < selects.length; s++) {
        selects[s].className = '';
    }

    document.getElementById('gt-appname').innerHTML = 'Google Translate';
      
});


