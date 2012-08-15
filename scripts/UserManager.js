var UserManager = {
    currentUser: null,
    viewingUser: null,
    tabs: null,
    $rightView: null,
    $playlists: null,
    $followings: null,
    $followers: null,
    $flattrs: null,
    $playlistsTab: null,
    $followingsTab: null,
    $followersTab: null,
    $flattrsTab: null,
    $followButton: null,
    $unFollowButton: null,
    $editButton: null,
    $img: null,
    $changePictureBox: null,
    
    init: function() {
        $.getJSON('/me', function(userJSON) {
            if (userJSON.nickname === undefined) {
                EventSystem.callEventListeners('user_logged_out');
                return;
            }
            UserManager.currentUser = new User(userJSON);
            EventSystem.addEventListener('user_profile_updated', function(params) {
                UserManager.currentUser.displayName = params.displayName;
                UserManager.currentUser.nickname = params.nickname;
                UserManager.currentUser.firstName = params.first_name;
                UserManager.currentUser.lastName = params.last_name;
                UserManager.currentUser.tagline = params.tagline;
                UserManager.loadCurrentUser();
                history.pushState(null, null, UserManager.currentUser.getUrl());
            });

            EventSystem.addEventListener('flattr_click_made', function(data) {
                UserManager.currentUser.nrOfFlattrs += 1;
            });

            EventSystem.callEventListeners('current_user_loaded', UserManager.currentUser);
        });

        UserManager.$rightView = $('#right .profile');
        UserManager.$playlists = $('#right .profile .pane.profile-playlists');
        UserManager.$followings = $('#right .profile .pane.profile-followings');
        UserManager.$followers = $('#right .profile .pane.profile-followers');
        UserManager.$flattrs = $('#right .profile .pane.profile-flattrs');
        UserManager.$playlistsTab = $('#right .profile .tabs .profile-playlists');
        UserManager.$followingsTab = $('#right .profile .tabs .profile-followings');
        UserManager.$followersTab = $('#right .profile .tabs .profile-followers');
        UserManager.$flattrsTab = $('#right .profile .tabs .profile-flattrs');
        UserManager.$followButton = $('#right .profile .follow.button');
        UserManager.$unFollowButton = $('#right .profile .unfollow.button');
        UserManager.$editButton = $('#right .profile .edit.button');
        UserManager.$img = $('#right .profile .picture-container .picture');
        UserManager.$changePictureBox = $('#right .profile .picture-container .change');

        UserManager.tabs = new Tabs(UserManager.$rightView.find('.tab-area'), {
            'profile-followers': UserManager.loadFollowers,
            'profile-followings': UserManager.loadFollowings,
            'profile-flattrs': UserManager.loadFlattrs
        });
    },

    isLoggedIn: function() {
        return UserManager.currentUser !== null;
    },

    show: function() {
        Menu.deSelect();
        UserManager.tabs.select('profile-playlists');
        history.pushState(null, null, UserManager.viewingUser.getUrl());

        $('#right > div').hide();
        UserManager.$rightView.show();
    },

    loadCurrentUser: function() {
        UserManager.resetUserProfileView();
        UserManager.populateUserProfile(UserManager.currentUser);
        UserManager.show();
    },

    loadProfile: function(nickOrId) {
        UserManager.resetUserProfileView();

        LoadingBar.show();

        $.ajax({
            type: 'GET',
            url: '/api/users/' + nickOrId,
            complete: function(jqXHR, textStatus) {
                LoadingBar.hide();
            },
            statusCode: {
                200: function(data) {
                    $('#right .profile').show();
                    UserManager.populateUserProfile(new User(data));
                },
                404: function(data, textStatus) {
                    alert('User "' + nickOrId + '" not found');
                }
            }
        });
    },

    resetUserProfileView: function() {
        UserManager.$followButton.hide();
        UserManager.$unFollowButton.hide();
        UserManager.$editButton.hide();
        UserManager.$changePictureBox.text('');
        UserManager.$changePictureBox.hide();
        UserManager.$playlists.html('');
        UserManager.$followings.html('');
        UserManager.$followers.html('');

        if (UserManager.$img) {
            UserManager.$img.remove();
        }

        $('#right .profile .information-container .flattr-user-name').text('').hide();
        $('#right .profile .information-container .display-name').text('');
        $('#right .profile .information-container .nickname').text('');
        $('#right .profile .information-container .tagline').text('');

        UserManager.tabs.select('profile-playlists');

        $('#right .profile .tabs').hide();
    },

    populateUserProfile: function(user) {
        UserManager.viewingUser = user;

        var largeImageUrl = user.largeImageUrl;

        UserManager.$img = $('<img class="picture" alt="Profile picture" />')
            .attr('src', largeImageUrl)
            .prependTo($('#right .profile .picture-container'));

        UserManager.$followButton.unbind('click').click(function() {
            $.post('/me/followings/' + user.id, function(data) {
                UserManager.$followButton.hide();
                UserManager.$unFollowButton.show();

                UserManager.currentUser.nrOfFollowings += 1;
                user.nrOfFollowers += 1;

                Utils.addFollowing(user);

                UserManager.loadFollowers();
            });
        });

        UserManager.$unFollowButton.unbind('click').click(function() {
            $.ajax({
                type: 'DELETE',
                url: '/me/followings/' + user.id,
                statusCode: {
                    200: function(data) {
                        UserManager.$followButton.show();
                        UserManager.$unFollowButton.hide();

                        UserManager.currentUser.nrOfFollowings -= 1;
                        user.nrOfFollowers -= 1;

                        Utils.removeFollowing(user.id);

                        UserManager.loadFollowers();
                    }
                }
            });
        });

        UserManager.$editButton.unbind('click').click(function() {
            new EditProfileDialog().show();
        });

        if (UserManager.isLoggedIn() && UserManager.currentUser.id === user.id) {
            user.playlists = playlistManager.playlists;
            UserManager.$editButton.show();
            UserManager.$changePictureBox.html(TranslationSystem.get('Configure your profile picture for $email at $gravatar', {$email: UserManager.currentUser.email, $gravatar: '<a href="http://www.gravatar.com" target="_blank">gravatar.com</a>'}));
            UserManager.$changePictureBox.show();
        } else if (UserManager.isLoggedIn() && Utils.isFollowingUser(user.id)) {
            UserManager.$unFollowButton.show();
        } else if (UserManager.isLoggedIn()) {
            UserManager.$followButton.show();
        }

        if (user.flattrUserName) {
            $('#right .profile .information-container .flattr-user-name')
                .text(user.flattrUserName)
                .attr('href', 'http://flattr.com/profile/' + user.flattrUserName)
                .show();
        }

        $('#right .profile .information-container .display-name').text(user.displayName);
        $('#right .profile .information-container .nickname').text(user.nickname);
        $('#right .profile .information-container .tagline').text(user.tagline);

        UserManager.updatePlaylistsTabLabel(user.nrOfPlaylists);
        UserManager.updateFollowersTabLabel(user.nrOfFollowers);
        UserManager.updateFollowingsTabLabel(user.nrOfFollowings);
        UserManager.updateFlattrsTabLabel(user.nrOfFlattrs);

        if (UserManager.isLoggedIn() && UserManager.currentUser.id === user.id) {
            $.each(playlistManager.playlists, function(index, item) {
                var playlist = new Playlist(item.title, item.videos, item.remoteId, item.owner, item.isPrivate, item.followers);
                if (playlist.videos.length) {
                    UserManager.$playlists.append(PlaylistView.createSmallPlaylistView(playlist, true));
                }
            });
        } else {
            UserManager.loadPlaylists();
        }

        $('#right .profile .tabs').show();
    },

    updateFollowersTabLabel: function(nrOfFollowers) {
        UserManager.$followersTab.text(TranslationSystem.get('Followers') + ' (' + nrOfFollowers + ')');
    },

    updateFollowingsTabLabel: function(nrOfFollowings) {
        UserManager.$followingsTab.text(TranslationSystem.get('Following') + ' (' + nrOfFollowings + ')');
    },

    updatePlaylistsTabLabel: function(nrOfPlaylists) {
        UserManager.$playlistsTab.text(TranslationSystem.get('Playlists') + ' (' + nrOfPlaylists + ')');
    },

    updateFlattrsTabLabel: function(nrOfFlattrs) {
        UserManager.$flattrsTab.text(TranslationSystem.get('Flattrs') + ' (' + nrOfFlattrs + ')');
    },

    loadPlaylists: function() {
        LoadingBar.show();
        $.getJSON('/api/users/' + UserManager.viewingUser.id + '/playlists', function(data) {
            $.each(data, function(index, item) {
                var playlist = new Playlist(item.title, item.videos, item.remoteId, item.owner, item.isPrivate, item.followers);
                if (playlist.videos.length) {
                    UserManager.$playlists.append(PlaylistView.createSmallPlaylistView(playlist));
                }
            });
            LoadingBar.hide();
        });
    },

    loadFollowers: function() {
        $.getJSON('/api/users/' + UserManager.viewingUser.id + '/followers', function(data) {
            UserManager.$followers.html('');
            UserManager.updateFollowersTabLabel(data.length);
            $.each(data, function(i, item) {
                UserManager.$followers.append(new User(item).getSmallView());
            });
        });
    },

    loadFollowings: function() {
        $.getJSON('/api/users/' + UserManager.viewingUser.id + '/followings', function(data) {
            UserManager.$followings.html('');
            UserManager.updateFollowingsTabLabel(data.length);
            $.each(data, function(i, item) {
                UserManager.$followings.append(new User(item).getSmallView());
            });
        });
    },

    loadFlattrs: function() {
        $.getJSON('/api/users/' + UserManager.viewingUser.id + '/activities?verbs=flattr&type=outgoing', function(data) {
            UserManager.$flattrs.html('');
            UserManager.updateFlattrsTabLabel(data.length);
            $.each(data, function(i, activity) {
                var thing = JSON.parse(activity.target);
                UserManager.$flattrs.append(NewsFeed.getIncomingFlattrActivity(UserManager.viewingUser, thing));
            });
        });
    },

    findUser: function(nickOrId, callback) {
        $.getJSON('/api/users/' + nickOrId, function(data) {
             callback(data);
        });
    }
};
