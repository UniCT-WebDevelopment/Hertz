var YouTubeAPIKey = "AIzaSyABRZpUO0xIyDJ8EcVj89YV7HBdj5qsgQ8";
var lastFMAPIKey = "2b75dcb291e2b0c9a2c994aca522ac14";
var urlYT = "https://www.googleapis.com/youtube/v3/search?part=id,snippet&e=144&type=video&videoDefinition=any&maxResults=1&videoCategoryId=10" +
    "&videoEmbeddable=true&videoSyndicated=true&q=";
var urlLF_search = "http://ws.audioscrobbler.com/2.0/?method=track.search&track=";
var urlLF_getInfo = "http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=" + lastFMAPIKey;

var queryString = "";
var $search_input = document.getElementById("search-input");
var $search_btn = document.getElementById("btn-search");
var $result_container = document.getElementById("result-container");
var $video_window = document.getElementById("video-hidden-window");
var $on_playing = document.getElementById("play-song");
var $song_list = "";
var $panel, $panel_results, $top_albums, $top_albums2;
var player,
    time_update_interval = 0;
var volume = 20;
var value = 0;
var clickedOn = false;
var songPrevList = [];
var songList = []; var onPlayingSong = "";
var videoloaded = false; var prevSclicked = false; var bool = false;
var precPage = "";
var search = function(){
    songList = [];
    queryString = $search_input.value;
    $("#initial-screen").css("display", "none");
    $("#result-container").removeClass("d-block").removeClass("invalid-feedback").addClass("d-none");
    $("#discover").removeClass("d-block").addClass("d-none");
    $("#user-settings").removeClass("d-block").addClass("d-none");
    $("#playlist-page").removeClass("d-block").addClass("d-none");
    $("#favorites-page").removeClass("d-block").addClass("d-none");
    changescreen = true;
    if(queryString){
        $result_container.innerHTML = "<ul class='p-3' id='song-list'></ul>";
        $(".loader").removeClass("d-none").addClass("d-block");
        $song_list = document.getElementById("song-list");
        $("#play-song").removeClass("d-block").addClass("d-none");
        songSearch(queryString);
    } else{
        $("#result-container").removeClass("d-none").addClass("d-block").addClass("invalid-feedback");
        $result_container.innerHTML = "Please provide a song or an artist(group) to search";
    }
};

$search_btn.addEventListener("click", search);
$("#search-input").on("keypress", function (e) {
    if(e.which == 13) search();
});
var searchInfo =  function (name, artist) {
    var obj = {
        title: name,
        artist: artist,
        albumName: "",
        albumCover: ""
    };
    var url_request = urlLF_getInfo + "&artist=" + artist + "&track=" + name + "&format=json";
    var obj_request = new XMLHttpRequest();

    obj_request.onreadystatechange = function (status) {
        if (this.status == 200 && this.readyState == 4) {
            var obr_response = JSON.parse(this.responseText);
            var results = obr_response.track;
            if(results){
                var albumResults = obr_response.track.album;
                if(albumResults){
                    var title = albumResults.title;
                    var img = albumResults.image[2]["#text"];
                    var artist = albumResults.artist;
                    if(title != "") obj.albumName = title;
                    else obj.albumName = "none";
                    if(artist) obj.artist = artist;
                    if(img != "") obj.albumCover = img;
                    else obj.albumCover = "https://i5.walmartimages.com/asr/f752abb3-1b49-4f99-b68a-7c4d77b45b40_1.39d6c524f6033c7c58bd073db1b99786.jpeg?odnHeight=450&odnWidth=450&odnBg=FFFFFF";
                } else {
                    obj.albumName = "none";
                    obj.albumCover = "https://i5.walmartimages.com/asr/f752abb3-1b49-4f99-b68a-7c4d77b45b40_1.39d6c524f6033c7c58bd073db1b99786.jpeg?odnHeight=450&odnWidth=450&odnBg=FFFFFF"
                }
            } else{
                obj.albumName = "none";
                obj.albumCover = "https://i5.walmartimages.com/asr/f752abb3-1b49-4f99-b68a-7c4d77b45b40_1.39d6c524f6033c7c58bd073db1b99786.jpeg?odnHeight=450&odnWidth=450&odnBg=FFFFFF"
            }
        }
    };

    obj_request.addEventListener("load", function (ev) {
        printSongList(obj);
    });

    obj_request.open("get", url_request);
    obj_request.send();

};

