function PlaylistsManager() {
    this.playlists = [];

    this.load = function() {
        var self = this,
            data,
            item,
            i;

        try {
            data = JSON.parse(localStorage.playlists || '[]');
            for (i = 0; i < data.length; i += 1) {
                item = data[i];
                if (item && !item.remoteId) {
                    this.playlists.push(new Playlist(item.title, item.videos, item.remoteId, item.owner, item.isPrivate));
                }
            }
        } catch (e) {
            alert('Error parsing playlists from localStorage: ' + e); 
        }

        $.getJSON('/me/playlists', function(data) {
            self.mergePlaylists(data);
            self.updateMenu();
            EventSystem.callEventListeners('playlists_loaded', self.playlists);
        });
    };

    this.updateMenu = function() {
        var group = Menu.getGroup('playlists');
        group.clear();
        $.each(this.playlists, function(i, playlist) {
            Menu.getGroup('playlists').addMenuItem(playlist.getMenuItem());
        });
    };

    this.removeRemotePlaylistsFromLocalStorage = function() {
        var localPlaylists = [];

        $.each(this.playlists, function(i, playlist) {
            if (!playlist.remoteId) {
                localPlaylists.push(playlist);
            }
        });

        this.playlists = localPlaylists;
        this.saveToLocalStorage();
    };

    this.getCurrentlySelectedPlaylist = function() {
        return $('#left .playlists .selected').data('model');
    };

    this.getPlaylistsMap = function() {
        var ret = {};
        $.each(this.playlists, function(i, item) {
            if (item.remoteId !== null) {
                ret[item.remoteId] = item;
            }
        });
        return ret;
    };

    /**
     * Merge the passed in playlists and saves the end result to localStorage.
     *
     * @param playlists The playlists to merge.
     */
    this.mergePlaylists = function(playlists) {
        var self = this,
            remoteIds = this.getPlaylistsMap();

        $.each(playlists, function(i, item) {
            var title = item.title,
                videos = item.videos,
                remoteId = item.remoteId,
                owner = item.owner,
                isPrivate = item.isPrivate || false,
                followers = item.followers || [];

            if (!remoteIds.hasOwnProperty(remoteId)) {
                self.addPlaylist(new Playlist(title, videos, remoteId, owner, isPrivate ,followers));
            }
        });

        self.saveToLocalStorage();
    };

    this.save = function() {
        this.saveToLocalStorage();
        if (UserManager.isLoggedIn() && this.playlists.length) {
            this.syncPlaylists(0);
        }
    };

    /**
     * Will save the current state when as soon as no other process tries to
     */
    this.saveToLocalStorage = function() {
        var startTime = new Date().getTime(),
            currentTime,
            timeDelta;

        while (this.locked) {
            currentTime = new Date().getTime();
            timeDelta = currentTime - startTime;
            if (timeDelta > 10000) {
                alert('Error: save function timed out.');
                return;
            }
        }
        this.locked = true;

        try {
            localStorage.playlists = JSON.stringify(this.playlists);
        } catch(e) {
            alert('Error saving playlists: ' + e);
        }
        this.locked = false;
    };

    /**
     * Sync playlists sequentially with server.
     *
     * Will save back to localStorage when done (remoteIds may have been set).
     */
    this.syncPlaylists = function(i) {
        if (i >= this.playlists.length) {
            this.saveToLocalStorage();
            return;
        }

        var playlist = this.playlists[i],
            self = this;

        if (playlist.remoteId) {
            playlist.sync(function() {
                self.syncPlaylists(i + 1);
            });
        } else {
            self.syncPlaylists(i + 1);
        }
    };

    this.addPlaylist = function(playlist) {
        if (typeof playlist !== 'object') {
            throw "playlist param must be object";
        }
        this.playlists.push(playlist);
        Menu.getGroup('playlists').addMenuItem(playlist.getMenuItem());
    };

    this.getPlaylist = function(index) {
        if ((index > this.playlists.length - 1) || (index < 0)) {
            throw "No playlist at index " + index;
        }
        return this.playlists[index];
    };

    this.setPlaylist = function(index, playlist) {
        if (typeof playlist !== 'object') {
            throw "playlist param must be object";
        }
        if ((index > this.playlists.length - 1) || (index < 0)) {
            throw "No playlist at index " + index;
        }
        this.playlists[index] = playlist;
    };

    this.movePlaylist = function(sourceIndex, destIndex) {
        if (destIndex > sourceIndex) {
            destIndex -= 1;
        }
        var tmp = this.playlists.splice(sourceIndex, 1)[0];
        this.playlists.splice(destIndex, 0, tmp);
    };

    this.deletePlaylist = function(playlistOrIndex) {
        var index;
        var playlist;

        if (playlistOrIndex instanceof Playlist) {
            playlist = playlistOrIndex;
            index = this.getIndexOfPlaylist(playlistOrIndex);
            if (index === undefined) {
                console.log("Could not find index for playlist " + playlistOrIndex.title);
                return;
            }
        } else {
            index = playlistOrIndex;
            playlist = this.playlists[index];
        }

        if (UserManager.isLoggedIn() && playlist.remoteId) {
            playlist.unsync();
        }

        this.playlists.splice(index, 1);

        Menu.deSelect();
        Menu.getGroup('playlists').removeMenuItem(playlist.getMenuItem());
    };

    this.getIndexOfPlaylist = function(playlist) {
        var i;
        var playlist2;
        for (i = 0; i < this.playlists.length; i += 1) {
            playlist2 = this.playlists[i];
            if (playlist2.remoteId === playlist.remoteId) {
                return i;
            }
        }
    };

    this.selectPlaylistByRemoteId = function(remoteId) {
        var map = this.getPlaylistsMap();
        if (map.hasOwnProperty(remoteId)) {
            map[remoteId].getMenuItem().select();
        }
    };

    this.getDropdownOfAllPlaylists = function() {
        var $select = $('<select></select>');
        var playlist;
        var i;

        for (i = 0; i < this.playlists.length; i += 1) {
            playlist = this.playlists[i];
            if (playlist.remoteId === null || playlist.owner.id === UserManager.currentUser.id) {
                $('<option></option>').val(i).text(playlist.title).appendTo($select);
            }
        }

        return $select;
    };

    this.load();
}

