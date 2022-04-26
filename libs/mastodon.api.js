var $Mastodon = (function() {

  // request helper
  var _request = function(method, url, params, headers, data, callback) {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
      if (req.readyState == 4) {
        if (req.status == 200) {
          var data = JSON.parse(req.response);
          console.log(url + ' => ', data);
          callback(null, data);
        } else {
          console.error(url + ' => ', req.response);
          callback(req.response, null);
        }
      }
    }
    if (params != null) {
      var parameters = '?';
      for (var p in params) {
        parameters += p + '=' + encodeURIComponent(params[p]) + '&';
      }
      url += parameters;
    }
    req.open(method, url, true);
    if (headers != null) {
      for (var h in headers) {
        req.setRequestHeader(h, headers[h]);
      }
    }
    req.send(JSON.stringify(data));
  }

  return {

    // get weekly activity
    getActivity: function(base_url, callback) {
      _request('GET', base_url + '/api/v1/instance/activity', {}, {}, null, callback);
    },

    // open authorise window for a given instance
    authoriseUser: function(base_url, client_id) {
      var url = base_url + '/oauth/authorize?' +
        'response_type=code&' +
        'client_id=' + client_id + '&' +
        'redirect_uri=urn:ietf:wg:oauth:2.0:oob&' +
        'scope=read write follow push';
      window.open(url);
    },

    // get a token for a given instance + client
    obtainToken: function(base_url, authorization_code, client_id, client_secret, callback) {
      _request('POST', base_url + '/oauth/token', {
        grant_type: 'authorization_code',
        code: authorization_code,
        client_id: client_id,
        client_secret: client_secret,
        redirect_uri: 'urn:ietf:wg:oauth:2.0:oob'
      }, {}, null, callback);
    },

    // get the public timeline for a given instance
    getPublicTimeline: function(base_url, user_token, feed_type, callback) {
      var feed = feed_type == 'global' ? 'public' : feed_type;
      _request('GET', base_url + '/api/v1/timelines/' + feed, {
        local: feed_type == 'global' ? false : true,
        limit: 50
      }, {
        Authorization: 'Bearer ' + user_token
      }, null, callback);
    },

    // gets MORE of the public timeline for a given instance using last toot we have
    getMorePublicTimeline: function(base_url, user_token, feed_type, last_toot, callback) {
      _request('GET', base_url + '/api/v1/timelines/' + feed_type, {
        local: true,
        max_id: last_toot,
        limit: 50
      }, {
        Authorization: 'Bearer ' + user_token
      }, null, callback);
    },

    // load timeline of a given account
    getProfileTimeline: function(base_url, profile_id, user_token, callback) {
      _request('GET', base_url + '/api/v1/accounts/' + profile_id + '/statuses', {
        limit: 50
      }, {
        Authorization: 'Bearer ' + user_token
      }, null, callback);
    },

    // load more timeline of a given account
    getMoreProfileTimeline: function(base_url, profile_id, user_token, last_toot, callback) {
      _request('GET', base_url + '/api/v1/accounts/' + profile_id + '/statuses', {
        max_id: last_toot,
        limit: 50
      }, {
        Authorization: 'Bearer ' + user_token
      }, null, callback);
    },

    // follow a profile
    followProfile: function(base_url, profile_id, user_token, callback) {
      _request('POST', base_url + '/api/v1/accounts/' + profile_id + '/follow', null, {
        Authorization: 'Bearer ' + user_token
      }, null, callback);
    },

    // unfollow a profile
    unfollowProfile: function(base_url, profile_id, user_token, callback) {
      _request('POST', base_url + '/api/v1/accounts/' + profile_id + '/unfollow', null, {
        Authorization: 'Bearer ' + user_token
      }, null, callback);
    },

    // create a new application for the user to access with
    createApp: function(base_url, callback) {
      _request('POST', base_url + '/api/v1/apps', {
        client_name: "tootdeck",
        redirect_uris: "urn:ietf:wg:oauth:2.0:oob",
        scopes: "read write follow push",
        website: "https://tootdeck.app"
      }, {}, null, callback);
    },

    // send a toot, text atm
    sendToot: function(base_url, status, user_token, callback) {
      _request('POST', base_url + '/api/v1/statuses', {
        status: status
      }, {
        Authorization: 'Bearer ' + user_token
      }, null, callback);
    },

    // reply to a toot
    replyToot: function(base_url, status, toot_id, user_token, callback) {
      _request('POST', base_url + '/api/v1/statuses', {
        status: status,
        in_reply_to_id: toot_id
      }, {
        Authorization: 'Bearer ' + user_token
      }, null, callback);
    },

    // load the data for a specific toot
    loadToot: function(base_url, toot_id, user_token, callback) {
      _request('GET', base_url + '/api/v1/statuses/' + toot_id, {}, {
        Authorization: 'Bearer ' + user_token
      }, null, callback);
    },

    // load the replies for a specific toot
    loadContext: function(base_url, toot_id, user_token, callback) {
      _request('GET', base_url + '/api/v1/statuses/' + toot_id + '/context', {}, {
        Authorization: 'Bearer ' + user_token
      }, null, callback);
    },

    // verify app token
    verifyToken: function(base_url, token, callback) {
      _request('GET', base_url + '/api/v1/accounts/verify_credentials', null, {
        Authorization: 'Bearer ' + token
      }, null, callback);
    },

    // favourite a toot
    favouriteToot: function(toot_id, base_url, user_token, callback) {
      _request('POST', base_url + '/api/v1/statuses/' + toot_id + '/favourite', null, {
        Authorization: 'Bearer ' + user_token
      }, null, callback);
    },

    // load a profile
    loadProfile: function(base_url, account_id, user_token, callback) {
      _request('GET', base_url + '/api/v1/accounts/' + account_id, null, {
        Authorization: 'Bearer ' + user_token
      }, null, callback);
    },

    // favourite a toot
    unfavouriteToot: function(toot_id, base_url, user_token, callback) {
      _request('POST', base_url + '/api/v1/statuses/' + toot_id + '/unfavourite', null, {
        Authorization: 'Bearer ' + user_token
      }, null, callback);
    },

    // boost a toot
    boostToot: function(toot_id, base_url, user_token, callback) {
      _request('POST', base_url + '/api/v1/statuses/' + toot_id + '/reblog', null, {
        Authorization: 'Bearer ' + user_token
      }, null, callback);
    },

    // unboost a toot
    unboostToot: function(toot_id, base_url, user_token, callback) {
      _request('POST', base_url + '/api/v1/statuses/' + toot_id + '/unreblog', null, {
        Authorization: 'Bearer ' + user_token
      }, null, callback);
    },

    // check relationship between us and a user
    getRelationship: function(base_url, user_id, user_token, callback) {
      _request('GET', base_url + '/api/v1/accounts/relationships', {
        id: user_id
      }, {
        Authorization: 'Bearer ' + user_token
      }, null, callback);
    },

    // get trends
    getTrending: function(base_url, user_token, callback) {
      _request('GET', base_url + '/api/v1/trends', {}, {
        Authorization: 'Bearer ' + user_token
      }, null, callback);
    },

    // get notifications
    getNotifications: function(base_url, user_token, callback) {
      _request('GET', base_url + '/api/v1/notifications', {}, {
        Authorization: 'Bearer ' + user_token
      }, null, callback);
    },

    // get announcements
    getAnnouncements: function(base_url, user_token, callback) {
      _request('GET', base_url + '/api/v1/announcements', {}, {
        Authorization: 'Bearer ' + user_token
      }, null, callback);
    },

    // get instance info
    getInstanceInfo: function(base_url, callback) {
      _request('GET', base_url + '/api/v1/instance', {}, {}, null, callback);
    }

  }
}());