var songSearch = function (title) {
    var url_request = urlLF_search + title + "&api_key=" + lastFMAPIKey + "&format=json";
    var obj_request = new XMLHttpRequest();

    obj_request.onreadystatechange = function (status) {
        if (this.status == 200 && this.readyState == 4) {
            var obr_response = JSON.parse(this.responseText);
            var results = obr_response.results.trackmatches.track;
            var nResults = obr_response.results["opensearch:totalResults"];
            if(nResults > 0){
                $(".loader").removeClass("d-block").addClass("d-none");
                $("#result-container").removeClass("d-none").addClass("d-block");
                $song_list.insertAdjacentHTML("beforebegin", "<h4 class=\"pl-4 pt-3\"> Risultati per: " + title + "</h4>");
                results.forEach(function (element) {
                    searchInfo(element.name, element.artist);
                });
            } else{
                $(".loader").removeClass("d-block").addClass("d-none");
                $("#result-container").removeClass("d-none").addClass("d-block");
                $result_container.innerHTML = "Nessun risultato trovato";
            }
        }
    };

    obj_request.open("get", url_request);
    obj_request.send();
};

//lista delle canzoni dalla query di ricerca
function printSongList(song){
    var elem = "<li onclick='playSong(this)' class=\"d-inline-flex result-list hvr-glow\">" +
            "<img class=\"album-cover\" src=" + song.albumCover + "\">" +
            "<p class='song-title song-name'>" + song.title + " </p>" +
            "<p class='song-title song-album'>"+ song.albumName + "</p>" +
            "<p class='song-title song-artist'>" + song.artist +
            "</p><i onclick='addToFavorites(this)' data-toggle='tooltip' title='Add to Favorites' class=\"fas fa-star preferiti\"></i>" +
            "<i onclick='addToPlaylist(this)' class='fas fa-plus-circle preferiti' data-toggle=\"modal\" data-target=\"#myModalPlaylist\"></i></li>";
    $song_list.innerHTML += elem;
}

//stampa la canzone in riproduzione
function printAlbumInfo(obj){
    var elem = "<div class=\"w-100 m-3\" id='onplay'><div class='d-inline-flex w-100'>" +
        "<p class='back w-100'><i onclick='goBack()' class=\"fas fa-chevron-circle-left\" id='changeBackFunction'></i></p>" +
        "<p class='pref w-100'><i onclick='addAlbumToPlaylist(this)' class='fas fa-plus-circle preferiti mr-2' style='font-size: 100%' data-toggle=\"modal\" data-target=\"#myModalPlaylist\"></i>" +
        "<i onclick='addAlbumSongToFav(this)' class=\"fas fa-star preferiti\" id='btn-fav'></i></p></div>" +
        "<div class='w-100 mt-2 d-md-inline-flex d-sm-block'>" +
        "<img id='album-cover' src='" + $(obj).children(".album-cover").attr("src") + "'>" +
        "<div class=\"d-block m-2\" id='song-info'>\n" +
        "<p id=\"artist-name\">" + $(obj).children(".song-artist").text() + "</p>" +
        "<p id=\"album-name\"><i class=\"material-icons\" style=\"font-size: smaller; color:#ff6b6b;\">album</i> "
        + $(obj).children(".song-album").text() + "</p>" +
        "<p id=\"song-title\"><i class=\"material-icons\" style=\"font-size: smaller; color:#ff6b6b;\">music_note</i> " +
        $(obj).children(".song-name").text()+ "</p>" +
        "</div></div>" +
        "<p class='w-100' style='text-align: center'><i class=\"fas fa-chevron-down expande-more\" onclick=\"loadAlbumSong()\"></i></p>" +
        "</div><div id='panel'><ul class='p-3' id='panel-results'></ul></div>" +
        "<div><h4 class='ml-3'>Altri Album: </h4><ul class='row flex col-md-12' id='top-album'></ul>" +
        "<div id='panel2'><ul class='row flex col-md-12' id='top-album-2'></ul></div> " +
        "<div style='width: 103%; text-align: center'><button class='btn btn-secondary btn-sm mb-2' onclick='loadAlbums()' id='btn-show-more'>" +
        "Show More</button></div></div>";
    onPlayingSong = obj;
    $on_playing.innerHTML = elem;
    $panel = document.getElementById("panel");
    $panel_results = document.getElementById("panel-results");
    $top_albums = document.getElementById("top-album");
    $top_albums2 = document.getElementById("top-album-2");
    searchAlbumSongs($(obj).children(".song-artist").text(), $(obj).children(".song-album").text());
    getTopAlbums($(obj).children(".song-artist").text(), $(obj).children(".song-album").text());
    clickedOn = false;
}

