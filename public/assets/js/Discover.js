var songprevlist = [];
var nextsonglist = [];
var favPrevList = [];
var prevPlaylistList = [];
var discover = false;
var searchsong = false;
var favorites = false;
var playlist = false;
//TRENDING ITALIA
var searchInLFMIT = function (title) {
    var url_request = urlLF_search + title + "&api_key=2b75dcb291e2b0c9a2c994aca522ac14&format=json";
    var obj_request = new XMLHttpRequest();
    var info = [];
    obj_request.onreadystatechange = function (status) {
        if (this.status == 200 && this.readyState == 4) {
            var obr_response = JSON.parse(this.responseText);
            var results = obr_response.results.trackmatches.track;
            var nResults = obr_response.results["opensearch:totalResults"];
            if(nResults != "0" && results){
                if(results[0].image[2]["#text"] == "")
                    info = [results[0].name, results[0].artist, "https://i5.walmartimages.com/asr/f752abb3-1b49-4f99-b68a-7c4d77b45b40_1.39d6c524f6033c7c58bd073db1b99786.jpeg?odnHeight=450&odnWidth=450&odnBg=FFFFFF"];
                else info = [results[0].name, results[0].artist, results[0].image[2]["#text"]];
                nextsonglist.push(info);
                printTrendingSongIT(info);
            }
        }
    };
    if(title.length <= 55 ){
        obj_request.open("get", url_request);
        obj_request.send();
    }

};

var printTrendingSongIT = function (data) {
    var title = data[0];
    var artist = data[1];
    var img = data[2];
    var elem = "<li onclick='play(this, \"discover\")' class='d-inline-flex result-list hvr-glow album-element'>" +
        "<img class='album-cover' src=" + img + ">" +
        "<p class='song-title song-name'>" + title + "</p>" +
        "<p class='song-title song-artist'>" + artist +
        "</p><i class='fas fa-star preferiti' onclick='addToFavorites(this)'></i>" +
        "<i onclick='addToPlaylist(this)' class='fas fa-plus-circle preferiti' data-toggle=\"modal\" data-target=\"#myModalPlaylist\"></i></li>";
    $("#trending-italy").append(elem);
};

var trendingItaly = function () {
    var trendingITURL = "https://www.googleapis.com/youtube/v3/videos?part=snippet&key=AIzaSyABRZpUO0xIyDJ8EcVj89YV7HBdj5qsgQ8&chart=mostPopular&regionCode=it&videoCategoryId=10&maxResults=20";
    var obj_request = new XMLHttpRequest();

    obj_request.onreadystatechange = function (status) {
        if (this.status == 200 && this.readyState == 4) {
            var obr_response = JSON.parse(this.responseText);
            var results = obr_response.items;
            if(results){
                results.forEach(function(element){
                    var title = element.snippet.title;
                    //cerchiamo su last fm
                    searchInLFMIT(title);
                });
            } else{
                $("#trending-italy").text("Nessun Trending Disponibile");
            }
        }
    };

    obj_request.open("get", trendingITURL);
    obj_request.send();
};

//TRENDING US

var searchInLFMUS = function (title) {
    var url_request = urlLF_search + title + "&api_key=2b75dcb291e2b0c9a2c994aca522ac14&format=json";
    var obj_request = new XMLHttpRequest();
    var info = [];
    obj_request.onreadystatechange = function (status) {
        if (this.status == 200 && this.readyState == 4) {
            var obr_response = JSON.parse(this.responseText);
            var results = obr_response.results.trackmatches.track;
            var nResults = obr_response.results["opensearch:totalResults"];
            if(nResults != "0" && results){
                if(results[0].image[2]["#text"] == "")
                    info = [results[0].name, results[0].artist, "https://i5.walmartimages.com/asr/f752abb3-1b49-4f99-b68a-7c4d77b45b40_1.39d6c524f6033c7c58bd073db1b99786.jpeg?odnHeight=450&odnWidth=450&odnBg=FFFFFF"];
                else info = [results[0].name, results[0].artist, results[0].image[2]["#text"]];
                nextsonglist.push(info);
                printTrendingSongUS(info);
            }
        }
    };

    if(title.length <= 55 ){
        obj_request.open("get", url_request);
        obj_request.send();
    }
};



