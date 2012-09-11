var userIdFromLookupOnServer;

function loadPhrases() {
    function hoverIn() {
        $(this).find('.delete').css('visibility', 'visible');
    }

    function hoverOut() {
        $(this).find('.delete').css('visibility', 'hidden');
    }

    function deleteButtonClicked() {
        var $tr = $(this).parents('tr');
        var id = $tr.data('id');
        if (confirm("Are you sure?")) {
            $.ajax({
                type: 'DELETE',
                url: '/phrases/' + id,
                statusCode: {
                    200: function(data) {
                         loadPhrases();
                    }
                }
            });
        }
    }

    function createTableRow(item) {
        var $tr = $('<tr></tr>').data('id', item.id).hover(hoverIn, hoverOut);
        $('<td class="text"></td>').text(item.text).appendTo($tr);
        $('<td><button class="delete">Delete</button></td>')
            .find('.delete')
            .css('visibility', 'hidden')
            .click(deleteButtonClicked)
            .end()
            .appendTo($tr);
        return $tr;
    }

    $('#phrases tbody').html('');
    showLoadingBar();
    $.getJSON('/phrases', function(data) {
        $.each(data, function(i, item) {
            createTableRow(item).appendTo('#phrases tbody');
        });
        hideLoadingBar();
    });
}

function getLanguageByCode(code) {
    var ret = 'Unknown';

    $.each($('select[name=lang] option'), function(i, elem) {
        elem = $(elem);
        if (elem.attr('value') === code) {
            ret = elem.text();
            return false;
        }
    });

    return ret;
}

function loadLanguages() {
    function hoverIn() {
        $(this).find('.actions *').css('visibility', 'visible');
    }

    function hoverOut() {
        $(this).find('.actions *').css('visibility', 'hidden');
    }

    function deleteButtonClicked() {
        var $tr = $(this).parents('tr');
        var id = $tr.data('id');
        if (confirm("Are you sure?")) {
            $.ajax({
                type: 'DELETE',
                url: '/languages/' + id,
                statusCode: {
                    200: function(data) {
                         loadLanguages();
                    }
                }
            });
        }
    }

    function update() {
        var $tr = $(this).parents('tr');
        var id = $tr.data('id');

        var data = {
            enabled_on_site: $tr.find('input[name=enabled_on_site]').is(':checked'),
            enabled_in_tool: $tr.find('input[name=enabled_in_tool]').is(':checked')
        };

        showLoadingBar();
        $.post('/languages/' + id, data, function() {
            hideLoadingBar();
        });
    }

    function createTableRow(item) {
        var $tr = $('<tr></tr>').data('id', item.id).hover(hoverIn, hoverOut);
        var $td1 = $('<td class="label"></td>').text(item.label).attr('title', item.code).appendTo($tr);
        var $td2 = $('<td class="actions"></td>').appendTo($tr);
        var $button = $('<button class="delete">Delete</button>').appendTo($td2);

        var $checkbox1 = $('<input type="checkbox" name="enabled_in_tool" />').attr('title', 'Enable in Tool').appendTo($td2);
        var $label1 = $('<label for="enabled_in_tool">Enabled in Tool</label>').appendTo($td2);

        var $checkbox2 = $('<input type="checkbox" name="enabled_on_site" />').attr('title', 'Enable on Site').appendTo($td2);
        var $label2 = $('<label for="enabled_on_site">Enabled on Site</label>').appendTo($td2);

        $checkbox1.change(update);
        $checkbox2.change(update);

        $button.click(deleteButtonClicked);

        $td2.find('*').css('visibility', 'hidden');

        if (item.enabled_in_tool) {
            $checkbox1.attr('checked', 'checked');
        }
        if (item.enabled_on_site) {
            $checkbox2.attr('checked', 'checked');
        }

        return $tr;
    }

    $('#languages tbody').html('');
    showLoadingBar();
    $.getJSON('/languages', function(data) {
        $.each(data, function(i, item) {
            createTableRow(item).appendTo('#languages tbody');
        });
        hideLoadingBar();
    });
}

function loadTeamLeaders(langCode) {
    history.pushState(null, null, '/admin/teams/' + langCode);

    function deleteButtonClicked() {
        var $tr = $(this).parents('tr');
        var id = $tr.data('id');
        if (confirm("Are you sure?")) {
            $.ajax({
                type: 'DELETE',
                url: '/languages/' + langCode + '/leaders/' + id,
                statusCode: {
                    200: function(data) {
                         loadTeamLeaders(langCode);
                    }
                }
            });
        }
    }

    function hoverIn() {
        $(this).find('.delete').css('visibility', 'visible');
    }

    function hoverOut() {
        $(this).find('.delete').css('visibility', 'hidden');
    }

    function createRow(item) {
        var $tr = $('<tr></tr>').data('id', item.id).hover(hoverIn, hoverOut);
        $('<td></td>').text(item.name).appendTo($tr);
        $('<td><button class="delete">Delete</button></td>')
            .find('.delete')
            .css('visibility', 'hidden')
            .click(deleteButtonClicked)
            .end()
            .appendTo($tr);
        return $tr;
    }

    showLoadingBar();
    $('#teams tbody').html('');
    $.getJSON('/languages/' + langCode + '/leaders', function(data) {
        hideLoadingBar();
        $.each(data, function(i, item) {
            createRow(item).appendTo('#teams tbody');
        });
    });
}