//chevron per espandere il div nascosto
function loadAlbumSong() {
    $("#panel").slideToggle("slow");
    $(".expande-more").toggleClass("fa-chevron-down fa-chevron-up");
}

//cerca canzoni appartenenti allo stesso album della canzone in riproduzione
function searchAlbumSongs(artist, title) {
    var url_request = "http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=" + lastFMAPIKey +
        "&artist=" + artist + "&album=" + title + "&format=json";
    var obj_request = new XMLHttpRequest();
    obj_request.onreadystatechange = function (status) {
        if (this.status == 200 && this.readyState == 4) {
            var obr_response = JSON.parse(this.responseText);
            var albuminfo = obr_response.album;
            if(albuminfo){
                var results = obr_response.album.tracks.track;
                if (results.length > 0) {
                    songList.push(albuminfo);
                    for(var i = 0; i < results.length; i++){
                        printAlbumSong(results[i], albuminfo);
                        if(i === 0 && clickedOn) { //se abbiamo cliccato su un album diverso
                            //avviamo la prima traccia dell'album e carichiamo la track list dell'album selezionato
                            var j = 0;
                            while(songList[j].name != title || j == songList.length){ j++; }
                            var firstSong = [songList[j].tracks.track[0], songList[j]];
                            playNextSong(firstSong);
                        }
                    }
                } else {
                    $panel.innerHTML = "Nessuna traccia disponibile";
                    //getTopAlbums(artist, title);
                }
            } else{
                $panel.innerHTML = "Nessuna traccia disponibile";
                //getTopAlbums(artist, title);
            }
        }
    };

    obj_request.open("get", url_request);
    obj_request.send();
}

//stampiamo le canzoni appartenenti allo stesso album della canzone riprodotta
function printAlbumSong(song, albuminfo){
    var elem = "<li onclick='playSong(this)' class=\"d-inline-flex result-list hvr-glow album-element\">" +
        "<img class=\"album-cover\" src=" + albuminfo.image[2]["#text"] + "\">" +
        "<p class='song-title song-name'>" + song.name + " </p>" +
        "<p class='song-title song-album'>"+ albuminfo.name + "</p>" +
        "<p class='song-title song-artist'>" + albuminfo.artist +
        "</p><i onclick='addToFavorites(this)' data-toggle='tooltip' title='Add to Favorites' class='fas fa-star preferiti'></i>" +
        "<i onclick='addToPlaylist(this)' class='fas fa-plus-circle preferiti' data-toggle=\"modal\" data-target=\"#myModalPlaylist\"></i></li>";
     $panel_results.innerHTML += elem;
}

