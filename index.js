var request = require('request').defaults({ encoding: null });
var fs = require('fs');
var jsonfile = require('jsonfile');
var moment = require('moment');
var Twit = require('twit');
var twitterConfig = require('./twitter-config');

console.log(Date());
var Bot = new Twit(twitterConfig);

var doTweet;
var obj = JSON.parse(fs.readFileSync('ga_facilities-index.json', 'utf8') || '{}');
var index = obj.index || 0;
var facilities = JSON.parse(fs.readFileSync('ga_facilities.json', 'utf8'));

doTweet = function() {
  index++;
  var facility = facilities[index];

  var street = facility.STREET_ADDRESS;
  var location = encodeURI(street + ', ' + facility.CITY_NAME + ' ' + facility.STATE_ABBR + ' ' + facility.ZIP_CODE);

  // post to twitter
  request.get('https://maps.googleapis.com/maps/api/streetview?size=600x400&location=' + location, function (error, response, body) {
    if (error) {
      console.error('error getting streetview image', error);
    } else {
      imageData = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');

      Bot.post('media/upload', { media_data: new Buffer(body).toString('base64') }, function (err, data, response) {
        if (err) console.error('error uploading image to twitter', err);
        var mediaIdStr = data.media_id_string
        var meta_params = { media_id: mediaIdStr }

        Bot.post('media/metadata/create', meta_params, function (err, data, response) {
          if (err) {
            console.error('error creating metadata', err);
          } else {
            // now we can reference the media and post a tweet (media will attach to the tweet) 
            var params = { status: facility.FACILITY_NAME, media_ids: [mediaIdStr] }
       
            Bot.post('statuses/update', params, function (err, data, response) {
              if (err) console.error('error tweeting', err);
              else console.log('done tweeting');
            });
          }
        })
      })
    }
  });


  // save json index
  jsonfile.writeFile('ga_facilities-index.json', { 'index': index }, { spaces: 2 }, function(err) {
    console.error(err);
  });
}

doTweet();
