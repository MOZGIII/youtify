function SoundCloudPlayer() {
    this.prototype = new AbstractPlayer();
    var self = this;
    self.initialized = false;
    self.type = 'soundcloud';
    self.video = null;
    self.view = null;
	self.volume = 100;
	self.playedSuccessfully = false;
    self.defaultWidth = $('#left .players').width();
    self.defaultHeight = $('#left .players').height();
	
    /* Init the player */
    self.init = function(callback) {
        var ready = function() {
            self.view = $('#soundcloud');
            EventSystem.addEventListener('video_info_fetched', function(info) {
                if (self.video !== null) {
					var url = null;
                    if (info.thumbnail) {
                        url = info.thumbnail
							.replace('default.', 't500x500.')
							.replace('large.', 't500x500.');
                    } else if (info.author && info.author.avatar_url) {
                        url = info.author.avatar_url;
						if (url.indexOf('default_avatar_large') < 0) {
							url = url.replace('large.', 't500x500.');
						}
                    }
					if (url) {
						self.view.css('backgroundImage', 'url(' + url + ')');
					} else {
						self.view.css('backgroundImage', 'none');
					}
                }
            });
			self.initialized = true;
            if (callback) {
				callback(self);
			}
        };
        
        if (soundManager.ok()) {
            ready();
        } else {
            soundManager.onready(ready);
        }
    };
        
    /* Hide the player from the UI. Must be callable without prior init */
    self.hide = function() {
        $('#soundcloud').hide();
    };

    /* Show the player. Must be callable without prior init */
    self.show = function() {
        $('#soundcloud').show();
    };
    
    /* Start (or if video is null resume) playback of a video */
    self.play = function(video) {
		if (video) {
            self.view.css('backgroundImage', 'none');
			self.video = video;
			soundManager.stopAll();
			self.playedSuccessfully = false;
			soundManager.createSound({
				id: video.videoId,
				url: 'https://api.soundcloud.com/tracks/' + video.videoId + '/stream?consumer_key=' + SOUNDCLOUD_API_KEY,
				volume: self.volume,
				onplay: function() {
					if (!self.playedSuccessfully) {
						EventSystem.callEventListeners('video_started_playing_successfully', self.video);
						self.playedSuccessfully = true;
					}
				},
				onresume: function() {
					EventSystem.callEventListeners('backend_played_video', self.video);
				},
				onpause: function() {
					EventSystem.callEventListeners('backend_paused_video', self.video);
				},
				onfinish: function() {
					soundManager.destroySound(video.videoId);
					EventSystem.callEventListeners('video_played_to_end', self);
				},
                onload: function(success) {
					if (success) {
						EventSystem.callEventListeners('video_duration_updated', self.getTotalPlaybackTime());
					} else {
						EventSystem.callEventListeners('video_failed_to_play', self.video);
					}
                },
                whileloading: function() {
                    EventSystem.callEventListeners('video_duration_updated', self.getTotalPlaybackTime());
                }
			});
			soundManager.play(self.video.videoId);
		} else {
			soundManager.play(self.video.videoId);
		}
    };
    
    /* Stops the current video */
    self.stop = function() {
        self.video = null;
        soundManager.stopAll();
    };
    
    /* Pauses the current video */
    self.pause = function() {
        soundManager.pause(self.video.videoId);
    };
    
    /* Enter fullScreen (must respect self.show() & self.hide()) */
    self.fullScreenOn = function() {
        var width = $(window).width(),
            height = $(window).height() - 10;
        
        if (self.view === null) {
            return;
        }

		/* Must set style, not class */
		$('#left .players').css('top',0);
		self.view.width(width);
		self.view.height(height);
    };
    
    /* Exit fullScreen (must respect self.show() & self.hide()) */
    self.fullScreenOff = function() {
        if (self.view === null) {
            return;
        }
        
		/* Must set style, not class */
		$('#left .players').removeAttr('style');
		self.view.width(self.defaultWidth);
		self.view.height(self.defaultHeight);
        self.inFullScreen = false;
    };
    
    /* Set volume (0-100) */
    self.setVolume = function(volume) {
		self.volume = volume;
		if (self.video) {
			soundManager.setVolume(self.video.videoId, volume);
		}
    };
    
    /* Get volume (0-100) */
    self.getVolume = function() {
        return self.volume;
    };
    
    /* Seek to time (seconds) in video */
    self.seekTo = function(time) {
        soundManager.setPosition(self.video.videoId, time * 1000);
    };
    
    /* Returns the current playback position in seconds */
    self.getCurrentPlaybackTime = function() {
		if (!self.video) {
			return 0;
		}
		var sound = soundManager.getSoundById(self.video.videoId);
		if (sound) {
			return sound.position / 1000.0;
		}
        return 0;
    };
    
    /* Returns the length of the video in seconds */
    self.getTotalPlaybackTime = function() {
        if (self.video && self.video.duration) {
            return self.video.duration / 1000.0;
		}
        if (self.video) {
            var sound = soundManager.getSoundById(self.video.videoId);
            if (sound) {
                return sound.durationEstimate / 1000.0;
            }
        }
        return 0;
    };
    
    /* Returns the buffer in percent 0-100 */
    self.getBuffer = function() {
        var buffer = 0;
        if (self.video) {
            var sound = soundManager.getSoundById(self.video.videoId);
            if (sound) {
                buffer = sound.bytesLoaded / sound.bytesTotal * 100;
                buffer = buffer > 100 ? 100 : buffer;
                buffer = buffer < 0 ? 0 : buffer;
            }
        }
        return buffer;
    };
}