//freccia per andare alla pagina precedente
function goBack() {
    $('#play-song').removeClass("d-block").addClass("d-none");
    $("#result-container").removeClass("d-none").addClass("d-block");
    $('#song-list').removeClass("d-none").addClass("d-block");
}
var counterS = 0;
var playSong = function(obj){
    if(!starclicked){
        counterS += 1;
        if(counterS > 1){
            next += 1;
            if(!prevSclicked) prev = next;
        }
        var queryString = $(obj).children(".song-artist").text() + " " + $(obj).children(".song-name").text();
        searchsong = true; discover = false; favorites = false;
        $("#song-list").addClass("d-none");
        $(".loader").removeClass("d-none").addClass("d-block");
        $(".mesh-title").text($(obj).children(".song-name").text());
        $(".mesh-artist").text($(obj).children(".song-artist").text());
        $("#cover").attr("src", $(obj).children(".album-cover").attr("src"));
        $("#play").children("i").removeClass("fa fa-play").addClass("fa fa-pause");
        songPrevList.push(obj);
        youtubeSongSearch(queryString);
        socket.emit("songListening", {
            song_artist : $(obj).children(".song-artist").text(),
            song_title : $(obj).children(".song-name").text()
        });
        $(".loader").removeClass("d-block").addClass("d-none");
        $("#result-container").removeClass("d-block").addClass("d-none");
        $("#play-song").removeClass("d-none").addClass("d-block");
        printAlbumInfo(obj);
    }
    starclicked = false;
    prevSclicked = false;
};


var youtubeSongSearch = function(q){
    var url_request = urlYT + q + "&key=" + YouTubeAPIKey;
    var obj_request = new XMLHttpRequest();

    obj_request.onreadystatechange = function (status) {
        if(this.status == 200 && this.readyState == 4){
            var obr_response = JSON.parse(this.responseText);
            var results = obr_response.items;
            var nResults = obr_response.pageInfo.totalResults;
            if(nResults > 0){
                var videoID = results[0].id.videoId;
                $video_window.innerHTML = "<div id='player'></div>";
                onYouTubeIframeAPIReady(videoID);
                videoloaded = true;
                slider2.disabled = false;
                slider.disabled = false;
            } else{
                $("#result-container").removeClass("d-none").addClass("d-block");
                $result_container.innerHTML = "Canzone non riproducibile";
                videoloaded = false;
            }
        }
    };
    obj_request.open("get", url_request);
    obj_request.send();
};

//PLAYER/////////////////////////////////////////////////////////////
function onYouTubeIframeAPIReady(id) {
    player = new YT.Player('player', {
            height: '1',
            width: '1',
            videoId: id,
            host: 'https://www.youtube.com',
            playerVars: { 'autoplay': 1, 'hd': 1},
            events: {
                onReady : initialize
            }
    });
}
//settaggio durata e currenttime della progress bar
function initialize(){
    updateTimerDisplay();
    updateProgressBar();
    player.setVolume(volume);
    var obj = Cookies.getJson("userSession");
    if(obj.autoLogin == true){
        $.post("/volume", {cookie: Cookies.getJson("userSession"), v: volume, message: "GET"}, function (data) {
            Cookies.set('userSession', { autoLogin: true, token: data.token, volume: data.v} , { expires: 60, path: '/' });
            player.setVolume(data.v);
        });
    }



    clearInterval(time_update_interval);
    // Start interval to update elapsed time display and
    // the elapsed part of the progress bar every second.
    time_update_interval = setInterval(function () {
        updateTimerDisplay();
        updateProgressBar();
        console.log(player.getCurrentTime());
        if(player.getCurrentTime() == player.getDuration()){
            var nxSong;
            if($("#play-song").attr("class") == "m-2 d-none"){
                bool = true;
            }
            if(searchsong && !discover && !favorites && !playlist){
                nxSong = nextSong(onPlayingSong);
                playNextSong(nxSong);
                if(bool){
                    $("#play-song").removeClass("d-block").addClass("d-none");
                    bool = false;
                }
            } else if(!searchsong && discover && !favorites && !playlist) {
                nxSong = nextDiscoverSong(onPlayingSong, nextsonglist);
                playNextDiscoverSong(nxSong);
            } else if(!discover && !searchsong && favorites && !playlist){
                nxSong = nextDiscoverSong(onPlayingSong, nextPlaylistSong);
                playNextDiscoverSong(nxSong);
            } else if(!discover && !searchsong && !favorites && playlist){
                nxSong = nextDiscoverSong(onPlayingSong, nextPlaylistSong);
                playNextDiscoverSong(nxSong);
            }
        }
    }, 1000)
}