var printTrendingSongUS = function (data) {
    var title = data[0];
    var artist = data[1];
    var img = data[2];
    var elem = "<li onclick='play(this, \"discover\")' class='d-inline-flex result-list hvr-glow album-element'>" +
        "<img class='album-cover' src=" + img + ">" +
        "<p class='song-title song-name'>" + title + "</p>" +
        "<p class='song-title song-artist'>" + artist +
        "</p><i class='fas fa-star preferiti' onclick='addToFavorites(this)'></i>" +
        "<i onclick='addToPlaylist(this)' class='fas fa-plus-circle preferiti' data-toggle=\"modal\" data-target=\"#myModalPlaylist\"></i></li>";
    $("#trending-world").append(elem);
};



var trendingUSA = function () {
    var trendingUSURL = "https://www.googleapis.com/youtube/v3/videos?part=snippet&key=AIzaSyABRZpUO0xIyDJ8EcVj89YV7HBdj5qsgQ8&chart=mostPopular&regionCode=us&videoCategoryId=10&maxResults=20";
    var obj_request = new XMLHttpRequest();

    obj_request.onreadystatechange = function (status) {
        if (this.status == 200 && this.readyState == 4) {
            var obr_response = JSON.parse(this.responseText);
            var results = obr_response.items;
            if(results){
                results.forEach(function(element){
                    var title = element.snippet.title;
                    searchInLFMUS(title);
                });
            } else{
                $("#trending-world").text("Nessun Trending Disponibile");
            }
        }
    };

    obj_request.open("get", trendingUSURL);
    obj_request.send();
};

$("#less").on("click", function () {
    $("#trending-italy").slideToggle("slow");
    if($("#less").attr("class") == "fas fa-chevron-up"){
        $("#less").removeClass("fa-chevron-up").addClass("fa-chevron-down");
    } else{
        $("#less").removeClass("fa-chevron-down").addClass("fa-chevron-up");
    }
});

$("#less2").on("click", function () {
    $("#trending-world").slideToggle("slow");
    if($("#less2").attr("class") == "fas fa-chevron-up"){
        $("#less2").removeClass("fa-chevron-up").addClass("fa-chevron-down");
    } else{
        $("#less2").removeClass("fa-chevron-down").addClass("fa-chevron-up");
    }
});

var categorySongSearch = function (category) {
    var url_request = "http://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=" + category +
    "&api_key=2b75dcb291e2b0c9a2c994aca522ac14&format=json";
    var obj_request = new XMLHttpRequest();

    obj_request.onreadystatechange = function (status) {
        if (this.status == 200 && this.readyState == 4) {
            var obr_response = JSON.parse(this.responseText);
            var results = obr_response.tracks.track;
            var info = [];
            if(results){
                results.forEach(function(element){
                    var title = element.name;
                    var artist = element.artist.name;
                    var img = element.image[2]["#text"];
                    info = [title, artist, img];
                    nextsonglist.push(info);
                    printForCategory(title, artist, img, category);
                });
            }
        }
    };

    obj_request.open("get", url_request);
    obj_request.send();
};

var printForCategory = function (title, artist, img, category) {
    var elem = "<li onclick='play(this, \"discover\")' class='d-inline-flex result-list hvr-glow album-element'>" +
        "<img class='album-cover' src=" + img + ">" +
        "<p class='song-title song-name'>" + title + "</p>" +
        "<p class='song-title song-artist'>" + artist +
        "</p><i class='fas fa-star preferiti' onclick='addToFavorites(this)'></i>" +
        "<i onclick='addToPlaylist(this)' class='fas fa-plus-circle preferiti' data-toggle=\"modal\" data-target=\"#myModalPlaylist\"></i></li>";
    switch (category){
        case "rock":
            $("#rock-song").append(elem);
            break;
        case "indie":
            $("#indie-song").append(elem);
            break;
        case "pop":
            $("#pop-song").append(elem);
            break;
        case "dance":
            $("#dance-song").append(elem);
            break;
        case "latina":
            $("#latina-song").append(elem);
            break;
    }
};

$("#rock-btn").on("click", function () {
    if($(".rock").attr("class") == "m-2 p-2 w-100 rock d-block"){
        $(".rock").removeClass("d-block").addClass("d-none");
    } else{
        $(".rock").removeClass("d-none").addClass("d-block");
        $(".indie").removeClass("d-block").addClass("d-none");
        $(".pop").removeClass("d-block").addClass("d-none");
        $(".dance").removeClass("d-block").addClass("d-none");
        $(".latina").removeClass("d-block").addClass("d-none");
        categorySongSearch("rock");
    }
});

$("#indie-btn").on("click", function () {
    if($(".indie").attr("class") == "m-2 p-2 w-100 indie d-block"){
        $(".indie").removeClass("d-block").addClass("d-none");
    } else{
        $(".rock").removeClass("d-block").addClass("d-none");
        $(".indie").removeClass("d-none").addClass("d-block");
        $(".pop").removeClass("d-block").addClass("d-none");
        $(".dance").removeClass("d-block").addClass("d-none");
        $(".latina").removeClass("d-block").addClass("d-none");
        categorySongSearch("indie");
    }
});

