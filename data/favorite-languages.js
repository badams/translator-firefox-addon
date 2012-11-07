self.port.on('init', function (options) {

    var $favorites = $('#favorites_select'),
        $available = $('#available_select');

    $('select').html('');

    for (var f in options.favorites) {
        $('#favorites_select').append('<option class="flag '+f+'" value='+ f +'>'+options.favorites[f]+'</option>');
    }

    for (var l in options.languages) {
        if (!options.favorites[l]) {
            $('#available_select').append('<option class="flag '+l+'" value='+ l +'>'+options.languages[l]+'</option>');
        }
    }

    $('#add').click(function () {
        var selected = $available.val();

        if (selected) {
            $available.find('option[value='+selected+']').appendTo($favorites);
        }
    });

    $('#remove').click(function () {
        var selected = $favorites.val();

        if (selected) {
            $favorites.find('option[value='+selected+']').appendTo($available);
        }
    });

    $('#save').click(function () {
        var new_favs = [];
        $favorites.find('option').each(function () {
            new_favs.push(this.value);
        });

        self.port.emit('save', new_favs);
    });

    $('#close').click(function () {
        self.port.emit('close');
    });
});

