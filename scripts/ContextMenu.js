$(window).keyup(function (event) {
    if (event.keyCode === 27 && $('#contextmenu').length) {
        $('#context-menu-blocker, #contextmenu').remove();
    }
});

function showContextMenu(buttons, x, y) {
    var contextmenu = $('<ul id="contextmenu" />');

    $.each(buttons, function(i, item) {
        var $li = $('<li class="option" />')
            .text(item.title)
            .data('args', item.args)
            .data('callback', item.callback)
            .click(function() {
                $(this).data('callback')($(this).data('args'));
                $('#context-menu-blocker, #contextmenu').remove();
            });
        if (item.cssClass) {
            $li.addClass(item.cssClass);
        }
        $li.appendTo(contextmenu);
    });

    // Set up a blocker div that closes the menu when clicked
    var blocker = $('<div id="context-menu-blocker" class="blocker"></div>').mousedown(function(event) {
        $('#context-menu-blocker, #contextmenu').remove();
        event.stopPropagation();
    });

    blocker.appendTo('body');
    contextmenu.appendTo('body');

	// Make sure contextmenu does not reach outside the window
	if ((y + contextmenu.height()) > $(window).height()) {
		y -= contextmenu.height();
	}
    if ((x + contextmenu.width()) > $(window).width()) {
        x -= contextmenu.width();
    }
    contextmenu.css({
        'top': y,
        'left': x
    });

    // Finally, prevent contextmenu on our contextmenu :)
    $('#context-menu-blocker, #contextmenu, #contextmenu li.option').bind('contextmenu', function (event) {
        event.preventDefault();
    });
}

function showPlaylistContextMenu(event) {
    $('#left .selected').removeClass('selected');
    $(this).addClass('selected');
    event.preventDefault();

    var buttons = [];
    buttons.push({
        title: TranslationSystem.get('Rename'),
        cssClass: 'rename',
        args: $(this),
        callback: function(li) {
            var playlist = null,
                input = $('<input type="text"/>')
                .addClass('rename')
                .val(li.text())
                .data('li', li)
                .blur(function(event) {
                    li.find('.title').show();
                    input.remove();
                })
                .keyup(function(event) {
                    var playlist;
                    switch (event.keyCode) {
                        case 13: // RETURN
                            playlist = li.data('model');
                            playlist.rename(input.val());
                            playlistManager.save();
                            $(this).blur();
                            break;
                        case 27: // ESC
                            $(this).blur();
                            break;
                    }
                    event.stopPropagation();
                });

            li.find('.title').hide();
            li.append(input);
            input.focus().select();
        }
    });
    if (logged_in && $(this).data('model').remoteId) {
        buttons.push({
            title: TranslationSystem.get('Share'),
            cssClass: 'share',
            args: $(this),
            callback: function(li) {
                new ShareTrackDialog(li.data('model')).show();
            }
        });
    }
    buttons.push({
        title: TranslationSystem.get('Import from Spotify'),
        cssClass: 'import',
        args: $(this),
        callback: function(li) {
            li.arrowPopup('#spotify-importer', 'left');
        }
    });
    buttons.push({
        title: TranslationSystem.get('Remove duplicate videos'),
        cssClass: 'remove-duplicates',
        args: $(this),
        callback: function(li) {
            var index = li.index(),
                playlist = playlistManager.getPlaylist(index);
            if (confirm(TranslationSystem.get('This will delete duplicate videos from your playlist. Continue?'))) {
                Notifications.append(playlist.removeDuplicates() + TranslationSystem.get(' duplicates removed.'));
            }
        }
    });
    
    if (logged_in && !$(this).data('model').remoteId) {
        buttons.push({
            title: TranslationSystem.get('Sync'),
            cssClass: 'sync',
            args: $(this),
            callback: function(li) {
                li.data('model').sync(function() {
                    playlistManager.save();
                    li.addClass('remote');
                });
            }
        });
    }

    if (logged_in && $(this).data('model').remoteId) {
        buttons.push({
            title: TranslationSystem.get('Unsync'),
            cssClass: 'unsync',
            args: $(this),
            callback: function(li) {
                li.data('model').unsync();
                playlistManager.save();
                li.removeClass('remote');
            }
        });
    }

    if (ON_DEV) {
        buttons.push({
            title: 'View JSON',
            cssClass: 'json',
            args: $(this),
            callback: function(li) {
                var playlist = li.data('model');
                alert(JSON.stringify(playlist.toJSON()));
                console.log(playlist.toJSON());
            }
        });
    }
    
    buttons.push({
        title: TranslationSystem.get('Delete/Unsubscribe'),
        cssClass: 'delete',
        args: $(this),
        callback: function(li) {
            var index = li.index(),
                playlist = playlistManager.getPlaylist(index);

            if (confirm("Are you sure you want to delete this playlist (" + playlist.title + ")?")) {
                playlistManager.deletePlaylist(index);
                playlistManager.save();
            }
        }
    });

    showContextMenu(buttons, event.pageX, event.pageY);
}

function showResultsItemContextMenu(event, videoElem) {
    var li = videoElem || $(this);
    var allSelectedVideos = $(this).parent().find('.video.selected');
    var video = li.data('model');

    if (!$(li).hasClass('selected')) {
        li.parent().find('.selected').removeClass('selected');
        li.addClass('selected');
    }

    var buttons = [
        {
            title: TranslationSystem.get('Play'),
            cssClass: 'play',
            args: li,
            callback: function(elem) {
                elem.data('model').play();
            }
        },
		{
            title: TranslationSystem.get('Queue'),
            cssClass: 'queue',
            args: allSelectedVideos,
            callback: function(allSelectedVideos) {
                $.each(allSelectedVideos, function(index, li) {
                    var model = $(li).data('model');
                    if (model) {
                        Queue.addManual(model);
                    }
                });
            }
        },
		{
			title: TranslationSystem.get('Share'),
            cssClass: 'share',
			args: li,
			callback: function(elem) {
                var video = $(elem).data('model');
                new ShareTrackDialog(video).show();
			}
		}
    ];

    switch (video.type) {
        case 'youtube':
        buttons.push({
            title: TranslationSystem.get('View on YouTube'),
            cssClass: 'view',
            args: li,
            callback: function(elem) {
                window.open('http://www.youtube.com/watch?v=' + video.videoId);
            }
        });
        break;

        case 'soundcloud':
        buttons.push({
            title: TranslationSystem.get('View on SoundCloud'),
            cssClass: 'view',
            args: li,
            callback: function(elem) {
                var url = "http://api.soundcloud.com/tracks/" + video.videoId + ".json";
                var params = {
                    client_id: SOUNDCLOUD_API_KEY
                };
                $.getJSON(url, params, function(data) {
                    window.open(data.permalink_url);
                });
            }
        });
        break;

        case 'officialfm':
        buttons.push({
            title: TranslationSystem.get('View on Official.fm'),
            cssClass: 'view',
            args: li,
            callback: function(elem) {
                window.open('http://www.official.fm/tracks/' + video.videoId);
            }
        });
        break;
    }

    if (ON_DEV) {
        buttons.push({
            title: 'View JSON',
            cssClass: 'json',
            args: li,
            callback: function(li) {
                alert(JSON.stringify(video.toJSON()));
                console.log(video.toJSON());
            }
        });
    }

    if (li.data('additionalMenuButtons')) {
        buttons = $.merge(buttons, li.data('additionalMenuButtons'));
    }

    showContextMenu(buttons, (event.pageX || li.offset().left + li.width()) , (event.pageY || li.offset().top));

    return false;
}
