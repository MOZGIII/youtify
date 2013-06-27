import logging
import webapp2
from google.appengine.ext.webapp import util
from google.appengine.ext import db
from google.appengine.runtime import DeadlineExceededError
import json as simplejson
from urllib import unquote
from model import YoutifyUser
from model import get_current_youtify_user_model
from dropbox.oauth import OAuthToken
try:
    import config
except ImportError:
    import config_template as config

import dropbox

class DropboxConnectHandler(webapp2.RequestHandler):
    
    def get(self):
        """Callback for connecting to a dropbox account"""
        sess = dropbox.session.DropboxSession(config.DROPBOX_APP_KEY, config.DROPBOX_APP_SECRET, config.DROPBOX_ACCESS_TYPE)
        request_token = sess.obtain_request_token()
        url = sess.build_authorize_url(request_token, config.DROPBOX_CALLBACK_URL)
        
        user = get_current_youtify_user_model()
        if user:
            user.dropbox_access_token = request_token.to_string()
            user.save()
            self.redirect(url)
        else:
            self.error(403)
            self.response.out.write('User not logged in')    

class DropboxDisconnectHandler(webapp2.RequestHandler):

    def get(self):
        """Delete a dropbox connection"""
        user = get_current_youtify_user_model()
        if user:
            user.dropbox_access_token = None
            user.dropbox_user_name = None
            user.save()
        else:
            self.error(403)
            self.response.out.write('User not logged in')
            return

        self.redirect('/')

class DropboxCallbackHandler(webapp2.RequestHandler):
    
    def get(self):
        # Maybe the user pressed cancel
        if self.request.path.lower().find('not_approved=true') > 0:
            self.redirect('/')
            return
        
        session = dropbox.session.DropboxSession(config.DROPBOX_APP_KEY, config.DROPBOX_APP_SECRET, config.DROPBOX_ACCESS_TYPE)
        user = get_current_youtify_user_model()
        if user:
            # get access token
            request_token = OAuthToken.from_string(user.dropbox_access_token)
            session.request_token = request_token
            access_token = session.obtain_access_token(request_token)
            user.dropbox_access_token = access_token.to_string()

            # get user name
            session.token = access_token
            client = dropbox.client.DropboxClient(session)
            info = client.account_info()
            user.dropbox_user_name = info['display_name']
            user.save()
            self.redirect('/')
        else:
            self.error(403)
            self.response.out.write('User not logged in')

class DropboxListingHandler(webapp2.RequestHandler):
    
    def get(self, path):
        """List content in path"""
        filetypes = ['.mp3', '.mp4', '.ogg', '.wav']
        user = get_current_youtify_user_model()
        if user is None:
            self.error(403)
            self.response.out.write('User not logged in')
            return
        access_token = OAuthToken.from_string(user.dropbox_access_token)
        session = dropbox.session.DropboxSession(config.DROPBOX_APP_KEY, config.DROPBOX_APP_SECRET, config.DROPBOX_ACCESS_TYPE)
        session.token = access_token
        client = dropbox.client.DropboxClient(session)
        
        path = '/' + path
        dirs = []
        mediafiles = []
        
        try:
            metadata = client.metadata(path)
            if 'contents' in metadata:
                for item in metadata['contents']:
                    if item['is_dir']:
                        dirs.append(item['path'])
                    else:
                        for filetype in filetypes:
                            if item['path'].lower().endswith(filetype):
                                # all currently supported filetypes are 4 chars long
                                title = ' - '.join(item['path'].split('/'))[3:-4]
                                track = { 'videoId': item['path'], 'title': title, 'type': 'dropbox' }
                                mediafiles.append(track)
                                break
        except DeadlineExceededError:
            pass
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps({'dirs': dirs, 'media': mediafiles}))

class DropboxStreamHandler(webapp2.RequestHandler):
    
    def get(self):
        """Get the dropbox stream path, which is valid for 4 hours"""
        path = self.request.path
        path_separator = '/api/dropbox/stream/'
        path = path[path.find(path_separator) + len(path_separator):]
        filetypes = ['.mp3', '.mp4', '.ogg', '.wav']
        user = get_current_youtify_user_model()
        if user is None:
            self.error(403)
            self.response.out.write('User not logged in')
            return
        if user.dropbox_access_token is None:
            self.error(401)
            self.response.out.write('User has not connected to dropbox.')
            return
        access_token = OAuthToken.from_string(user.dropbox_access_token)
        session = dropbox.session.DropboxSession(config.DROPBOX_APP_KEY, config.DROPBOX_APP_SECRET, config.DROPBOX_ACCESS_TYPE)
        session.token = access_token
        client = dropbox.client.DropboxClient(session)
        stream = client.media(unquote(path))
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(stream))

app = webapp2.WSGIApplication([
        ('/api/dropbox/connect', DropboxConnectHandler),
        ('/api/dropbox/disconnect', DropboxDisconnectHandler),
        ('/api/dropbox/callback', DropboxCallbackHandler),
        ('/api/dropbox/list/(.*)', DropboxListingHandler),
        ('/api/dropbox/stream/.*', DropboxStreamHandler),
    ], debug=True)
