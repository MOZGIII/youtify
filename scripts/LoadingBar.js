var LoadingBar = {
    $elem: undefined,

    init: function() {
        LoadingBar.$elem = $('#loading');
    },

    show: function() {
        LoadingBar.$elem.fadeIn(200);
    },

    hide: function() {
        LoadingBar.$elem.fadeOut(200);
    },
    error: function() {
        LoadingBar.$elem.addClass('error');
        LoadingBar.$elem.fadeOut(400, function() {
            LoadingBar.$elem.removeClass('error');
        });
    }
};
