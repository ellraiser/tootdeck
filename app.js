
var $Router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes: [
    { path: '/', component: { template: '#home-page' }, props: true },
    { path: '/info', component: { template: '#about-page' }, props: true },
    { path: '/:instance/feed', component: { template: '#feed-page' }, props: true },
    { path: '/:instance/toot/:toot_id', component: { template: '#toot-page' }, props: true },
    { path: '/:instance/profile/:profile_id', component: { template: '#profile-page' }, props: true },
    { path: '/:instance/search/:query', component: { template: '#search-page' }, props: true },
    { path: '/:instance/notifications', component: { template: '#notification-page' }, props: true },
  ],
});


var $Components = {
  card: {
    props: ['toot', 'comment', 'selected', 'retoot', 'instance', 'preview'],
    template: '#td-card'
  },
  profile: {
    props: ['profile', 'instance', 'compact'],
    template: '#td-profile'
  }
}

var $App = Vue.createApp({
  data: function() {
    return {
      state: 'home',
      message: 'TOOTDECK',
      communities: [],
      community: '',
      info: '',
      fav: '',
      app: {},
      url: '',
      bug: '@ellraiser@mastodon.art fix yo shit pls',
      bug_sent: false,
      instance: '',
      emojis: [],
      apps: {},
      code: '',
      me: {},
      query: '',
      trends: [],
      announcements: [],
      toots: [],
      toot: null,
      profile: '',
      profile_toots: [],
      comment: '',
      reply_to: '',
      reply_from: null,
      status: '',
      status_privacy: 'public',
      notifications: {},
      unread_notifications: {},
      results: [],
      hashtags: [],
      poll_ids: {},
      start_polling: false,
      feed_type: 'home',
      loading: {
        feed: false,
        more: false,
        toot: false
      },
      select: {
        privacy: false,
        emoji: false,
        inline_privacy: false,
        inline_emoji: false
      },
      popup: {
        authorize: false,
        toot: false,
        media: false
      },
      edit: {
        communities: false,
        public: false
      },
      errors: {
        not_public: false,
      },
      tutorial: {
        public: false,
        community: false
      },
      preview_media: '',
      last_page: null
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

    getLast: function() {
      var that = this;
      that.last_page = $Router.options.history.state.back;
    },

    createAccount: function() {
      var that = this;
      window.open(that.url + '/about');
    },

    addApp: function(chosen) {
      var that = this;
      that.loading.app = true;
      if (that.instance != '' || chosen != null) {
        var inst = chosen != null ? chosen : that.instance;
        if (inst.indexOf('://') != -1) inst = inst.split('://')[1];
        that.instance = inst;
        that.createApp('https://' + inst);
      }
    },

    previewMedia: function(media) {
      var that = this;
      that.popup.media = true;
      that.preview_media = media;
    },

    deleteToot: function(toot) {
      var that = this;
      $Mastodon.deleteToot(that.url, toot.id, that.app.user_token, function(err, res) {
        var toot_list = null;
        if (that.state == 'feed') {
          toot_list = that.toots;
        } else if (that.state == 'profile') {
          toot_list = that.profile_toots;
        }
        if (toot_list == null) return console.log('delete toot in ' + that.state);
        var index = -1;
        for (var t = 0; t < toot_list.length; t++) {
          if (toot_list[t].id == toot.id) {
            index = t; break;
          }
        };
        if (index != -1) toot_list.splice(index, 1);
      });
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
      var that = this;
      that.profile = null;
      $Router.push({ path: '/' + that.app.name + '/profile/' + profile.id });
      that.getLast();
      that.loadProfile(profile.id, true);
    },

    sendToot: function() {
      var that = this;
      $Mastodon.sendToot(that.url, that.status, that.status_privacy, that.app.user_token, function(err, res) {
        if (err) return console.error(err);
        that.toots.unshift(res);
        that.popup.toot = false;
        that.status = '';
      });
    },

    sendBug: function() {
      var that = this;
      $Mastodon.sendToot(that.url, that.bug, 'public', that.app.user_token, function(err, res) {
        if (err) return console.error(err);
        that.bug = '@ellraiser@mastodon.art fix yo shit pls';
        that.bug_sent = true;
      });
    },

    viewToot: function(toot) {
      var that = this;
      that.toot = null;
      $Router.push({ path: '/' + that.app.name + '/toot/' + toot.id });
      that.getLast();
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

        var is_big = false;
        var big_check = data.replace('<p>', '').replace('</p>', '');
        if (big_check.indexOf('<') == -1 && big_check.indexOf('>') == -1 && big_check.indexOf(' ') == -1) {
          if (big_check.charAt(0) == ':' && big_check.charAt(big_check.length-1) == ':') is_big = true;
        }

        emojis.forEach(function(e) {
          data = data.replaceAll(
            ':' + e.shortcode + ':', 
            '<span data-shortcode="' + e.shortcode + '" class="td-emoji ' + (is_big ? 'big' : '') + '">' + 
              '<img src="' + e.url + '" title="' + e.shortcode + '"/>' + 
              '<img class="zoom" src="' + e.url + '" title="' + e.shortcode + '"/>' + 
            '</span>'
          );
        });
      }
      return data;
    },

    parseBody: function(toot) {
      var that = this;
      var content = toot.note || toot.content;
      data = that.parseEmoji(content, toot.emojis);
      data = data.replaceAll('href="', 'onclick="handleLink(event, \'');
      data = data.replaceAll('" rel="', '\')" rel="');
      data = data.replaceAll('" class="mention hashtag\')"', '\')" class="mention hashtag"');
      data = data.replaceAll('" class="u-url mention\')"', '\')" class="u-url mention"');
      data = data.replaceAll('\')" class="u-url mention"', '" class="u-url mention"');
      data = data.replaceAll('" class="u-url mention"', '\')" class="u-url mention"');
      data = data.replaceAll('" target="_blank\')', '\')" target="_blank"');
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
      var that = this;
      $Router.go(-1);
      setTimeout(function() {
        that.last_page = $Router.options.history.state.back;
      }, 100);
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
        console.log("Toot to reply to", toot);
        if (toot.account.url.indexOf(that.url) == -1) {
          that.comment = '@' + toot.account.username + '' + '@' + toot.account.url.split('//')[1].split('/@')[0] + ' ';
        } else {
          that.comment = '@' + toot.account.username + ' ';
        }
        var did = 'textarea-' + toot.id;
        that.reply_from = that.url; // TODO
        Vue.nextTick(function() {
          document.getElementById(did).focus();
        })
      }
    },

    replyToot: function() {
      var that = this;
      $Mastodon.replyToot(that.url, that.comment, that.reply_to.id, that.apps[that.reply_from].user_token, function(err, res) {
        if (err) return console.error(err);
        that.reply_to._comment = false;
        that.reply_to.replies_count += 1;
        that.comment = '';
        that.reply_to = '';
      });
    },

    setFeed: function() {
      var that = this;
      that.app.last_feed = that.feed_type;
      that.loadFeed(that.app, that.url);
      that.saveData();
    },

    loadFeed: function(app, url) {
      var that = this;
      that.toots = [];
      that.community = app.name;
      that.app = app;
      that.url = url;
      that.state = 'feed';
      that.loading.feed = true;
      that.query = '';
      that.info = '';
      $Router.push({ path: '/' + that.app.name + '/feed' });
      // get timeline
      $Mastodon.getPublicTimeline(url, that.app.user_token, that.app.user_token == null ? 'public' : that.feed_type, function(err, res) {
        if (err) {
          console.error(err);
          if (err.indexOf('requires an authenticated user') != -1) {
            that.errors.not_public = true;
          }
        } else {
          res = that.setupToots(res);
          that.errors.not_public = false;
          that.toots = res;
        }
        that.loading.feed = false;
      });
      // get trending hashtahs
      that.trends = [];
      $Mastodon.getTrending(url, that.app.user_token, function(err, res) {
        if (err) return console.error(err);
        that.trends = res;
      });
      // get community announcements
      that.announcements = [];
      $Mastodon.getAnnouncements(url, that.app.user_token, function(err, res) {
        if (err) return console.error(err);
        that.announcements = res.length > 0 ? [res[0]] : [];
      });
      // get emojis
      $Mastodon.getEmojis(url, that.app.user_token, function(err, res) {
        if (err) return console.error(err);
        var emojis = {};
        res.forEach(function(e) {
          if (e.visible_in_picker == true) {
            if (emojis[e.category] == undefined) {
              emojis[e.category] = [];
            }
            emojis[e.category].push(e);
          }
        })
        console.log(emojis);
        that.emojis = emojis;
      })
      that.getCurrentUser();
      that.saveData();
    },

    loadMore: function() {
      var that = this;
      that.loading.more = true;
      $Mastodon.getMorePublicTimeline(that.url, that.app.user_token, that.app.user_token == null ? 'public' : that.feed_type, that.toots[that.toots.length-1].id, function(err, res) {
        if (err) {
          console.error(err);
          if (err.indexOf('requires an authenticated user') != -1) {
            that.errors.not_public = true;
          }
        } else {
          that.errors.not_public = false;
          res = that.setupToots(res);
          res.forEach(function(t) {
            that.toots.push(t);
          })
        }
        that.loading.feed = false;
        that.loading.more = false;
      })
    },

    setupToots: function(toots) {
      var that = this;
      toots.forEach(function(toot) {
        toot = that.setupToot(toot);
      })
      return toots;
    },

    setupToot: function(toot) {
      var that = this;
      toot._comment = false;
      toot._view = false;
      toot._comments_before = [];
      toot._comments_after = [];
      if (toot.media_attachments) {
        toot.media_attachments.forEach(function(m) {
          m._view = false;
        });
      }
      return toot;
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

    loadInstances: function() {
      var that = this;
      var common_instances = [
        { name: 'mastodon.art', short: 'The original Mastodon server for art & artists' },
        { name: 'mastodon.lol', short: 'LGBTQ+ friendly space for dreamers & memers'},
        { name: 'mstdn.social', short: 'Make friends and explore the fediverse together' }
      ];
      that.communities = [];
      common_instances.forEach(function(i) {
        $Mastodon.getInstanceInfo('https://' + i.name, function(err, res) {
          if (err) return console.error(err);
          res._short = i.short;
          that.communities.push(res);
        })
      });
    },

    loadData: function() {
      var that = this;
      var last = window.localStorage.getItem('tootdeck-last');
      var data = window.localStorage.getItem('tootdeck');
      if (data != undefined) {
        that.apps = JSON.parse(data);
        var apps = Object.keys(that.apps);
        if (last != undefined && that.apps[last] != undefined) {
          that.app = that.apps[last];
          that.community = that.app.name;
          that.url = last;
        } else {
          that.app = that.apps[apps[0]];
          that.community = that.app.name;
          that.url = apps[0];
        }
        that.feed_type = that.app.last_feed == undefined ? 'home' : that.app.last_feed;
        that.getCurrentUser();
        if ($Router.currentRoute._value.path.indexOf('/profile/') != -1) {
          that.loadProfile($Router.currentRoute._value.params.profile_id, true);
        } else if ($Router.currentRoute._value.path.indexOf('/toot/') != -1) {
          that.loadToot($Router.currentRoute._value.params.toot_id);
        } else {
          that.loadFeed(that.app, that.url);
        }
      } else if ($Router.currentRoute._value.path == '/') {
        $Router.push({ path: '/' });
        that.state = 'home';
      }
      var tutorials = window.localStorage.getItem('tootdeck-tootorial');
      if (tutorials != undefined) {
        console.log(tutorials);
      }
    },

    getCurrentUser: function() {
      var that = this;
      $Mastodon.verifyToken(that.url, that.app.user_token, function(err, res) {
        if (err) return console.error(err);
        that.me = res;
      });
      for (var a in that.authenticatedApps) {
        (function(i) {
          $Mastodon.getNotifications(i, that.authenticatedApps[i].user_token, function(err, res) {
            if (err) return console.error(err);
            var last_notification = that.authenticatedApps[i].last_notification || 0;
            console.log(last_notification);
            res.forEach(function(n) {
              n._read = Number(n.id) <= Number(last_notification);
            });
            that.notifications[i] = res;
            that.unread_notifications[i] = that.notifications[i].filter(function(n) { return n._read == false }).length;
            if (that.start_polling == false) that.pollNotifications();
          });
        }(a));
      }
    },

    pollNotifications: function() {
      var that = this;
      that.start_polling = true;
      for (var a in that.authenticatedApps) {
        (function(i) {
          var last_notification = that.authenticatedApps[i].last_notification || 0;
          if (that.poll_ids[i] != undefined) last_notification = that.poll_ids[i];
          if (last_notification != 0) {
            $Mastodon.getNotificationsSince(i, that.authenticatedApps[i].user_token, last_notification, function(err, res) {
              if (err) return console.error(err);
              if (res.length > 0) {
                res.forEach(function(n) {
                  n._read = false;
                  that.notifications[i].unshift(n);
                });
                that.poll_ids[i] = that.notifications[i][0].id;
                that.unread_notifications[i] = that.notifications[i].filter(function(n) { return n._read == false }).length;
              }
            });
          }
        }(a));
      }
      setTimeout(function() {
        that.pollNotifications();
      }, 10000);
    },

    loadToot: function(toot_id) {
      var that = this;
      that.state = 'toot';
      that.profile = {};
      that.profile_toots = [];
      that.query = '';
      that.getLast();
      that.loading.toot = true;
      $Mastodon.loadContext(that.url, toot_id, that.app.user_token, function(err, context) {
        if (err) return console.error(err);
        $Mastodon.loadToot(that.url, toot_id, that.app.user_token, function(err, res) {
          if (err) return console.error(err);
          res = that.setupToot(res);
          that.toot = res;
          that.toot._comments_before = context.ancestors;
          that.toot._comments_after = context.descendants;
          that.loadProfile(res.account.id, false);
          that.loading.toot = false;
          Vue.nextTick(function() {
            var el = document.getElementById('card-' + that.toot.id);
            document.getElementById('scroll').scrollTop = (el.offsetTop-40);
          })
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

    insertEmoji: function(emoji, comment) {
      var that = this;
      if (comment == true) {
        that.comment += (' :' + emoji.shortcode + ': ');
      } else {
        that.status += (' :' + emoji.shortcode + ': ');
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
      that.query = '';
      that.getLast();
      that.loading.feed = true;
      $Mastodon.loadProfile(that.url, account_id, that.app.user_token, function(err, res) {
        if (err) return console.error(err);
        res._following = false;
        res._mode = 'info';
        that.profile = res;
        if (profile == true) {
          $Mastodon.getProfileTimeline(that.url, account_id, that.app.user_token, function(err, res) {
            if (err) return console.error(err);
            that.profile_toots = that.setupToots(res);
            that.loading.feed = false;
          })
        }
        $Mastodon.getRelationship(that.url, that.profile.id, that.app.user_token, function(err, res) {
          if (err) return console.error(err);
          // other props like "requested", "notifying", "muting" etc
          that.profile._following = res[0].following;
        });
      });
    },

    loadMoreProfile: function() {
      var that = this;
      $Mastodon.getMoreProfileTimeline(that.url, that.profile.id, that.app.user_token, that.profile_toots[that.profile_toots.length-1].id, function(err, res) {
        if (err) return console.error(err);
        res = that.setupToots(res);
        res.forEach(function(t) {
          that.profile_toots.push(t);
        });
        that.loading.feed = false;
        that.loading.more = false;
      })
    },

    saveData: function() {
      var that = this;
      window.localStorage.setItem('tootdeck', JSON.stringify(that.apps));
      window.localStorage.setItem('tootdeck-tootorial', JSON.stringify(that.tutorial));
      window.localStorage.setItem('tootdeck-last', that.url);
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
            var name = url.indexOf('://') != -1 ? url.split('://')[1] : url
            that.apps[url] = {
              name: name,
              user_token: null,
              client_id: res.client_id,
              client_secret: res.client_secret,
              last_notification: null,
              last_feed: 'public'
            }
            that.app = that.apps[url];
            that.community = name;
            that.url = url;
            that.saveData();
            that.loadFeed(that.app, that.url);
            that.popup.add = false;
            that.loading.app = false;
          }
        })
      } else {
        that.app = that.apps[url];
        that.url = url;
        that.community = that.app.name;
        that.loadFeed(that.app, that.url);
        that.popup.add = false;
        that.loading.app = false;
      }
    },

    runSearch: function() {
      var that = this;
      that.info = '';
      if (that.query.indexOf('#') != -1) {
        that.searchTag(that.query);
      } else if (that.query.indexOf('@') != -1) {
        that.searchProfile(that.query);
      } else {
        $Router.push({ path: '/' + that.app.name + '/search/' + that.query });
        $Mastodon.runSearch(that.url, that.app.user_token, that.query, '', null, function(err, res) {
          if (err) return console.error(err);
          that.results = res.accounts;
          that.hashtags = res.hashtags.filter(function(h, i) {
            return i < 5;
          })
          that.state = 'search-both';
          document.getElementById('scroll').scrollTop = 0;
        });
      }
    },

    searchTag: function(tag) {
      var that = this;
      tag = tag.replaceAll('#', '');
      that.query = '#' + tag;
      that.info = '';
      $Router.push({ path: '/' + that.app.name + '/search/' + tag });
      $Mastodon.runSearch(that.url, that.app.user_token, tag, 'hashtags', null, function(err, res) {
        if (err) return console.error(err);
        that.results = res;
        that.state = 'search-tag';
        document.getElementById('scroll').scrollTop = 0;
      });
      $Mastodon.runSearch(that.url, that.app.user_token, tag, 'limit', null, function(err, res) {
        if (err) return console.error(err);
        that.hashtags = res.hashtags;
      });
    },

    loadInfo: function(info) {
      var that = this;
      that.info = info;
      that.bug = '@ellraiser@mastodon.art fix yo shit pls';
      that.bug_sent = false;
      $Router.push({ path: '/info' });
    },

    searchMoreTag: function() {
      var that = this;
      that.loading.more = true;
      $Mastodon.runSearch(that.url, that.app.user_token, that.query.replace('#', ''), 'hashtags', that.results[that.results.length-1].id, function(err, res) {
        if (err) return console.error(err);
        res.forEach(function(t) {
          that.results.push(t);
        });
        that.loading.more = false;
      });
    },

    searchProfile: function(profile) {
      var that = this;
      console.log(profile);
      that.query = profile;
      that.info = '';
      $Router.push({ path: '/' + that.app.name + '/search/' + profile });
      $Mastodon.runSearch(that.url, that.app.user_token, profile, '', null, function(err, res) {
        if (err) return console.error(err);
        res.accounts.forEach(function(a) {
          a._mode = 'info';
        });
        that.results = res.accounts;
        that.state = 'search-profile';
        document.getElementById('scroll').scrollTop = 0;
      });
    },

    shortenNumber: function(num) {
      if (num > 1000000) return Math.floor(num/1000000) + 'm';
      if (num > 1000) return Math.floor(num/1000) + 'k';
      return num;
    },

    viewNotifications: function() {
      var that = this;
      $Router.push({ path: '/' + that.app.name + '/notifications' });
      // set last notification as the last one we had
      that.apps[that.url].last_notification = that.notifications[that.url][0].id;
      that.saveData();
      setTimeout(function() {
        that.notifications[that.url].forEach(function(n) {
          n._read = true;
        })
        that.unread_notifications[that.url] = that.notifications[that.url].filter(function(n) { return n._read == false }).length;
      }, 2500);
    },

    editProfile: function() {
      alert('I aint done that yet soz');
    }


  },
  mounted: function() {
    var that = this;
    window._app = this;
    that.loadData();
    that.loadInstances();
  }
});
$App.use($Router);
$App.mount('#app');

$App.component('td-card', $Components.card);
$App.component('td-profile', $Components.profile);


function handleLink(ev, link) {
  ev.stopPropagation();
  var cls = ev.currentTarget.className;
  console.log("Link clicked!", link, cls);

  if (cls == 'u-url mention') {
    var user = link.split('@')[1];
    $Mastodon.runSearch(window._app.url, window._app.app.user_token, '@' + user, 'accounts', null, function(err, res) {
      if (err) return console.error(err);
      var match = res.accounts.filter(function(r) {
        return r.url == link;
      })[0];
      window._app.viewProfile(match);
    });
  } else

  if (cls == 'mention hashtag') {
    var tag = link.split('/tags/')[1];
    window._app.searchTag(tag);
  } else 

  if (cls == '') {

    if (link.indexOf(window._app.url) != -1) {
      var type = link.split('/');
      if (type.length == 5) {
        window._app.viewToot({ id: type[4] });
      }
      if (type.length == 4) {
        alert('internal link to a profile maybe?' +  link);
      }
      console.log('internal link', link, type.length);
      
    } else {
      window.open(link);

    }

    // if on the same domain its a link to a person or post

    // otherwise external link to open externally

  }

  // some options

  /*

    1. link is a hashtag search (cls = "mention hashtag") (link = /tags/TAG)

    2. link is a mention (cls = "u-url mention") (link = /@username)
       - link is either on our instance 
       - link is on another instance
       either way we need to get the profile id for the given @username?

    3. link is external (cls = "")
       - open in new tab

  */

}