self.port.on('init', function (options) {
    var button = document.getElementById('translate_button');
    var cancel = document.getElementById('cancel');
    var select_from = document.getElementById('from_lang');
    var select_to = document.getElementById('to_lang');
    var auto = document.getElementById('auto');

    $('select').html('')
    $('#from_lang').append('<option class="flat" value="">'+options.locales['Auto_Detect']+'</option>');
    $('select').append(options.languages);


    button.onclick = function (evt) {

        self.port.emit('translate-page', {
            from : select_from.value,
            to : select_to.value,
            auto : auto.checked
        });
    };

    cancel.onclick = function () {
        self.port.emit('close');
    };

});

