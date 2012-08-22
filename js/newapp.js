;(function($, window, undefined) {

  // Use Mustache syntax for templates
  _.templateSettings.interpolate = /\{\{(.+?)\}\}/g;

  SC.initialize({
    client_id: "b1ec133b0f33710d7443875249facd57"
  });

  var hot_tracks, widget;

  var greetings = [
    'Listen to some fucking ',
    'Bet you never fucking heard ',
    'Your fucking ears will be graced by ',
    'The fucking Music Gods have brought you ',
    'Muh fucking Mozart is chanelled through ',
    'Your life was fucking incomplete without ',
    'Bro, fucking listen to '
  ];

  var whatTag;
  var randomTrack;

  function getRandomTrack(aTag) {
    var genre = genres.where({name: aTag});
    var arrayOfTracks = genre[0].attributes.tracks;
    randomTrack = arrayOfTracks[Math.floor(arrayOfTracks.length*Math.random())];
    whatTag = aTag;
    return randomTrack;
  }

  // Social View

  var TwitterView = Backbone.View.extend({
    initialize: function () {
      _.bindAll(this, "render");
      this.model.bind("change", this.render);
      this.template = _.template($("#twitter-template").html());
    },
    render: function () {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    }
  });

  var FacebookView = Backbone.View.extend({
    initialize: function () {
      console.log("in initialize");
      _.bindAll(this, "render");
      this.model.bind("change", this.render);
      this.template = _.template($("#facebook-template").html());
    },
    render: function () {
      console.log("in render");
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    }
  });


  function createLink(trackID) {
    var song = trackID;
    console.log("song is " + song);
    var link = new Link();

    // 1. Instantiate Track

    var track = new Track();

    // 2. Instantiate Social Views

    var twitter = new TwitterView({
      el: $("#twitter-view"),
      model: track
    });

    var facebook =  new FacebookView({
      el: $("#facebook-view"),
      model: track
    });


    // 3 Set uri to trackID

    track.set({uri: trackID});

    link.navigate("/" + song);
    console.log("Link created");
  }

  function getGreeting() {
    $(".listenToGreeting").html(greetings[Math.floor(greetings.length * Math.random())]);
    var soundCloudUser = randomTrack.user.username;
    var soundCloudUserUrl = randomTrack.user.permalink_url;
    $(".username a").attr("href",soundCloudUserUrl).html(soundCloudUser);
  }

  function playNextTrack(widget) {
    widget.load(getRandomTrack(whatTag).uri, {
      auto_play: true,
      sharing: false
    });
    getGreeting();
  }

  function play(track) {
    // SC Playing http://developers.soundcloud.com/docs/api/guide#playing
    // SC oEmbed http://developers.soundcloud.com/docs/api/reference#oembed
    SC.oEmbed(track.uri, {show_comments: false, sharing: false, auto_play: true}, function(oembed) {
      // Embed iframe
      $(".music").html(oembed.html);
      // http://developers.soundcloud.com/docs/api/html5-widget#methods
      widget = SC.Widget($(".music iframe")[0]);
      widget.bind(SC.Widget.Events.READY, function (e) {
        $(".username").css("visibility", "visible");
        $("nav").css("visibility", "visible");
        $(".next").click(function() {
          playNextTrack(widget);
        });
        playPause();
        widget.bind(SC.Widget.Events.PLAY, function(track) {
           widget.getCurrentSound(function (track) {
            //Now create a link for this sound
            createLink(track.id);
          });
        });
        widget.bind(SC.Widget.Events.FINISH, function () {
          playNextTrack(widget);
        });
      });
    });
  }

  function playPause() {
    // PLAY/PAUSE ANIMATION and KEYBOARD/SPACEBAR STROKE
    $(document).keypress(function(e) {
      //If spacebar (32) is pressed, togglePlay and return false
      if ((e.which && e.which == 32) || (e.keyCode && e.keyCode == 32)) {
        togglePlay();
        return false;
      } else {
        return true;
      }
    });

    $('#playButton').click(function(){
      togglePlay();
      return false;
    });
  }

  function togglePlay(){
    var $elem = $('#player').children(':first');
    $elem.stop()
      .show()
      .animate({
        marginTop: -175,
        marginLeft: -175,
        width: 350,
        height: 350,
        opacity: 0
      }, function() {
        $(this).css({
          width:'100px',
          height:'100px',
          "margin-left":'-50px',
          "margin-top":'-50px',
          opacity: 1,
          display:'none'
      });
    });
    $elem.parent().append($elem);
    if ( $("#player").children(":first").attr("id") == "pause" ) {
      widget.pause();
      $("#playButton").html("&nbsp; &#9658; &nbsp;");
    } else {
      widget.play();
      $("#playButton").html("&nbsp;&#9616;&#9616;&nbsp;");
    }
  }

  // Model that contains all genres
  var Track = Backbone.Model.extend({
    uri: null,
    title: null
  });

  var Genre = Backbone.Model.extend({});
  var Genres = Backbone.Collection.extend({});

  var genres = new Genres();
  var track = new Track();

  var countCheck = 0;
  var tagCount = $("#selectATag option").length;

  function getTrack(tag) {
    if (tag === "HotTracks") {
      SC.get("/tracks?filter=public&order=hotness", {limit: 50}, function(tracks) {
        //containsUris[tag] = tracks;
        var genre = new Genre({name: tag, tracks: tracks});
        genres.add(genre);
        counts();
      });
    } else {
      SC.get("/tracks?filter=public&order=hotness&tags=" + tag, {limit: 50}, function(tracks) {
        var genre = new Genre({name: tag, tracks: tracks});
        genres.add(genre);
        counts();
      });
    }
  }

  function counts() {
    // Count tracks
    countCheck++;
    if( countCheck < tagCount ) {
      } else {
      checkForTrack();
    }
  }

  // Sees if the URL has a track in it
  function checkForTrack() {
    if (hasTrack === true) {
      SC.get("/tracks/" + trackObject,  function(track) {
        randomTrack = track;
        play(track);
        getGreeting();
        whatTag = "HotTracks";
      });
    } else {
      console.log(genres.length);
      play(getRandomTrack("HotTracks"));
      getGreeting();
    }
  }

  // For each dropdown value, pull 50 tracks
  $("#selectATag option").each( function() {
    getTrack($(this).val());
  });

  // Do this everytime you change tags
  $("#selectATag").change( function() {
    widget.load(getRandomTrack($(this).val()).uri, {
      auto_play: true,
      sharing: false,
      show_comments: false
    });
    getGreeting();
  });

  // Variable that tells us if the URL has a track (true/false)

  var hasTrack;
  var trackObject;

  var Link = Backbone.Router.extend({
    routes: {
      "*song":        "loadSong"        // #/*song
    },
    loadSong: function( song ) {
      if ( song.length > 0 ) {
        // If URL hasTrack, then set to true
        console.log("loadSong");
        hasTrack = true;
        trackObject = song;
      } else {

      }
    }
  });

  var link = new Link();

  Backbone.history.start();

  //Create User model
  var user = Backbone.Model.extend({

    ip: function() {
      //gets user IP address and identifies if user is new
    },

    isnew: " " //true or false

  });

})(jQuery, window);