// This function is called by initialize()
function updateTimerDisplay(){
    $('#current-time').text(formatTime( player.getCurrentTime() ));
    $('#duration').text(formatTime( player.getDuration()));
}

function formatTime(time){
    time = Math.round(time);
    var minutes = Math.floor(time / 60),
        seconds = time - minutes * 60;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    return minutes + ":" + seconds;
}

var slider2 = document.getElementById("progress-bar");
slider2.disabled = true;
slider2.oninput = function() {
    if(videoloaded){
        var val = this.value;
        $(".progressbar").css("width", val + "%");
    }
};


$('#progress-bar').on('mouseup touchend', function (e) {
    // Calculate the new time for the video.
    // new time in seconds = total duration in seconds * ( value of range input / 100 )
    if(videoloaded){
        var newTime = player.getDuration() * (e.target.value / 100);
        // Skip video to new time.
        player.seekTo(newTime);
        $('.progressbar').css("width", $('#progress-bar').val() + "%");
    }
});

function updateProgressBar() {
    // Update the value of our progress bar accordingly.
    $('#progress-bar').val(((player.getCurrentTime() / player.getDuration())) * 100);
    $('.progressbar').css("width", $('#progress-bar').val()  + "%");
}

//PLAY/PAUSE
$("#play").on("click", function () {
    if(videoloaded){
        var className = $('#play').children("i").attr('class');
        if(className == "fa fa-play"){
            player.playVideo();
            $("#play").children("i").removeClass("fa fa-play").addClass("fa fa-pause");
        } else{
            player.pauseVideo();
            $("#play").children("i").removeClass("fa fa-pause").addClass("fa fa-play");
        }
    }
});

//Volume
var slider = document.getElementById("myRange");
var icon_vol = document.getElementById("volume");
slider.disabled = true;
slider.oninput = function() {
    if(videoloaded){
        var val = this.value;
        if(val == 0) icon_vol.innerHTML = "<i class=\"fas fa-volume-off\"></i>";
        else if(val <= 50) icon_vol.innerHTML = "<i class=\"fas fa-volume-down\"></i>";
        else icon_vol.innerHTML = "<i class=\"fas fa-volume-up\"></i>"
        player.unMute().setVolume(val);
        volume = val;
        var obj = Cookies.getJson("userSession");
        if(obj.autoLogin == true){
            $.post("/volume", {cookie: Cookies.getJson("userSession"), v: volume, message: "UPDATE"}, function (data) {
                Cookies.set('userSession', { autoLogin: true, token: data.token, volume: volume} , { expires: 60, path: '/' });
            });
        }
        $(".progress-bar-volume").css("width", volume + "%");
    }
};

$("#volume").on("click", function(){
    if(videoloaded){
        if(player.isMuted()){
            player.unMute().setVolume(20);
            slider.value = 20;
            volume = 20;
            icon_vol.innerHTML = "<i class=\"fas fa-volume-up\"></i>";
            $(".progress-bar-volume").css("width", volume + "%");
        } else{
            player.mute();
            slider.value = 0;
            volume = 0;
            icon_vol.innerHTML = "<i class=\"fas fa-volume-off\"></i>";
            $(".progress-bar-volume").css("width", volume + "%");
        }
        var obj = Cookies.getJson("userSession");
        if(obj.autoLogin == true){
            $.post("/volume", {cookie: Cookies.getJson("userSession"), v: volume, message: "UPDATE"}, function (data) {
                Cookies.set('userSession', { autoLogin: true, token: data.token, volume: volume} , { expires: 60, path: '/' });
            });
        }
    }
});

