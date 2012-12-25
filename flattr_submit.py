# -*- coding: utf-8 -*-

import os
import urllib
import webapp2
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
from google.appengine.api import users
from google.appengine.api import urlfetch
import json as simplejson
from model import get_current_youtify_user
from model import create_youtify_user
from model import SubmittedVideo

class Handler(webapp2.RequestHandler):
    def get(self):
        current_user = users.get_current_user()
        user = get_current_youtify_user()
        if (current_user is not None) and (user is None):
            user = create_youtify_user()

        logout_url = ''
        login_url = ''
        my_user_email = ''
        my_flattr_username = ''
        my_youtube_username = ''
        if (user is not None):
            my_user_email = user.google_user2.email()
            logout_url = users.create_logout_url('/flattr_submit')
            if user.flattr_user_name:
                my_flattr_username = user.flattr_user_name
            if user.youtube_username:
                my_youtube_username = user.youtube_username
        else:
            login_url = users.create_login_url('/flattr_submit')

        path = os.path.join(os.path.dirname(__file__), 'html', 'flattr_submit.html')
        self.response.headers['Content-Type'] = 'text/html; charset=utf-8'
        self.response.out.write(template.render(path, {
            'my_user_email': my_user_email,
            'my_flattr_username': my_flattr_username,
            'my_youtube_username': my_youtube_username,
            'logout_url': logout_url,
            'nr_of_submitted_vides':  SubmittedVideo.all().count(),
            'flattr_connect_url': '/flattrconnect?redirect_uri=%s' % urllib.quote(self.request.url),
            'flattr_disconnect_url': '/flattrdisconnect?redirect_uri=' + urllib.quote(self.request.url),
            'login_url': login_url,
        }))

    def post(self):
        video_id = self.request.get('video_id')
        title = self.request.get('title')
        description = self.request.get('description')

        url = 'https://api.flattr.com/rest/v2/things/'
        user = get_current_youtify_user()

        headers = {
            'Authorization': 'Bearer %s' % user.flattr_access_token,
            'Content-Type': 'application/json',
        }

        data = simplejson.dumps({
            'url': 'http://www.youtube.com/watch?v=' + video_id,
            'title': title,
            'description': description,
            'tags': 'music',
            'category': 'audio',
        })

        response = urlfetch.fetch(url=url, payload=data, method=urlfetch.POST, headers=headers)

        if response.status_code == 201:
            json = simplejson.loads(response.content)
            log_entry = SubmittedVideo(
                youtify_user=user,
                flattr_user_name=user.flattr_user_name,
                title=title,
                thing_id=str(json['id']),
                video_id=video_id
            )
            log_entry.put()

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(response.content)

app = webapp2.WSGIApplication([
        ('/flattr_submit', Handler),
    ], debug=True)
