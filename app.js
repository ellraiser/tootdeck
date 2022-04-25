
var $Router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes: [
    { path: '/', component: { template: '#home-page' }, props: true },
    { path: '/about', component: { template: '#about-page' }, props: true },
    { path: '/:instance/feed', component: { template: '#feed-page' }, props: true },
    { path: '/:instance/toot/:toot_id', component: { template: '#toot-page' }, props: true },
    { path: '/:instance/profile/:profile_id', component: { template: '#profile-page' }, props: true },
    { path: '/:instance/search/:query', component: { template: '#search-page' }, props: true },
  ],
});


var $Components = {
  card: {
    props: ['toot', 'comment', 'selected', 'retoot', 'instance'],
    template: '#td-card'
  },
  profile: {
    props: ['profile', 'instance'],
    template: '#td-profile'
  }
}

var $App = Vue.createApp({
  data: function() {
    return {
      state: '',
      message: 'TOOTDECK',
      community: '',
      app: {},
      url: '',
      instance: 'mastodon.art',
      apps: {},
      code: '',
      me: {},
      trends: [],
      toots: [],
      toot: null,
      profile: '',
      profile_toots: [],
      comment: '',
      reply_to: '',
      reply_from: null,
      status: '',
      notifications: [],
      feed_type: 'home',
      loading: {
        feed: false,
      },
      popup: {
        authorize: false,
        toot: false,
        media: false
      },
      errors: {
        not_public: false,
      },
      preview_media: ''
    }
  },
  computed: {

    unAuthenticatedApps: function() {
      var unauthenticated = {};
      for (var key in this.apps) {
        if (this.apps[key].user_token == null) {
          unauthenticated[key] = this.apps[key];
        }
      }
      return unauthenticated;
    },

    authenticatedApps: function() {
      var authenticated = {};
      for (var key in this.apps) {
        if (this.apps[key].user_token != null) {
          authenticated[key] = this.apps[key];
        }
      }
      return authenticated;
    }

  },
  methods: {

    createAccount: function() {
      var that = this;
      window.open(that.url + '/about');
    },

    addApp: function() {
      var that = this;
      if (that.instance != '') {
        if (that.instance.indexOf('://') != -1) that.instance = that.instance.split('://')[1];
        that.createApp('https://' + that.instance);
      }
    },

    previewMedia: function(media) {
      var that = this;
      that.popup.media = true;
      that.preview_media = media;
      console.log('preview?');
    },

    removeApp: function(key) {
      var that = this;
      delete that.apps[key];
      that.saveData();
      that.app = '';
      that.url = '';
      that.feed = [];
      that.state = 'home';
      window.location.href = '/';
    },

    viewProfile: function(profile) {
      console.log(profile);
      var that = this;
      that.profile = null;
      $Router.push({ path: '/' + that.app.name + '/profile/' + profile.id });
      that.loadProfile(profile.id, true);
    },

    sendToot: function() {
      var that = this;
      $Mastodon.sendToot(that.url, that.status, that.app.user_token, function(err, res) {
        if (err) return console.error(err);
        console.log(res);
        that.toots.unshift(res);
        that.popup.toot = false;
        that.status = '';
      });
    },

    viewToot: function(toot) {
      console.log(toot);
      var that = this;
      that.toot = null;
      $Router.push({ path: '/' + that.app.name + '/toot/' + toot.id });
      that.loadToot(toot.id);
    },

    loginUser: function() {
      var that = this;
      $Mastodon.authoriseUser(that.url, that.app.client_id);
      that.popup.authorize = true;
    },

    likeToot: function(toot) {
      var that = this;
      if (toot.favourited == true) {
        toot.favourites_count -= 1;
        toot.favourited = false;
        $Mastodon.unfavouriteToot(toot.id, that.url, that.app.user_token, function(err, res) {
          if (err) return console.error(err);
        })
      } else {
        toot.favourites_count += 1;
        toot.favourited = true;
        $Mastodon.favouriteToot(toot.id, that.url, that.app.user_token, function(err, res) {
          if (err) return console.error(err);
        });
      }
    },

    boostToot: function(toot) {
      var that = this;
      if (toot.reblogged == true) {
        toot.reblogs_count -= 1;
        toot.reblogged = false;
        $Mastodon.unboostToot(toot.id, that.url, that.app.user_token, function(err, res) {
          if (err) return console.error(err);
        });
      } else {
        toot.reblogs_count += 1;
        toot.reblogged = true;
        $Mastodon.boostToot(toot.id, that.url, that.app.user_token, function(err, res) {
          if (err) return console.error(err);
        });
      }
    },

    parseEmoji: function(data, emojis) {
      if (emojis != undefined) {
        emojis.forEach(function(e) {
          data = data.replaceAll(
            ':' + e.shortcode + ':', 
            '<span data-shortcode="' + e.shortcode + '" class="td-emoji"><img src="' + e.url + '" title="' + e.shortcode + '"/></span>'
          );
        });
      }
      return data;
    },

    parseBody: function(toot) {
      var that = this;
      data = that.parseEmoji(toot.content, toot.emojis);
      var url = toot.uri.split('/users')[0];
      // replace hashtag links with onclick ev
      data = data.replaceAll('href="' + url + '/tags/', 'onclick="searchTag(event, \'');
      data = data.replaceAll('" class="mention hashtag"', '\')"');
      // replace @mentions with onclick ev
      data = data.replaceAll('href="' + url + '/', 'onclick="searchProfile(event, \'');
      data = data.replaceAll('" class="u-url mention"', '\')"');
      return data;
    },

    authUser: function() {
      var that = this;
      $Mastodon.obtainToken(that.url, that.code, that.app.client_id, that.app.client_secret, function(err, res) {
        if (err) return console.error(err);
        var token = res.access_token;
        that.popup.authorize = false;
        that.app.user_token = token;
        that.saveData();
        that.loadFeed(that.app, that.url);
      });
    },

    clearAuth: function() {
      var that = this;
      that.app.user_token = null;
      that.saveData();
    },

    goBack: function() {
      $Router.go(-1);
    },
    
    setComment: function(toot) {
      var that = this;
      var toggle = toot._comment;
      if (that.toot != null) {
        that.toot._comment = false;
        if(that.toot._comments_after) {
          that.toot._comments_after.forEach(function(c) { c._comment = false; });
        }
        if (that.toot._comments_before) {
          that.toot._comments_before.forEach(function(c) { c._comment = false; });
        }
      }
      that.toots.forEach(function(t) {
        t._comment = false;
        if( t._comments_after) {
          t._comments_after.forEach(function(c) { c._comment = false; });
        }
        if (t._comments_before) {
          t._comments_before.forEach(function(c) { c._comment = false; });
        }
      });
      toot._comment = !toggle;
      if (toot._comment == true) {
        that.reply_to = toot;
        that.comment = '@' + toot.account.username + ' ';
        var did = 'textarea-' + toot.id;
        that.reply_from = that.url; // TODO
        Vue.nextTick(function() {
          console.log("id is", did);
          document.getElementById(did).focus();
        })
      }
    },

    replyToot: function() {
      var that = this;
      $Mastodon.replyToot(that.url, that.comment, that.reply_to.id, that.apps[that.reply_from].user_token, function(err, res) {
        if (err) return console.error(err);
        console.log(res);
        that.reply_to._comment = false;
        that.reply_to.replies_count += 1;
        that.comment = '';
        that.reply_to = '';
      });
    },

    setFeed: function() {
      var that = this;
      that.loadFeed(that.app, that.url);
    },

    loadFeed: function(app, url) {
      var that = this;
      that.toots = [];
      that.community = app.name;
      that.app = app;
      that.url = url;
      that.state = 'feed';
      that.loading.feed = true;
      $Router.push({ path: '/' + that.app.name + '/feed' });
      $Mastodon.getPublicTimeline(url, that.app.user_token, that.app.user_token == null ? 'public' : that.feed_type, function(err, res) {
        if (err) {
          console.error(err);
          if (err.indexOf('requires an authenticated user') != -1) {
            that.errors.not_public = true;
          }
        } else {
          res.forEach(function(toot) {
            toot._comment = false;
          });
          that.errors.not_public = false;
          that.toots = res;
        }
        that.loading.feed = false;
      });
      $Mastodon.getTrending(url, that.app.user_token, function(err, res) {
        if (err) return console.error(err);
        that.trends = res;
      });
      that.getCurrentUser();
    },

    loadMore: function() {
      var that = this;
      $Mastodon.getMorePublicTimeline(that.url, that.app.user_token, that.app.user_token == null ? 'public' : that.feed_type, that.toots[that.toots.length-1].id, function(err, res) {
        if (err) {
          console.error(err);
          if (err.indexOf('requires an authenticated user') != -1) {
            that.errors.not_public = true;
          }
        } else {
          that.errors.not_public = false;
          res.forEach(function(toot) {
            toot._comment = false;
            that.toots.push(toot);
          })
        }
        that.loading.feed = false;
      })
    },

    formatDate: function(stamp) {

      var today = new Date().toISOString();

      var today_val = today.split('T');
      var stamp_val = stamp.split('T');

      // today
      if (today_val[0] == stamp_val[0]) {
        var today_time = today_val[1].split('.')[0];
        var stamp_time = stamp_val[1].split('.')[0];
        var today_hours = Number(today_time.split(':')[0]);
        var stamp_hours = Number(stamp_time.split(':')[0]);
        if (today_hours - stamp_hours == 0) {
          var today_mins = Number(today_time.split(':')[1]);
          var stamp_mins = Number(stamp_time.split(':')[1]);
          var diff = today_mins - stamp_mins;
          if (diff == 1) return '1 min ago';
          return today_mins - stamp_mins + ' mins ago';
        } else {
          var diff = today_hours - stamp_hours;
          if (diff == 1) return '1 hour ago';
          return diff + ' hours ago';
        }
      } else {
        var d = stamp.split('T')[0].split('-');
        return d[2] + '/' + d[1] + '/' + d[0];
      }

    },

    loadData: function() {
      var that = this;
      var data = window.localStorage.getItem('tootdeck');
      if (data != undefined) {
        that.apps = JSON.parse(data);
        var apps = Object.keys(that.apps);
        that.app = that.apps[apps[0]];
        that.community = that.app.name;
        that.url = apps[0];
        that.getCurrentUser();
        console.log($Router.currentRoute);
        if ($Router.currentRoute._value.path.indexOf('/profile/') != -1) {
          that.loadProfile($Router.currentRoute._value.params.profile_id, true);
        } else if ($Router.currentRoute._value.path.indexOf('/toot/') != -1) {
          that.loadToot($Router.currentRoute._value.params.toot_id);
        } else {
          that.loadFeed(that.app, apps[0]);
        }
      } else if ($Router.currentRoute._value.path == '/') {
        $Router.push({ path: '/' });
        that.state = 'home';
      }
    },

    getCurrentUser: function() {
      var that = this;
      $Mastodon.verifyToken(that.url, that.app.user_token, function(err, res) {
        if (err) return console.error(err);
        that.me = res;
      });
      $Mastodon.getNotifications(that.url, that.app.user_token, function(err, res) {
        if (err) return console.error(err);
        that.notifications = res;
      });
    },

    loadToot: function(toot_id) {
      var that = this;
      that.state = 'toot';
      that.profile = {};
      that.profile_toots = [];
      $Mastodon.loadToot(that.url, toot_id, that.app.user_token, function(err, res) {
        if (err) return console.error(err);
        that.toot = res;
        that.loadProfile(res.account.id, false);
        $Mastodon.loadContext(that.url, toot_id, that.app.user_token, function(err, res) {
          if (err) return console.error(err);
          that.toot._comments_before = res.ancestors;
          that.toot._comments_after = res.descendants;
        })
      });
    },

    followProfile: function(profile) {
      var that = this;
      if (profile._following == true) {
        that.profile._following = false;
        $Mastodon.unfollowProfile(that.url, profile.id, that.app.user_token, function(err, res) {
          if (err) return console.error(err);
        })
      } else {
        that.profile._following = true;
        $Mastodon.followProfile(that.url, profile.id, that.app.user_token, function(err, res) {
          if (err) return console.error(err);
        })
      }
    },

    loadProfile: function(account_id, profile) {
      var that = this;
      if (profile == true) {
        that.state = 'profile';
        $Router.currentRoute._value.path == '/profile/' + account_id;
      }
      that.profile = {};
      that.profile_toots = [];
      $Mastodon.loadProfile(that.url, account_id, that.app.user_token, function(err, res) {
        if (err) return console.error(err);
        res._following = false;
        that.profile = res;
        if (profile == true) {
          $Mastodon.getProfileTimeline(that.url, account_id, that.app.user_token, function(err, res) {
            if (err) return console.error(err);
            that.profile_toots = res;
          })
        }
        $Mastodon.getRelationship(that.url, that.profile.id, that.app.user_token, function(err, res) {
          if (err) return console.error(err);
          // other props like "requested", "notifying", "muting" etc
          that.profile._following = res[0].following;
        });
      });
    },

    saveData: function() {
      var data = this.apps;
      window.localStorage.setItem('tootdeck', JSON.stringify(data));
    },

    goToDashboard() {
      if (isAuthenticated) {
        this.$router.push('/dashboard')
      } else {
        this.$router.push('/login')
      }
    },

    createApp: function(url) {
      var that = this;
      if (that.apps[url] == undefined) {
        $Mastodon.createApp(url, function(err, res) {
          if (err) {
            console.error(err);
          } else {
            console.log('App Created for', url, res);
            var name = url.indexOf('://') != -1 ? url.split('://')[1] : url
            that.apps[url] = {
              name: name,
              user_token: null,
              client_id: res.client_id,
              client_secret: res.client_secret
            }
            that.app = that.apps[url];
            that.community = name;
            that.url = url;
            that.saveData();
            that.loadFeed(that.app, that.url);
            that.popup.add = false;
          }
        })
      } else {
        that.app = that.apps[url];
        that.url = url;
        that.community = that.app.name;
        that.loadFeed(that.app, that.url);
        that.popup.add = false;
      }
    },

    searchTag: function(tag) {
      var that = this;
      $Router.push({ path: '/' + that.app.name + '/search/' + tag });
    }


  },
  mounted: function() {
    var that = this;
    that.loadData();
  }
});
$App.use($Router);
$App.mount('#app');

$App.component('td-card', $Components.card);
$App.component('td-profile', $Components.profile);

function searchTag(ev, tag) {
  ev.stopPropagation();
  var app = $Router.currentRoute._value.path.split('/')[1];
  $Router.push({ path: '/' + app + '/search/' + tag });
}

function searchProfile(ev, profile) {
  ev.stopPropagation();
  var app = $Router.currentRoute._value.path.split('/')[1];
  $Router.push({ path: '/' + app + '/search/' + profile });
}