//next song
var next = 0;
var prev = next;
var discover_next = 0;
var discover_prev = discover_next;
var fav_next = 0;
var fav_prev = 0;
var play_next = 0;
var play_prev = 0;
$("#forward").on("click", function(){
    var nxSong;
    if(videoloaded && searchsong && !discover && playlist && !favorites){
        if($("#play-song").attr("class") == "m-2 d-none") bool = true;
        nxSong = nextSong(onPlayingSong);
        playNextSong(nxSong);
        if(bool) {
            $("#play-song").removeClass("d-block").addClass("d-none");
            bool = false;
        }
    } else if(videoloaded && discover && !searchsong && !playlist && !favorites){
        nxSong = nextDiscoverSong(onPlayingSong, nextsonglist);
        playNextDiscoverSong(nxSong);
    } else if(videoloaded && !discover && !searchsong && !playlist && favorites){
        nxSong = nextDiscoverSong(onPlayingSong, nextFavSong);
        playNextDiscoverSong(nxSong);
    } else if(videoloaded && !discover && !searchsong && !favorites && playlist){
        nxSong = nextDiscoverSong(onPlayingSong, nextPlaylistSong);
        playNextDiscoverSong(nxSong);
    }
});

var nextSong = function(song){
    var results = [];
    for(var i = 0; i < songList.length; i++){
        if($(song).children(".song-album").text() == songList[i].name){
            var tracks = songList[i].tracks.track;
            for(var j = 0; j < tracks.length; j++){
                var str = $(song).children(".song-name").text();
                str = str.slice(0, -1);
                if(str == tracks[j].name){
                    if(j != tracks.length-1){
                        return results = [tracks[j+1], songList[i]];
                    }
                    else  {
                        return results = [songList[i+1].tracks.track[0], songList[i+1]];
                    }
                }
            }
        } else{
            results = [songList[0].tracks.track[0], songList[0]];
        }
    }
    return results;
};

var playNextSong = function(nxSong){
    var elem = "<li class=\"d-none\">" +
        "<img class=\"album-cover\" src=" + nxSong[1].image[2]["#text"] + "\">" +
        "<p class='song-title song-name'>" + nxSong[0].name + " </p>" +
        "<p class='song-title song-album'>"+ nxSong[1].name + "</p>" +
        "<p class='song-title song-artist'>" + nxSong[1].artist +
        "</p></i></li>";
    playSong(elem);
};

//prev song
$("#backward").on("click", function(){
    if(videoloaded && searchsong && !discover && !favorites && !playlist){
        if(prev > 0){
            prevSclicked = true;
            prev -= 1;
            if($("#play-song").attr("class") == "m-2 d-none") bool = true;
            playSong(songPrevList[prev]);
            if(bool){
                $("#play-song").removeClass("d-block").addClass("d-none");
                bool = false;
            }
        }
    }
    else if(videoloaded && discover && !searchsong &&!favorites && !playlist){
        if(discover_prev > 0){
            prevDclicked = true;
            discover_prev -= 1;
            play(songprevlist[discover_prev], "discover");
        }
    }
    else if(videoloaded && !discover && !searchsong && favorites && !playlist){
        if(fav_prev > 0){
            prevFclicked = true;
            fav_prev -=1;
            play(favPrevList[fav_prev], "favorites");
        }
    }
    else if(videoloaded && !discover && !searchsong && !favorites && playlist){
        if(play_prev > 0){
            prevPclicked = true;
            play_prev -=1;
            play(prevPlaylistList[play_prev], "playlist");
        }
    }
});


//stampa gli altri album dell'artista e li filtra in base per non dare errori
var counter = 0;
var checkTracks = function(artist, albumName, cover){
    var obj = {
        albumName: albumName,
        image: cover,
        artist: artist
    };
    var url_request = "http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=" + lastFMAPIKey +
        "&artist=" + obj.artist + "&album=" + obj.albumName + "&format=json";
    var obj_request = new XMLHttpRequest();
    obj_request.onreadystatechange = function () {
        if (this.status == 200 && this.readyState == 4) {
            var obr_response = JSON.parse(this.responseText);
            var results = obr_response.album;
            if (results) {
                var tracks = results.tracks.track;
                if(tracks.length != 0){
                    if(counter <= 3){
                        printTopAlbums(obj);
                    } else{
                       printTopAlbums2(obj);
                    }
                    counter += 1;
                    songList.push(results);
                }
            }
        }
    };
    obj_request.open("get", url_request);
    obj_request.send();

};