$("#pop-btn").on("click", function () {
    if($(".pop").attr("class") == "m-2 p-2 w-100 pop d-block"){
        $(".pop").removeClass("d-block").addClass("d-none");
    } else{
        $(".rock").removeClass("d-block").addClass("d-none");
        $(".indie").removeClass("d-block").addClass("d-none");
        $(".pop").removeClass("d-none").addClass("d-block");
        $(".dance").removeClass("d-block").addClass("d-none");
        $(".latina").removeClass("d-block").addClass("d-none");
        categorySongSearch("pop");
    }
});

$("#dance-btn").on("click", function () {
    if($(".dance").attr("class") == "m-2 p-2 w-100 dance d-block"){
        $(".dance").removeClass("d-block").addClass("d-none");
    }else{
        $(".rock").removeClass("d-block").addClass("d-none");
        $(".indie").removeClass("d-block").addClass("d-none");
        $(".pop").removeClass("d-block").addClass("d-none");
        $(".dance").removeClass("d-none").addClass("d-block");
        $(".latina").removeClass("d-block").addClass("d-none");
        categorySongSearch("dance");
    }

});

$("#latina-btn").on("click", function () {
    if($(".latina").attr("class") == "m-2 p-2 w-100 latina d-block"){
        $(".latina").removeClass("d-block").addClass("d-none");
    } else{
        $(".rock").removeClass("d-block").addClass("d-none");
        $(".indie").removeClass("d-block").addClass("d-none");
        $(".pop").removeClass("d-block").addClass("d-none");
        $(".dance").removeClass("d-block").addClass("d-none");
        $(".latina").removeClass("d-none").addClass("d-block");
        categorySongSearch("latina");
    }
});

//PLAY SONG
var counterFav = 0;
var counterDisc = 0;
var counterPlay = 0;
var play = function(data, zone){
    if(!starclicked){
        if(zone == "favorites"){
            favorites = true;
            discover = false;
            playlist = false;
            favPrevList.push(data);
            counterFav += 1;
            if(counterFav > 1 ){
                fav_next += 1;
                if(!prevFclicked) fav_prev = fav_next;
            }
        } else if(zone == "playlist"){
            playlist = true;
            discover = false;
            favorites = false;
            prevPlaylistList.push(data);
            counterPlay += 1;
            if(counterPlay > 1 ){
                play_next += 1;
                if(!prevPclicked) play_prev = play_next;
            }
        } else{
            discover = true;
            favorites = false;
            playlist = false;
            songprevlist.push(data);
            counterDisc += 1;
            if(counterDisc > 1 ){
                discover_next += 1;
                if(!prevDclicked) discover_prev = discover_next;
            }
        }
        var query = $(data).children(".song-artist").text() + " " + $(data).children(".song-name").text();
        searchsong = false;
        onPlayingSong = data;
        $(".mesh-title").text($(data).children(".song-name").text());
        $(".mesh-artist").text($(data).children(".song-artist").text());
        $("#cover").attr("src", $(data).children(".album-cover").attr("src"));
        $("#play").children("i").removeClass("fa fa-play").addClass("fa fa-pause");
        youtubeSongSearch(query);
        socket.emit("songListening", {
            song_artist : $(data).children(".song-artist").text(),
            song_title : $(data).children(".song-name").text()
        });
    }
    starclicked = false;
    prevFclicked = false;
    prevDclicked = false;
    prevPclicked = false;
};


var nextDiscoverSong = function(song, nextarr){
    var results = [];
    var title = $(song).children(".song-name").text();
    var artist = $(song).children(".song-artist").text();
    for(var i = 0; i < nextarr.length; i++){
        if((title == nextarr[i][0]) && (artist == nextarr[i][1])){
            if(i != nextarr.length-1){
                return results = [nextarr[i+1][0], nextarr[i+1][1], nextarr[i+1][2]];
            } else{
                results = [nextarr[0][0], nextarr[0][1], nextarr[0][2]];
            }
        }
    }
    return results;
};

var playNextDiscoverSong = function(song){
    var elem = "<li><img class='album-cover' src=" + song[2] + ">" +
        "<p class='song-title song-name'>" + song[0] + "</p>" +
        "<p class='song-title song-artist'>" + song[1] +
        "</p></li>";
    if(discover) play(elem, "discover");
    else if(favorites) play(elem, "favorites");
    else if(playlist) play(elem, "playlist");
};