function loadSnapshots() {
    function hoverIn() {
        $(this).find('.delete, .activate').css('visibility', 'visible');
    }

    function hoverOut() {
        $(this).find('.delete, .activate').css('visibility', 'hidden');
    }

    function deleteButtonClicked() {
        var $tr = $(this).parents('tr');
        var id = $tr.data('id');
        if (confirm("Are you sure?")) {
            $.ajax({
                type: 'DELETE',
                url: '/snapshots/' + id,
                statusCode: {
                    200: function(data) {
                         loadSnapshots();
                    }
                }
            });
        }
    }

    function activateButtonClicked() {
        var $tr = $(this).parents('tr');
        var id = $tr.data('id');
        if (confirm("All publicly visible translations will be updated. Continue?")) {
            $.ajax({
                type: 'PUT',
                url: '/snapshots/' + id,
                statusCode: {
                    200: function(data) {
                         loadSnapshots();
                    }
                }
            });
        }
    }

    function createRow(item) {
        var $tr = $('<tr></tr>').data('id', item.id).hover(hoverIn, hoverOut);
        $('<td></td>').text(item.date).appendTo($tr);
        $('<td><button class="delete">Delete</button><button class="activate">Activate</button></td>')
            .find('.delete')
            .click(deleteButtonClicked)
            .css('visibility', 'hidden')
            .end()
            .find('.activate')
            .click(activateButtonClicked)
            .css('visibility', 'hidden')
            .end()
            .appendTo($tr);
        if (item.active) {
            $tr.addClass('active');
        }
        return $tr;
    }

    showLoadingBar();
    $('#snapshots tbody').html('');
    $.getJSON('/snapshots', function(data) {
        $.each(data, function(i, item) {
            createRow(item).appendTo('#snapshots tbody');
        });
        hideLoadingBar();
    });
}

var tabCallbacks = {
    phrases: function() {
        loadPhrases();
    },
    languages: function() {
        loadLanguages();
    },
    teams: function() {
        var path = window.location.pathname.split('/');
        if (path.length > 3) { // e.g. /admin/teams/sv_SE
            loadTeamLeaders(path[3]);
            $('#teams select option[value|="' + path[3] + '"]').attr('selected', 'selected');
        } else {
            loadTeamLeaders($('#teams select').val());
        }
    },
    snapshots: function() {
        loadSnapshots();
    },
    deploy: function() {
    },
}

function resetLeaderPopup() {
    $('#addLeaderPopup').removeClass('success');
    $('#addLeaderPopup input[type=email]').val('');
    userIdFromLookupOnServer = null; // global
}

$(document).ready(function() {
    $('#tabs li').click(function() {
        var rel = $(this).attr('rel');

        $('#tabs .selected').removeClass('selected');
        $(this).addClass('selected');

        $('.pane.selected').removeClass('selected');
        $('#' + rel).addClass('selected');

        if (rel === 'teams') {
            var path = window.location.pathname.split('/');
            path[2] = rel;
            path = path.join('/');
            history.pushState(null, null, path);
        } else {
            history.pushState(null, null, '/admin/' + rel);
        }

        tabCallbacks[rel]();
    });

    var path = window.location.pathname.split('/');
    if (path.length > 2) { // e.g. /admin/deploy
        $('#tabs li[rel=' + path[2] + ']').click();
    } else {
        $('#tabs li').first().click();
    }

    $('#addPhraseButton').click(function() {
        $('#addPhrasePopup textarea').val('');
        showPopup('addPhrasePopup');
    });

    $('#addLanguageButton').live('click', function() {
        $('#addLanguagePopup input[type="text"]').val('');
        showPopup('addLanguagePopup');
    });

    $('#addLeaderButton').click(function() {
        resetLeaderPopup();
        showPopup('addLeaderPopup');
    });

    $('#addPhrasePopup input[type=submit]').click(function() {
        var text, args;

        text = $.trim($('#addPhrasePopup textarea').val());
        if (text.length === 0) {
            return;
        }

        args = {
            text: text,
        };

        $.post('/phrases', args, function() {
            loadPhrases();
            closePopup();
        });
    });

    $('#addLanguagePopup input[type=submit]').click(function() {
        var args = {
            label: $('#addLanguagePopup input[name=label]').val(),
            code: $('#addLanguagePopup input[name=code]').val()
        };

        $.post('/languages', args, function() {
            loadLanguages();
            closePopup();
        });
    });

    $('#addLeaderPopup input[type=email]').keyup(function() {
        showLoadingBar();
        $.getJSON('/admin/userlookup', {email:$(this).val()}, function(data) {
            hideLoadingBar();
            if (data.success) {
                $('#addLeaderPopup').addClass('success');
                userIdFromLookupOnServer = data.id; // global
            } else {
                $('#addLeaderPopup').removeClass('success');
            }
        });
    });

    $('#addLeaderPopup input[type=submit]').click(function() {
        var args = {
            user: userIdFromLookupOnServer // global
        };

        var currentLanguage = window.location.pathname.split('/')[3];

        $.post('/languages/' + currentLanguage + '/leaders', args, function() {
            loadTeamLeaders(currentLanguage);
            closePopup();
        });
    });

    $('#deployButton').click(function() {
        if (confirm("Are you sure?")) {
            var button = $(this);
            showLoadingBar();
            button.attr('disabled', 'disabled');
            $.post('/snapshots', function(data) {
                alert("Done. Will now continue to init cache");
                $.post('/snapshots/init_cached_translations', function(data) {
                    alert("Done. Translations should be live now");
                    hideLoadingBar();
                    button.removeAttr('disabled');
                    $('#tabs li[rel=snapshots]').click();
                });
            });
        }
    });

    $('#teams select').change(function() {
        loadTeamLeaders($(this).val());
    });
});
