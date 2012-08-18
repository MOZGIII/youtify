var EchoNest = {
    init: function() {
        EventSystem.addEventListener('video_started_playing_successfully', function(data) {
            EchoNest.fingerprint(data);

            EchoNest.extractArtist(data);
        });
    },

    extractArtist: function(track) {
        var options = {
            api_key: ECHONEST_API_KEY,
            format: 'json',
            text: track.title,
            sort: 'familiarity-desc',
            min_familiarity: '0.3',
            results: 15
        };
        
        $.getJSON('http://developer.echonest.com/api/v4/artist/extract', options, function(data) {
            if (data.response.artists.length === 1) {
                track.echonestArtist = data.response.artists[0].name;
                console.log('Echo Nest identified artist as \'' + track.echonestArtist + '\'');
            }
        });
    },

    fingerprint: function(track) {
        if (track.type === 'soundcloud') {
            var options = {
                api_key: ECHONEST_API_KEY,
                format: 'json',
                url: 'https://api.soundcloud.com/tracks/' + track.videoId + '/stream?consumer_key=' + SOUNDCLOUD_API_KEY
            };
            
            $.post('http://developer.echonest.com/api/v4/track/upload', options, function(data) {
                var response = data.response;
                
                if (response.status.message === 'Success') {
                    if (response.track.status === 'complete') {
                        track.echonestInformation = response.track;

                        if (response.track.title) {
                            track.track = response.track.title;
                            track.artist = response.track.artist;

                            console.log('Echo Nest identified as \'' + track.track + '\' by \'' + track.artist + '\'');
                        } else {
                            console.log('Echo Nest could not identify \'' + track.title + '\'');
                        }
                    } else {
                        console.log('Echo Nest failed on \'' + track.title + '\'');
                    }
                } else {
                    console.log('Something failed when connecting to the Echo Nest');
                }
            });
        } else {
            console.log("Cannot fingerprint non-soundcloud tracks yet");
        }
    }
};
