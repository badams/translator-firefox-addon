var locales = {}
var original_text = ''
var translated_text = ''
self.port.on('init', function (options) {
    locales = options.locales;
    
    // Reset the form    
    $('#toggle_text').attr('disabled', true).text(locales['Original_Text']);
    $('.spinner').removeClass('active');
    $('#translate_button').removeAttr('disabled');
    $('#text').val('');
    $('select').html('');
    $('#from_lang').append('<option class="flat" value="">'+locales['Auto_Detect']+'</option>');

    var textbox = $('#text');
    var translate_button = document.getElementById('translate_button');
    var original_text = options.text;

    textbox.val(options.text);
    $('select').append(options.languages);

    translate_button.onclick = function () {
        $('.spinner').addClass('active');
        $(this).attr('disabled', true);
        self.port.emit('translate', {
            from : $('#from_lang').val(),
            to : $('#to_lang').val(),
            text : textbox.val()
        });
    };

    document.getElementById('cancel').onclick = function () {
        self.port.emit('close');
    };

    $('#toggle_text')[0].onclick = function () {
        if ('Original Text' == this.innerHTML) {
            $(this).text(locales['Translated_Text']);
            textbox.val(original_text);
        } else {
            $(this).text(locales['Original_Text']);
            textbox.val(translated_text);
        }
    };
});


self.port.on('translation-complete', function (data) {
    if (data.result) {
        translated_text = data.result;
    } else {
        translated_text = 'Error:'+ data.status
    }
    $('#text').val(translated_text);
    $('#toggle_text').removeAttr('disabled').text(locales['Original_Text']);
    $('.spinner').removeClass('active');
    $('#translate_button').removeAttr('disabled');
});

