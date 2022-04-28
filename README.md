# tootdeck
![tootdeck](logo.png) 

https://tootdeck.app

The aim of tootdeck is to make an easy to use web client for mastodon that's easy enough for new tooters to come along and just get stuck into a bunch of communities, as well as old tooters having all the functionality they'd want across multiple instances.

@ me over on @ellraiser@mastodon.social or @ellraiser@mastodon.art!

Currently a work in progress, these are still things I want to get done for the 1.0:

## Priority

Toots
- [ ] Add Attachments (https://mastodon.example/api/v1/media)
- [ ] make toots with just a single emoji HUGE

Profile Page
- [ ] Edit Profile (https://mastodon.example/api/v1/accounts/update_credentials)

Misc
- [ ] Refresh list when deleting a toot thats an ancestor/descendant

## Future

Toots
- [ ] View Polls
- [ ] Vote Polls
- [ ] Add Polls
- [ ] Schedule + Scheduled Toots
- [ ] Preview profile on avatar hover
- [ ] Handle "no more toots" scenario, say on profile feeds
- [ ] See boosted by / favourited by on a toot
- [ ] Bookmarks!
- [ ] Mute 
- [ ] show type of toot with lil icon top right

Feeds
- [ ] Stream feeds for new toots

Profile Page
- [ ] Pin toots (/api/v1/statuses/:id/pin) and show Pinned Toots (/api/v1/accounts/:id/pin)
- [ ] "Media" section? Would need to just re-use existing toots and pull media from them

Misc
- [ ] DMs
- [ ] Profile endorsements
- [ ] reorder communities on LHS
- [ ] Notification streaming + popups
- [ ] Aria shit
- [ ] Tutorial blocks? What do we need to handhold through etc
- [ ] other search filters for search results page
- [ ] "hide social graph" preferences, does it affect count?
- [ ] mod report
- [ ] Suggested profiles / discover profiles
- [ ] Admin tab
- [ ] Show "redirected" on profiles (dreamymoonstudio@mastodon.online)
- [ ] load older notifications
- [ ] notification popup in the app?
- [ ] preview emojis in the text area as we go?
- [ ] async emoji load and use v-show for faster emojis

Federation
- [ ] Boost/comment/follow using different accounts?
- [ ] Handle mentions from other instances


## Finished 

Complete
- [x] Add communities
- [x] Login to communities
- [x] View public feed
- [x] View local feed
- [x] View federated feed
- [x] View toots
- [x] View profiles
- [x] View toot chains
- [x] Like/Unlike
- [x] Boosts/Unboost
- [x] Comment
- [x] Send toots
- [x] Toot privacy
- [x] View Content Warnings / Spoilers
- [x] Nice community add screen
- [x] Alt Text
- [x] Handle long ass profiles / minitabs
- [x] Followers / Following / Posts Counts
- [x] Shorten stats to k/m if over 1000/1000000
- [x] "More toots pls" for profile feeds
- [x] Show instance on external profiles
- [x] Remember last community viewed
- [x] Autoscroll to the actual selected toot in toot chains
- [x] Notifications page
- [x] Hashtag search timeline (#)
- [x] General search (profiles + hashtags)
- [x] Profile search (@)
- [x] Delete Toots 
- [x] Save last feed preference
- [x] Notification Polling
- [x] Mark notifications as read
- [x] Handle "external" links that are actually links to a user/post/tag (profile hashtag or @ etc)
- [x] Loading msg for profile toots
- [x] Custom emotes are the PRIORITY
- [x] Handle hashtag links for federation toots