// Make connection
//http://172.20.10.2:3000
var url_request = window.location;
var port = 80;
var socket;

//Register Event
var $username = document.getElementById("username");
var $password = document.getElementById("passwordInput");
var $repeatPassword = document.getElementById("repeatPassword");
var $loginPassword = document.getElementById("passwordinput");
var $loginUsername = document.getElementById("usernameinput");
var matching = false;
var matchingUsername = false;
var userLogged = false;
var changescreen = false;
var starclicked = false;
var nextFavSong = [];
var nextPlaylistSong = [];
var prevFclicked = false; var prevDclicked = false; var prevPclicked = false;
var alsoSong = false;
$(document).ready( function(){
    $("#repeatPassword, #passwordInput").on("keyup", function () {
        if($password.value != "" && $repeatPassword.value != ""){
            if($password.value != $repeatPassword.value){
                $("#repeatPassword").removeClass("is-valid").addClass("is-invalid");
                $("#repeat-password").removeClass("d-none valid-feedback").addClass("d-block invalid-feedback").text("Incorrect Password");
                matching = false;
            } else{
                $("#repeatPassword").removeClass("is-invalid").addClass("is-valid");
                $("#repeat-password").removeClass("invalid-feedback").addClass("valid-feedback").text("Correct Password");
                matching = true;
            }
        }
    });

    $("#username").on("keyup", function () {
        $.post("/username", {input: $("#username").val()}, function (data) {
            if(data.message == "EXIST"){
                $("#username").removeClass("is-valid").addClass("is-invalid");
                $("#choose-username").removeClass("d-none valid-feedback").addClass("d-block invalid-feedback").text("This username already exists");
                matchingUsername = false;
            } else{
                $("#username").removeClass("is-invalid").addClass("is-valid");
                $("#choose-username").removeClass("invalid-feedback").addClass("valid-feedback").text("Valid Username");
                matchingUsername = true;
            }
        });
    });

    $("#passwordInput").on("keyup", function () {
        if(!checkPassword($password.value)){
            $("#passwordInput").addClass("is-invalid");
            $("#choose-password").removeClass("d-none valid-feedback").addClass("d-block invalid-feedback").text("Your password must be 8-20 character long, contain letters and numbers," +
                " and must not contain spaces or special characters.");
            $("#passwordHelpBlock").addClass("d-none");
        } else{
            $("#passwordInput").removeClass("is-invalid").addClass("is-valid");
            $("#choose-password").removeClass("d-none invalid-feedback").addClass("d-block valid-feedback").text("Safe Password");
            $("#passwordHelpBlock").addClass("d-none");
        }
    });

    $("#registration-btn").on("click", function () {
        if(checkingData() && matching && !toobig && matchingUsername){
            var img = "";
            if(imageloaded != "") img = imageloaded;
            $.post("/register", { username: $username.value, password: $password.value,
                profileImg: img} , function(data){
                if(data.message == "BAD"){
                    $("#alert-register").removeClass("d-none alert-success").addClass("d-block alert-danger").text("Something went wrong!");
                } else{
                    var url = window.location.href;
                    var pos = url.indexOf("register.html");
                    window.location.href = url.substring(0, pos);
                }
            });
        }
    });

    var checkingData = function () {
        if($username.value == ""){
            $("#username").addClass("is-invalid");
            $("#choose-username").removeClass("d-none").addClass("d-block").text("Please choose an Username");
            return false;
        }
        if($password.value == ""){
            $("#passwordInput").removeClass("is-valid").addClass("is-invalid");
            $("#choose-password").removeClass("valid-feedback d-none").addClass("invalid-feedback d-block").text("Please choose a password.");
            $("#passwordHelpBlock").addClass("d-none");
            return false;
        } else if(checkPassword($password.value) == false){
            $("#passwordInput").addClass("is-invalid");
            $("#choose-password").removeClass("d-none valid-feedback").addClass("d-block invalid-feedback").text("Your password must be 8-20 character long, contain letters and numbers," +
                " and must not contain spaces or special characters.");
            $("#passwordHelpBlock").addClass("d-none");
            return false;
        } else{
            $("#passwordInput").removeClass("is-invalid").addClass("is-valid");
            $("#choose-password").removeClass("d-none invalid-feedback").addClass("d-block valid-feedback").text("Safe Password");
            $("#passwordHelpBlock").addClass("d-none");
        }
        if($repeatPassword.value == ""){
            $("#repeatPassword").removeClass("is-valid").addClass("is-invalid");
            $("#repeat-password").removeClass("d-none valid-feedback").addClass("d-block invalid-feedback").text("Please repeat your password");
            return false;
        }
        return true;
    };
//check della password
    var checkPassword = function(password){
        var format = /[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
        if(password.length < 8 || password.length > 20 || password.match(format)) return false;
        else{
            for(var i = 0; i < password.length; i++){
                if(password[i] == " ") return false;
            }
        }
        return true;
    };

    var imageloaded = "";
    var toobig = false;
// Caricamento ed anteprima immagine del profilo
    function previewProfileImage( uploader ) {
        //ensure a file was selected
        if (uploader.files && uploader.files[0]) {
            var imageFile = uploader.files[0];
            var fileSize = imageFile.size;
            if(fileSize <= 800000){
                var reader = new FileReader();
                reader.onload = function (e) {
                    //set the image data as source
                    var value = "url('" + e.target.result + "')";
                    imageloaded = e.target.result;
                    $('.profile-pic').css('background-image', value);
                    toobig = false;
                    $("#ImageHelpBlock").addClass("d-none");
                    $("#choose-profilepic").removeClass("d-none invalid-feedback").addClass("d-block valid-feedback").text("The chosen pic respects image size restriction!");
                };
                reader.readAsDataURL( imageFile );
            } else {
                $("#ImageHelpBlock").addClass("d-none");
                $("#choose-profilepic").removeClass("d-none valid-feedback").addClass("d-block invalid-feedback").text("The chosen pic is too big, please choose another!");
                toobig = true;
            }
        }
    }

    $("#profileImage").change(function(){
        previewProfileImage( this );
    });

// Login Form
    Cookies.getJson = function (cookieName) {
        return JSON.parse(Cookies.get(cookieName));
    };
    //console.log(Cookies.get("userSession"));
    if(Cookies.get("userSession") != undefined){
        var obj = Cookies.getJson("userSession");
        //console.log(Cookies.getJson("userSession"));
        if(obj.autoLogin == true){
            var token = obj.token;
            $.post("/login", {token: token}, function (data) {
                if(data.message == "OK"){
                    loginSuccess(data.username, data.img, data.id);
                    Cookies.set('userSession', { autoLogin: true, token: data.t, volume: data.v } , { expires: 60, path: '/' });
                    $.post("/", {cookie: Cookies.getJson("userSession"), d: 60, message: "UPDATE"});
                    $(".progress-bar-volume").css("width", data.v + "%");
                    $("#myRange").attr("value", data.v);
                    if(data.v == 0) icon_vol.innerHTML = "<i class=\"fas fa-volume-off\"></i>";
                } else if(data.message == "NO-TOKEN" || data.message == "TOKEN-SCADUTO"){
                    console.log(data.message);
                    console.log("Token scaduto o non esistente");
                }
            });
        }
    }

    var userLogin = function () {
        if($loginUsername.value == ""){
            $("#usernameinput").addClass("is-invalid");
            $("#invalid-username").removeClass("d-none").addClass("d-block").text("Please insert your Username");
        }
        else if($loginPassword.value == ""){
            $("#usernameinput").removeClass("is-invalid");
            $("#invalid-username").removeClass("d-block").addClass("d-none");
            $("#passwordinput").addClass("is-invalid");
            $("#invalid-password").removeClass("d-none").addClass("d-block").text(" Please insert your password.");
        }
        else{
            $("#usernameinput").removeClass("is-invalid");
            $("#invalid-username").removeClass("d-block").addClass("d-none");
            $("#passwordinput").removeClass("is-invalid");
            $("#invalid-password").removeClass("d-block").addClass("d-none");

            $.post("/login", {username: $loginUsername.value, password: $loginPassword.value, session_var: $('#exampleCheck1:checked').val()
            }, function(data){
                if(data.message == "OK"){
                    loginSuccess(data.username, data.img, data.id);
                    $('#myModal1').modal('toggle');
                    Cookies.set('userSession', { autoLogin: ($('#exampleCheck1:checked').val() ? true : false), token: data.token, volume: data.v } , { expires: 60, path: '/' });
                    $.post("/", {cookie: Cookies.getJson("userSession"), d: 60});
                } else if(data.message == "SERVER_ERR") {
                    $("#alert").removeClass("alert-success d-none").addClass("alert-danger d-block").text("Server Error, Retry Again");
                    userLogged = false;
                } else if(data.message == "USER_PASS_ERR"){
                    $("#usernameinput").removeClass("is-valid").addClass("is-invalid");
                    $("#passwordinput").removeClass("is-valid").addClass("is-invalid");
                    $("#alert").removeClass("alert-success d-none").addClass("alert-danger d-block").text("Wrong Username or Password, retry again!");
                    userLogged = false;
                }
            });
        }
    };

    var loginSuccess = function (username, img, id) {
        initSocket();
        userLogged = true;
        $(".alert-warning").removeClass("d-block").addClass("d-none");
        $("#btn-search").removeAttr("disabled");
        $("#search-input").removeAttr("readonly");
        $("#alert").removeClass("alert-danger d-none").addClass("alert-success d-block").text("You're successfully logged in!");
        $("#usernameinput").removeClass("is-invalid").addClass("is-valid");
        $("#invalid-username").removeClass("d-none").addClass("d-block").text("");
        $("#passwordinput").removeClass("is-invalid").addClass("is-valid");
        $("#invalid-password").removeClass("d-none").addClass("d-block").text("");
        $("#btn-signin").attr("data-toggle", "dropdown").removeAttr("data-target");
        $("#username").text(username);
        $("#initial-screen").addClass("d-none");
        $("#discover").removeClass("d-none").addClass("d-block");
        if(img == "" || img == "undefined"){
            $(".profile-pic").css("background-image", "url('assets/img/user-circle.svg')");
        } else{
            $(".profile-pic").css("background-image", "url('" + img + "')");
        }
        precPage = "Discover";
        trendingItaly();
        trendingUSA();
        socket.emit("login-ok", {username: username, img: img, id: id});
    };

    var initSocket = function () {
        socket = io.connect();

        socket.on("user_disconnected", function(data) {
            var users = document.querySelectorAll(".friend-box");
            users.forEach(function (element) {
                if($(element).children(".user-information").children(".mesh-username").text() == data.username){
                    $(element).remove();
                }
            });
        });

        socket.on("users_list", function(data) {
            if(userLogged){
                data.users.forEach(function(obj) {
                    addUser(obj.username, obj.artist, obj.song);
                    var img = "url('" + obj.img + "')";
                    profileImg(obj, img);
                });
            }
        });

        socket.on("user_logged", function(data) {
            if(userLogged){
                addUser(data.username, data.artist, data.song);
                var img = "url('" + data.img + "')";
                profileImg(data, img);
            }
        });

        socket.on("someoneislistening", function (data) {
            var users = document.querySelectorAll(".friend-box");
            users.forEach(function (element) {
                var obj = $(element).children(".user-information");
                if($(obj).children(".mesh-username").text() == data.username){
                    $(obj).children(".mesh-user-artist").text(data.artist);
                    $(obj).children(".mesh-user-title").text(data.song);
                }
            });
        });

        socket.on("printFavorites", function (data) {
            if(data.songList.length == 0) {$("#favorites").html("<p class='m-3' style='font-size: 1.3vw' id='error-message'>Start to add your Favorite music!</p>")}
            if(data.songList.length != 0) {$("#favorites").text("")}
            data.songList.forEach(function (element) {
                var elem = $("<li class='d-inline-flex result-list hvr-glow album-element'>" +
                    "<img class='album-cover' src=" + element.Image + ">" +
                    "<p class='song-title song-name'>" + element.Title + "</p>" +
                    "<p class='song-title song-artist'>" + element.Artist +
                    "</p><i class='fas fa-minus preferiti' onclick='removeFromFavorites(this)'></i></li>");

                $("#favorites").append(elem);
                $(elem).on("click",function(){play(elem, "favorites")})
                nextFavSong.push([element.Title, element.Artist, element.Image]);
            });
        });

        socket.on("delete-success", function (data) {
            $(data.obj).remove();
            nextFavSong.forEach(function (value, index, arr) {
                if(value[0] == data.title && value[1] == data.artist){
                    arr.splice(index, 1);
                }
            });
            favPrevList.forEach(function (value, index, arr) {
                if($(value).children(".song-name").text() == data.title && $(value).children(".song-artist").text() == data.artist){
                    arr.splice(index, 1);
                    fav_prev -= 1;
                }
            });
        });

        socket.on("delete_success", function () {
            var str = url_request.href;
            str = str.substring(0, str.length - 1);
            window.location.href = str;
        });

        socket.on("update-success", function(data){
            if(data.message == "SUCCESS"){
                $("#old-password-check").removeClass("d-block").addClass("d-none").text("");
                $("#alert-settings").removeClass("d-none").addClass("d-block").text("Your changes have been saved successfully!");
                //aggiorna per me per gli altri

                var img = "url('" + data.new_Img + "')";
                if(data.new_username != "" && data.new_Img != ""){
                    $("#username").text(data.new_username);
                    $(".profile-pic").css("background-image", img);
                } else if(data.new_Img != ""){
                    $(".profile-pic").css("background-image", img);
                } else if(data.new_username != ""){
                    $("#username").text(data.new_username);
                }
            } else if(data.message == "NO_CORRECT_PASS"){
                $("#alert-settings").removeClass("d-block").addClass("d-none");
                $("#old-password-check").removeClass("d-none").addClass("d-block").text("Your old Password is not correct!");
            }
        });

        socket.on("user_change_settings", function (data) {
            var users = document.querySelectorAll(".friend-box");
            users.forEach(function (element) {
                var obj = $(element).children(".user-information");
                if($(obj).children(".mesh-username").text() == data.who){
                    var img = "url('" + data.img + "')";
                    if(data.username != "" && data.img != ""){
                        $(obj).children(".mesh-username").text(data.username);
                        $(element).children(".user-pic").css("background-image", img);
                    } else if(data.img != ""){
                        $(element).children(".user-pic").css("background-image", img);
                    } else if(data.username != ""){
                        $(obj).children(".mesh-username").text(data.username);
                    }
                }
            });
        });

        socket.on("printUserPlaylist", function (data) {
            $("#playlistList").text("");
            var elem = "";
            data.playlists.forEach(function (element) {
                elem += "<div class='d-inline-flex w-100'>" +
                    "<h5 class='playlist-title' onclick='display(this)'>" + element.Name +"</h5>" +
                    "<i onclick='removePlaylist(this)' class=\"fas fa-times mt-1 ml-3\"></i></div>" +
                    "<hr style='margin-left: 0'><ul class=\"p-0 mr-4 d-none\">";
                var json = JSON.parse(element.Tracks);
                var tracks = json.songs;
                if(tracks){
                    tracks.forEach(function (value) {
                        elem += "<li onclick='play(this, \"playlist\")' class='d-inline-flex result-list hvr-glow album-element'>" +
                            "<img class='album-cover' src=" + value.img + ">" +
                            "<p class='song-title song-name'>" + value.name + "</p>" +
                            "<p class='song-title song-artist'>" + value.artist +
                            "</p><i class='fas fa-minus preferiti' onclick='removeFromPlaylist(this)'></i></li>";
                        nextPlaylistSong.push([value.name, value.artist, value.img]);
                    });
                }
                elem += "</ul>";
            });
            $("#playlistList").append(elem);
        });


        socket.on("playlistNameList", function (data) {
            $("#modalPlaylist").text("");
            data.Names.forEach(function (element) {
                var elem = "<li onclick='getPlaylistName(this)' class='modalPlaylistElement' data-dismiss='modal'>" + element.Name + "</li>";
                $("#modalPlaylist").append(elem);
            });
        });

        socket.on("added", function () {
           starclicked = false;
        });

        socket.on("adding-success", function () {
            $("#playlistList").text("");
            socket.emit("printAllPlaylist", {username: $("#username").text()});
        });

        socket.on("delete-playlist-success", function (data) {
            $(data.obj).remove();
            nextPlaylistSong.forEach(function (value, index, arr) {
                if(value[0] == data.title && value[1] == data.artist){
                    arr.splice(index, 1);
                }
            });
            prevPlaylistList.forEach(function (value, index, arr) {
                if($(value).children(".song-name").text() == data.title && $(value).children(".song-artist").text() == data.artist){
                    play_prev -= 1;
                    arr.splice(index, 1);
                }
            });
        });
    };



    $("#btn-login").on("click", userLogin);
    $(".modal-body").on("keypress", function (e) {
        if(e.which == 13) userLogin();
    });

//Logout

    $("#logout").on("click", function () {
        $.post("/logout", {cookie: Cookies.getJson("userSession")}, function () {
            Cookies.remove('userSession', { path: '/' }); // removed!
        });
        socket.emit("logout", {username: $("#username").text()});
        userLogged = false;
        var str = url_request.href;
        str = str.substring(0, str.length - 1);
        window.location.href = str;
    });



//Online Users
    var addUser = function (username, artist, song) {
        var elem = "<li onclick='playUserSong(this)' class=\"nav-item w-100 hvr-forward d-inline-flex friend-box\">" +
            "<div class=\"rounded-circle user-pic ml-3\"></div>" +
            "<div class=\"d-block ml-3 user-information\">" +
            "<p class='mesh-username d-inline'>"+ username +"</p><i class='fas fa-headphones' style='color: #ff6b6b; font-size: 1.3vw;" +
            "position:sticky; margin-left: 10px;'></i>" +
            "<p class='mesh-user-artist'>"+ artist +"</p>" +
            "<p class='mesh-user-title'>" + song +"</p>" +
            "</div>" +
            "</li>";
        $("#online-user").append(elem);
    };

    var profileImg = function(data, img){
        var users = document.querySelectorAll(".friend-box");
        users.forEach(function (element) {
            if($(element).children(".user-information").children(".mesh-username").text() == data.username){
                if(img != "url('')") $(element).children(".user-pic").css("background-image", img);
                else $(element).children(".user-pic").css("background-image", "url('assets/img/user-circle.svg')");
            }
        });
    };

//Left Buttons
    $("#on-playing").on("click", function () {
        if(userLogged){
            if(videoloaded){
                if(discover){
                    $('#play-song').removeClass("d-block").addClass("d-none");
                    $("#discover").removeClass("d-none").addClass("d-block");
                    $("#user-settings").removeClass("d-block").addClass("d-none");
                    $("#playlist-page").removeClass("d-block").addClass("d-none");
                    $("#favorites-page").removeClass("d-block").addClass("d-none");
                    changescreen = true;
                }
                else if(searchsong){
                    $('#play-song').removeClass("d-none").addClass("d-block");
                    $("#result-container").removeClass("d-block").addClass("d-none");
                    $('#song-list').removeClass("d-block").addClass("d-none");
                    $("#discover").removeClass("d-block").addClass("d-none");
                    $("#user-settings").removeClass("d-block").addClass("d-none");
                    $("#playlist-page").removeClass("d-block").addClass("d-none");
                    $("#favorites-page").removeClass("d-block").addClass("d-none");
                    changescreen = true;
                }
                else if(favorites){
                    $('#play-song').removeClass("d-block").addClass("d-none");
                    $("#discover").removeClass("d-block").addClass("d-none");
                    $("#user-settings").removeClass("d-block").addClass("d-none");
                    $("#playlist-page").removeClass("d-block").addClass("d-none");
                    $("#favorites-page").removeClass("d-none").addClass("d-block");
                    changescreen = true;
                }
                else if(playlist){
                    $('#play-song').removeClass("d-block").addClass("d-none");
                    $("#discover").removeClass("d-block").addClass("d-none");
                    $("#user-settings").removeClass("d-block").addClass("d-none");
                    $("#playlist-page").removeClass("d-none").addClass("d-block");
                    $("#favorites-page").removeClass("d-block").addClass("d-none");
                    changescreen = true;
                }
            }
        } else{
            $(".alert-warning").removeClass("d-none").addClass("d-block");
        }
    });

//Discover Page

    $("#discover-page").on("click", function () {
        if(userLogged){
            precPage = "Discover";
            $("#result-container").removeClass("d-block").addClass("d-none");
            $("#play-song").removeClass("d-block").addClass("d-none");
            $("#discover").removeClass("d-none").addClass("d-block");
            $("#user-settings").removeClass("d-block").addClass("d-none");
            $("#playlist-page").removeClass("d-block").addClass("d-none");
            $("#favorites-page").removeClass("d-block").addClass("d-none");
            changescreen = true;
        } else{
            $(".alert-warning").removeClass("d-none").addClass("d-block");
        }
    });


//Favorites PAGE

    $("#user-favorites").on("click", function () {
        if(userLogged){
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
        } else{
            $(".alert-warning").removeClass("d-none").addClass("d-block");
        }
    });

//PLAYLIST PAGE
    $("#user-playlist").on("click", function () {
        if(userLogged){
            precPage = "Playlist";
            $("#result-container").removeClass("d-block").addClass("d-none");
            $("#play-song").removeClass("d-block").addClass("d-none");
            $("#discover").removeClass("d-block").addClass("d-none");
            $("#user-settings").removeClass("d-block").addClass("d-none");
            $("#playlist-page").removeClass("d-none").addClass("d-block");
            $("#favorites-page").removeClass("d-block").addClass("d-none");
            changescreen = true;
            nextPlaylistSong = [];
            socket.emit("printAllPlaylist", {username: $("#username").text()});
        } else{
            $(".alert-warning").removeClass("d-none").addClass("d-block");
        }
    });



//PROFILE SETTINGS FUNCTIONS

    $("#user-setting").on("click", function () {
        if(userLogged){
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
        } else{
            $(".alert-warning").removeClass("d-none").addClass("d-block");
        }
    });

    $("#profile-settings").on("click", function () {
        $("#result-container").removeClass("d-block").addClass("d-none");
        $("#play-song").removeClass("d-block").addClass("d-none");
        $("#discover").removeClass("d-block").addClass("d-none");
        $("#user-settings").removeClass("d-none").addClass("d-block");
        $("#playlist-page").removeClass("d-block").addClass("d-none");
        $("#favorites-page").removeClass("d-block").addClass("d-none");
        $("#change-username").attr("value", $("#username").text());
    });

    $("#settings-btn").on("click", function () {
        var newUsername = "";
        var newPassword = "";
        var oldPassword = "";
        if($("#change-username").val() != "") newUsername = $("#change-username").val();
        if($("#old-password").val() != "") oldPassword = $("#old-password").val();
        if($("#new-password").val() != "") newPassword = $("#new-password").val();
        if(newPassword != "" && checkPassword(newPassword)){
            if(oldPassword == ""){
                $("#alert-settings").removeClass("d-block").addClass("d-none");
                $("#old-password-check").removeClass("d-none").addClass("d-block").text("You must fill this camp to change your password!");
            } else{
                socket.emit("change-user-settings", {
                    new_username: newUsername,
                    old_password: oldPassword,
                    new_password: newPassword,
                    new_img: imageloaded
                });
            }
        } else if(newPassword == ""){
            socket.emit("change-user-settings", {
                new_username: newUsername,
                old_password: oldPassword,
                new_password: newPassword,
                new_img: imageloaded
            });
        } else{
            $("#passwordHelpBlock").addClass("d-none");
            $("#new-password-check").removeClass("d-none").addClass("d-block").text("Password too short or with special characters!");
        }
    });

    $("#btn-delete").on("click", function () {
        socket.emit("delete_account", {user: $("#username").text()});
    });

    $("#nav-input").on("click", function () {
        if(!userLogged){
            $(".alert-warning").removeClass("d-none").addClass("d-block");
        }
    });

    //PLAYLIST PAGE FUNCTION
    $("#btn-newplaylist").on("click", function () {
        $("#playlistInput").val("");
        $("#modal-title").text("Add Playlist");
        $("#playlist-div").removeClass("d-block").addClass("d-none");
        $("#modalPlaylist").text("");
    });

    $("#btn-save-name").on("click", function(){
        var playlistName = $("#playlistInput").val();
        if(!alsoSong) socket.emit("new-playlist", {name: playlistName, username: $("#username").text(), message: "NO-SONG"});
        else socket.emit("new-playlist", {name: playlistName, username: $("#username").text(), message: "SONG", song: songPlaylistObj});
        alsoSong = false;
    });
});

var addAlbumSongToFav = function (obj) {
    var elem = $(obj).parent().parent().next();
    var title = $(elem).children("#song-info").children("#song-title").text() ;
    var artist = $(elem).children("#song-info").children("#artist-name").text();
    var img = $(elem).children("#album-cover").attr("src");
    $(obj).css("color", "#ff6b6b");
    starclicked = true;
    title = title.slice(11);
    socket.emit("addtofavorites", {
        title: title,
        artist: artist,
        img: img
    });
};

var addToFavorites = function (obj) {
    var element = $(obj).parent();
    var title = $(element).children(".song-name").text();
    var artist = $(element).children(".song-artist").text();
    var img = $(element).children(".album-cover").attr("src");
    $(obj).css("color", "#ff6b6b");
    starclicked = true;
    socket.emit("addtofavorites", {
        title: title,
        artist: artist,
        img: img
    });
};

var removeFromFavorites = function (obj) {
    var element = $(obj).parent();
    $(element).attr("onclick", "");
    $(element).removeClass("d-inline-flex").addClass("d-none");
    var title = $(element).children(".song-name").text();
    var artist = $(element).children(".song-artist").text();
    socket.emit("removefromfavorites", {
        title: title,
        artist: artist,
        obj: element //ogg da rimuovere
    });
};
var playlistName;
var songPlaylistObj = {
    title: "",
    artist: "",
    img: ""
};

var getPlaylistName = function (obj) {
    playlistName = $(obj).text();
    socket.emit("add-song-playlist", {name: playlistName, username: $("#username").text(), song: songPlaylistObj});
    alsoSong = false;
};

var addAlbumToPlaylist = function (obj) {
    $("#playlistInput").val("");
    $(obj).css("color", "#ff6b6b");
    var elem = $(obj).parent().parent().next();
    var title = $(elem).children("#song-info").children("#song-title").text() ;
    title = title.slice(11);
    songPlaylistObj.title = title;
    songPlaylistObj.artist = $(elem).children("#song-info").children("#artist-name").text();
    songPlaylistObj.img = $(elem).children("#album-cover").attr("src");
    $("#modal-title").text("Add to a Playlist");
    $("#playlist-div").removeClass("d-none").addClass("d-block");
    starclicked = true; alsoSong = true;
    socket.emit("getPlaylist", {username: $("#username").text()});
};

var addToPlaylist = function (obj) {
    $("#playlistInput").val("");
    var element = $(obj).parent();
    songPlaylistObj.title = $(element).children(".song-name").text();
    songPlaylistObj.artist = $(element).children(".song-artist").text();
    songPlaylistObj.img = $(element).children(".album-cover").attr("src");
    $("#modal-title").text("Add to a Playlist");
    $("#playlist-div").removeClass("d-none").addClass("d-block");
    starclicked = true; alsoSong = true;
    socket.emit("getPlaylist", {username: $("#username").text()});
};

var display = function (obj) {
    if($(obj).parent().next().next().attr("class") == "p-0 mr-4 d-none")
        $(obj).parent().next().next().removeClass("d-none").addClass("d-block");
    else
        $(obj).parent().next().next().removeClass("d-block").addClass("d-none");
};

var removeFromPlaylist = function (obj) {
    var element = $(obj).parent();
    $(element).attr("onclick", "");
    $(element).removeClass("d-inline-flex").addClass("d-none");
    var title = $(element).children(".song-name").text();
    var artist = $(element).children(".song-artist").text();
    socket.emit("removefromplaylists", {
        title: title,
        artist: artist,
        obj: element, //ogg da rimuovere
        name: $(element).parent().prev().prev().text()
    });
};

var removePlaylist = function (obj) {
  var name = $(obj).prev().text();
  var element = $(obj).parent();
  socket.emit("removeplaylist", {name: name, username: $("#username").text()});
  $(element).next().remove();
  $(element).next().remove();
  $(element).remove();
};