//gettopalbums
var getTopAlbums = function (artist, album) {
    var url_request = "http://ws.audioscrobbler.com/2.0/?method=artist.gettopalbums&artist=" + artist + "&api_key=" + lastFMAPIKey + "&format=json";
    var obj_request = new XMLHttpRequest();
    var cover = ""; counter = 0;
    obj_request.onreadystatechange = function (status) {
        if (this.status == 200 && this.readyState == 4) {
            var obr_response = JSON.parse(this.responseText);
            var results = obr_response.topalbums;
            if(results){
                var albums = results.album;
                if(albums.length > 0){
                    albums.forEach(function (element, index) {
                        if(albums[index].playcount >= 10000 && albums[index].name != album){
                            if(element.image[2]['#text']) cover = element.image[2]['#text'];
                            else cover = "https://i5.walmartimages.com/asr/f752abb3-1b49-4f99-b68a-7c4d77b45b40_1.39d6c524f6033c7c58bd073db1b99786.jpeg?odnHeight=450&odnWidth=450&odnBg=FFFFFF";
                            checkTracks(artist, element.name, cover);
                        }
                    });
                } else{
                    $("#result-container").removeClass("d-none").addClass("d-block");
                    $result_container.innerHTML = "Nessun album trovato";
                }
            } else{
                $("#result-container").removeClass("d-none").addClass("d-block");
                $result_container.innerHTML = "Nessun album trovato";
            }
        }
    };

    obj_request.open("get", url_request);
    obj_request.send();
};

var printTopAlbums = function(obj){
    $top_albums.innerHTML += "<li onclick='playAlbum(this)' class='col-md-3 d-block album-element text-center'>" +
        "<img src='" + obj.image + "' class='cover'><p class='d-none artist'>" +
        obj.artist + "</p><p class='album-name'>" +
        obj.albumName + "</p></li>";
};

var printTopAlbums2 = function(obj){
    $top_albums2.innerHTML += "<li onclick='playAlbum(this)' class='col-md-3 d-block album-element text-center'>" +
        "<img src='" + obj.image + "' class='cover'><p class='d-none artist'>" +
        obj.artist + "</p><p class='album-name'>" +
        obj.albumName + "</p></li>";
};

//modifica cosa si sta riproducendo al momento
var playAlbum = function(obj){
    $panel_results.innerHTML = "";
    $top_albums.innerHTML = " ";
    var artist = $(obj).children(".artist").text();
    var albumName = $(obj).children(".album-name").text();
    searchAlbumSongs(artist, albumName);
    clickedOn = true;
};
// carica altri album
var loadAlbums = function(){
    $("#panel2").slideToggle("slow");
    var text = $("#btn-show-more").text();
    $('#btn-show-more').text(
        text == "Show More" ? "Show Less" : "Show More");
};

//cerca l'album per la canzone ascoltata dall'utente
var playUserSong = function (obj) {
    var artist = $(obj).children(".user-information").children(".mesh-user-artist").text();
    var title = $(obj).children(".user-information").children(".mesh-user-title").text();
    if(artist != "" && title != ""){
        var img = "";
        var albumName = "";
        if(title[title.length - 1] == " ") title = title.slice(0, -1);
        var url_request = urlLF_getInfo + "&artist=" + artist + "&track=" + title + "&format=json";
        var obj_request = new XMLHttpRequest();

        obj_request.onreadystatechange = function (status) {
            if (this.status == 200 && this.readyState == 4) {
                var obr_response = JSON.parse(this.responseText);
                var results = obr_response.track;
                if(results){
                    var albumResults = obr_response.track.album;
                    if(albumResults){
                        if(albumResults.title != "") albumName = albumResults.title;
                        else albumName = "none";
                        if(albumResults.image[2]["#text"] != "") img = albumResults.image[2]["#text"];
                        else img = "https://i5.walmartimages.com/asr/f752abb3-1b49-4f99-b68a-7c4d77b45b40_1.39d6c524f6033c7c58bd073db1b99786.jpeg?odnHeight=450&odnWidth=450&odnBg=FFFFFF";
                    } else {
                        albumName = "none";
                        img = "https://i5.walmartimages.com/asr/f752abb3-1b49-4f99-b68a-7c4d77b45b40_1.39d6c524f6033c7c58bd073db1b99786.jpeg?odnHeight=450&odnWidth=450&odnBg=FFFFFF"
                    }
                } else{
                    albumName = "none";
                    img = "https://i5.walmartimages.com/asr/f752abb3-1b49-4f99-b68a-7c4d77b45b40_1.39d6c524f6033c7c58bd073db1b99786.jpeg?odnHeight=450&odnWidth=450&odnBg=FFFFFF"
                }
            }
        };

        obj_request.addEventListener("load", function (ev) {
            playOnlineUserSong(title, artist, albumName, img);
        });

        obj_request.open("get", url_request);
        obj_request.send();
    }
};

var playOnlineUserSong = function(title, artist, album, cover){
    var elem = "<li class=\"d-none\">" +
        "<img class=\"album-cover\" src=" + cover + "\">" +
        "<p class='song-title song-name'>" + title + "</p>" +
        "<p class='song-title song-album'>"+ album + "</p>" +
        "<p class='song-title song-artist'>" + artist +
        "</p></i></li>";
    playSong(elem);
    $("#discover").removeClass("d-block").addClass("d-none");
    $("#user-settings").removeClass("d-block").addClass("d-none");
    $("#playlist-page").removeClass("d-block").addClass("d-none");
    $("#favorites-page").removeClass("d-block").addClass("d-none");
    $("#changeBackFunction").attr("onclick", "goBack2(precPage)");
};

var goBack2 = function (page) {
    switch (page){
        case "Discover":
            precPage = "Discover";
            $("#result-container").removeClass("d-block").addClass("d-none");
            $("#play-song").removeClass("d-block").addClass("d-none");
            $("#discover").removeClass("d-none").addClass("d-block");
            $("#user-settings").removeClass("d-block").addClass("d-none");
            $("#playlist-page").removeClass("d-block").addClass("d-none");
            $("#favorites-page").removeClass("d-block").addClass("d-none");
            changescreen = true;
            break;
        case "Favorite":
            precPage = "Favorite";
            $("#result-container").removeClass("d-block").addClass("d-none");
            $("#play-song").removeClass("d-block").addClass("d-none");
            $("#discover").removeClass("d-block").addClass("d-none");
            $("#user-settings").removeClass("d-block").addClass("d-none");
            $("#playlist-page").removeClass("d-block").addClass("d-none");
            $("#favorites-page").removeClass("d-none").addClass("d-block");
            changescreen = true;
            nextFavSong = [];
            socket.emit("returnmyfavorites");
            break;
        case "Playlist":
            precPage = "Playlist";
            $("#result-container").removeClass("d-block").addClass("d-none");
            $("#play-song").removeClass("d-block").addClass("d-none");
            $("#discover").removeClass("d-block").addClass("d-none");
            $("#user-settings").removeClass("d-block").addClass("d-none");
            $("#playlist-page").removeClass("d-none").addClass("d-block");
            $("#favorites-page").removeClass("d-block").addClass("d-none");
            nextPlaylistSong = [];
            changescreen = true;
            socket.emit("printAllPlaylist", {username: $("#username").text()});
            break;
        case "Settings":
            if(changescreen){
                $("#alert-settings").removeClass("d-block").addClass("d-none").text("");
                changescreen = false;
            }
            precPage = "Settings";
            $("#result-container").removeClass("d-block").addClass("d-none");
            $("#play-song").removeClass("d-block").addClass("d-none");
            $("#discover").removeClass("d-block").addClass("d-none");
            $("#user-settings").removeClass("d-none").addClass("d-block");
            $("#playlist-page").removeClass("d-block").addClass("d-none");
            $("#favorites-page").removeClass("d-block").addClass("d-none");
            break;
    }
};








