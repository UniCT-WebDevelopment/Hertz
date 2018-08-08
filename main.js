var express = require('express');
var socket = require("socket.io");
var mysql = require("mysql");
var passwordHash = require('password-hash');
var bodyParser = require("body-parser");
var session = require("express-session");
//App setup
var port = 80;
var app = express();
var server = app.listen(port, function () {
    console.log('Hertz webserver is listening on port 80!');
});
//Socket setup
var io = socket(server);
var sessionMiddleware = session({
    secret: "hertzsecretkey"
});
io.use(function (socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

app.use(sessionMiddleware);


app.use('/', express.static('public'));
var urlencodedParser = bodyParser.urlencoded({ extended: false });

//DB setup
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hertzdb'
});

connection.connect(function(error){
  if(error){
    throw error;
  } else{
    console.log('Connected to HertzDB');
  }
});

app.post("/register", urlencodedParser ,function (req, res) {
    if (!req.body) return res.sendStatus(400);
    var hashedPassword = passwordHash.generate(req.body.password);
    var record = {Username: req.body.username, Password: hashedPassword, Image: req.body.profileImg};
    var sql = "INSERT INTO users SET ?";
    connection.query(sql, record, function (err) {
        if(err) {
            res.send({message: "BAD"});
            throw err;
        }
        else{
            console.log("record added");
            res.send({message: "OK"});
        }
    });
});

app.post("/username", urlencodedParser, function (req, res) {
   connection.query("SELECT Username FROM users WHERE Username = ?", req.body.input, function (err, result) {
       if(err) console.log(err);
       else{
           if(result != 0) res.send({message: "EXIST"});
           else res.send({message: "NOEXISTS"});
       }
   })
});

app.post("/login", urlencodedParser, function (req, res) {
   if(!req.body) return res.sendStatus(400);
   else{
       if(req.body.token){
           //se il token esiste
           connection.query("SELECT * FROM sessions WHERE Token = ?", req.body.token, function (err, row) {
               if(err) console.log(err);
               else{//console.log(row);
                   if(row.length != 0){
                       var idUser = row[0].ID_Utente;
                       var volume = row[0].Volume;
                       var expireDate = new Date();
                       expireDate.setTime(expireDate.getTime() + (row[0].Expire * 24 * 60 * 60 * 1000));
                       var actualDate = new Date();
                       //console.log(actualDate);
                       //console.log(expireDate);
                       if(expireDate > actualDate){
                           connection.query("SELECT Username, Image FROM users WHERE ID = ?", idUser, function (err, results) {
                               var str = idUser + results[0].Username;
                               var newToken = passwordHash.generate(str);
                               req.session.user = {id: idUser, username: results[0].Username, volume: volume};
                               res.send({message: "OK", username: results[0].Username, img: results[0].Image, id: idUser, t: newToken, v: volume});
                               console.log(results[0].Username ,"si è collegato");
                           });
                       } else{
                           res.send({message: "TOKEN-SCADUTO"});
                       }

                   } else{
                       res.send({message: "NO-TOKEN"});
                   }
               }
           });
       } else{
           var input_username = req.body.username;
           var input_password = req.body.password;
           var session = req.body.session_var;
           connection.query("SELECT * FROM users WHERE Username = ?", input_username, function(err, row){
               if(err){
                   console.log(err);
                   res.send({message: "SERVER_ERR"})
               } else{
                   if(row.length != 0){
                       var check = false;
                       var token = "";
                       if(passwordHash.verify(input_password, row[0].Password)){
                           if(session){
                               req.session.user = {id: row[0].ID, username: row[0].Username, volume: 20};
                               var str = row[0].ID + row[0].Username;
                               token = passwordHash.generate(str);
                               //console.log(token);
                           }
                           res.send({message: "OK", username: row[0].Username, img: row[0].Image, id: row[0].ID, token: token, v: 20});
                           check = true;
                           console.log(row[0].Username ,"si è collegato");
                       }
                       if(!check) res.send({message: "USER_PASS_ERR"});
                   } else{
                       res.send({message: "USER_PASS_ERR"});
                   }
               }
           });
       }
   }
});

app.get("/session", urlencodedParser, function (req, res) {
    res.send(req.session? req.session.user : false);
});

app.post("/", urlencodedParser, function (req, res) {
    var saveCookie = req.body["cookie[autoLogin]"];
    //console.log(saveCookie);
    if(saveCookie != "false"){
        var token = req.body["cookie[token]"];
        var record = {ID_Utente: req.session.user.id, Expire: req.body.d, Token: token, Volume: 20};
        if(req.body.message == "UPDATE"){
            connection.query("UPDATE sessions SET Token = ?, Expire = ? WHERE ID_Utente = ?", [token, req.body.d, req.session.user.id], function (err) {
               if(err) console.log(err);
               //else console.log("token updated");
            });

        } else{
            var sql = "INSERT INTO sessions SET ?";
            connection.query(sql, record, function(err){
                if(err) console.log(err);
            });
        }
    }
});

app.post("/logout", urlencodedParser, function (req, res) {
   var token = req.body["cookie[token]"];
   connection.query("DELETE FROM sessions WHERE Token = ? AND ID_Utente = ?", [token, req.session.user.id], function (err) {
       if(err) console.log(err);
       else{
           res.send("DELETED-TOKEN");
           req.session.destroy();
       }
   });
});

app.post("/volume", urlencodedParser, function (req, res) {
   var token = req.body["cookie[token]"];
   if(req.body.message == "UPDATE"){
       connection.query("UPDATE sessions SET Volume = ? WHERE Token = ?", [req.body.v, token], function (err) {
           if(err) console.log(err);
       });
   } else if(req.body.message == "GET"){
       connection.query("SELECT Volume FROM sessions WHERE Token = ?", token, function (err, result) {
          if(err) console.log(err);
          else res.send({token: token, v: result[0].Volume});
       });
   }

});

var users_logged = [];

io.on('connection', function(socket){

  socket.on("login-ok", function (data) {
      socket.username = data.username;
      socket.emit("users_list",{users:users_logged});
      var user = {username: data.username, img: data.img, song: "", artist: ""};
      users_logged.push(user);
      socket.broadcast.emit("user_logged",{username: data.username, img: data.img, song: "", artist: ""});
  });

  socket.on("disconnect", function () {
      users_logged.forEach(function (value, index, arr) {
          if(value.username == socket.username){
              arr.splice(index, 1);
          }
      });
      socket.broadcast.emit("user_disconnected",{username: socket.username});
      console.log(socket.username, "si e'disconnesso!");
  });

  socket.on("logout", function(data){
      users_logged.forEach(function (value, index, arr) {
          if(value.username == data.username){
              arr.splice(index, 1);
          }
      });
      socket.broadcast.emit("user_disconnected",{username: data.username});
  });

  socket.on("songListening", function (data) {
      users_logged.forEach(function (element) {
          if(element.username == socket.username){
              element.song = data.song_title;
              element.artist = data.song_artist;
          }
      });
     socket.broadcast.emit("someoneislistening", {username: socket.username, song: data.song_title, artist: data.song_artist});
  });


  socket.on("delete_account", function (data) {
      connection.query("DELETE FROM users WHERE Username = ?", data.user, function (err) {
          if(err) console.log(err);
          else {
              console.log(data.user, "ELIMINATO!");
              socket.emit("delete_success");
          }
      });
  });


  socket.on("change-user-settings", function (data) {
      var newUsername = data.new_username;
      var newPassword = data.new_password; var oldPassword = data.old_password;
      var newImg = data.new_img;
      connection.query("SELECT * FROM users WHERE Username = ?", socket.username, function(err, rows){
          if(err) console.log(err);
          else {
              if (newUsername != "" && newPassword != "" && newImg != "") {
                  if (passwordHash.verify(oldPassword, rows[0].Password) && newImg != rows[0].Image) {
                      var hashedPassword = passwordHash.generate(newPassword);
                      connection.query('UPDATE users SET Username = ?, Password = ?, Image = ? WHERE ID = ?', [newUsername, hashedPassword, newImg, rows[0].ID], function (error) {
                          if (error) console.log(error);
                          else {
                              socket.emit("update-success", {
                                  message: "SUCCESS",
                                  new_username: newUsername,
                                  new_Img: newImg
                              });
                              socket.username = newUsername;
                              socket.broadcast.emit("user_change_settings", {
                                  who: rows[0].Username,
                                  username: newUsername,
                                  img: newImg
                              });
                              users_logged.forEach(function (value, index, arr) {
                                  if (value.username == rows[0].Username) {
                                      arr[index].username = newUsername;
                                      arr[index].img = newImg;
                                  }
                              });
                          }
                      });
                  } else {
                      socket.emit("update-success", {
                          message: "NO_CORRECT_PASS", new_username: "",
                          new_Img: ""
                      });
                  }
              } else if (newUsername != "" || newPassword != "" || newImg != rows[0].Image) {
                  if (newUsername != "") {
                      connection.query('UPDATE users SET Username = ? WHERE ID = ?', [newUsername, rows[0].ID], function (error) {
                          if (error) console.log(error);
                          else {
                              socket.emit("update-success", {
                                  message: "SUCCESS",
                                  new_username: newUsername,
                                  new_Img: rows[0].Image
                              });
                              socket.username = newUsername;
                              socket.broadcast.emit("user_change_settings", {
                                  who: rows[0].Username,
                                  username: newUsername,
                                  img: newImg
                              });
                              users_logged.forEach(function (value, index, arr) {
                                  if (value.username == rows[0].Username) {
                                      arr[index].username = newUsername;
                                      arr[index].img = newImg;
                                  }
                              });
                          }
                      });
                  }
                  if (newPassword != "") {
                      if (passwordHash.verify(oldPassword, rows[0].Password)) {
                          var hashedPassword = passwordHash.generate(newPassword);
                          connection.query('UPDATE users SET Password = ? WHERE ID = ?', [hashedPassword, rows[0].ID], function (error) {
                              if (error) console.log(error);
                              else socket.emit("update-success", {message: "SUCCESS", new_username: "", new_Img: ""});
                          });
                      } else if (!passwordHash.verify(oldPassword, rows[0].Password)) {
                          socket.emit("update-success", {message: "NO_CORRECT_PASS", new_username: "", new_Img: ""});
                      }
                  }
                  if (newImg != "" && newImg != rows[0].Image) {
                      connection.query('UPDATE users SET Image = ? WHERE ID = ?', [newImg, rows[0].ID], function (error) {
                          if (error) console.log(error);
                          else {
                              socket.emit("update-success", {message: "SUCCESS", new_username: "", new_Img: newImg});
                              socket.broadcast.emit("user_change_settings", {
                                  who: rows[0].Username,
                                  username: newUsername,
                                  img: newImg
                              });
                              users_logged.forEach(function (value, index, arr) {
                                  if (value.username == element.Username) {
                                      arr[index].img = newImg;
                                  }
                              });
                          }
                      });
                  }
              }
          }
      });
  });

  socket.on("addtofavorites", function (data) {
      var findSong = false;
      connection.query("SELECT ID FROM users WHERE Username = ?", socket.username, function (err, row) {
          if(err) console.log(err);
          else{
              var ID_utente = row[0].ID;
              connection.query("SELECT * FROM favorites WHERE ID_user = ?", ID_utente, function (err, row2) {
                 if(err) console.log(err);
                 else{
                     row2.forEach(function (value) {
                        if(ID_utente == value.ID_user && value.Title == data.title && value.Artist == data.artist) findSong = true;
                     });
                     if(!findSong){
                         var record = {ID_user: ID_utente, Title: data.title, Artist: data.artist, Image: data.img};
                         var sql = "INSERT INTO favorites SET ?";
                         connection.query(sql, record, function (err) {
                             if(err) console.log(err);
                             else socket.emit("added");
                         });
                     }
                 }
              });
          }
      })
  });

  socket.on("returnmyfavorites", function () {
      connection.query("SELECT ID FROM users WHERE Username = ?", socket.username, function (err, row) {
          if (err) console.log(err);
          else {
              var ID_utente = row[0].ID;
              connection.query("SELECT * FROM favorites WHERE ID_user = ?", ID_utente, function (err, row) {
                 if(err) console.log(err);
                 else{
                     socket.emit("printFavorites", {songList: row});
                 }
              });
          }
      });
  });

  socket.on("removefromfavorites", function (data) {
      connection.query("SELECT ID FROM users WHERE Username = ?", socket.username, function (err, row) {
          if (err) console.log(err);
          else {
              var ID_utente = row[0].ID;
              connection.query("DELETE FROM favorites WHERE ID_user = ? && Title = ? && Artist = ?", [ID_utente, data.title, data.artist] , function (err) {
                  if(err) console.log(err);
                  else{
                      socket.emit("delete-success", {obj: data.obj, title: data.title, artist: data.artist});
                  }
              });
          }
      });
  });

  socket.on("printAllPlaylist", function (data) {
      connection.query("SELECT ID FROM users WHERE Username = ?", data.username, function (err, result) {
         if(err) console.log(err);
         else {
             connection.query("SELECT * FROM playlist WHERE Playlist_User = ?", result[0].ID, function (err, rows) {
                if(err) console.log(err);
                else {
                    socket.emit("printUserPlaylist", {playlists: rows});
                }
             });
         }
      });
  });

  socket.on("getPlaylist", function (data) {
      connection.query("SELECT ID FROM users WHERE Username = ?", data.username, function (err, result) {
          if(err) console.log(err);
          else {
              connection.query("SELECT Name FROM playlist WHERE Playlist_User = ?", result[0].ID, function (err, rows) {
                  if(err) console.log(err);
                  else {
                      socket.emit("playlistNameList", {Names: rows});
                  }
              });
          }
      });
  });

  socket.on("new-playlist", function (data) {
      connection.query("SELECT ID FROM users WHERE Username = ?", data.username, function (err, result) {
          if(err) console.log(err);
          else{
              var record = "";
              var text = '{"songs" : []}';
              var jsonObj = JSON.parse(text);
              if(data.message == "SONG"){
                  jsonObj.songs[0] = {name: data.song.title, artist: data.song.artist, img: data.song.img};
                  text = JSON.stringify(jsonObj);
                  record = {Playlist_User: result[0].ID, Name: data.name, Tracks: text };
              } else{
                  record = {Playlist_User: result[0].ID, Name: data.name, Tracks: '{"songs" : []}'};
              }
              var sql = "INSERT INTO playlist SET ?";
              connection.query(sql, record, function (err) {
                  if(err) console.log(err);
                  else{
                      socket.emit("adding-success");
                  }
              });
          }
      });
  });

  socket.on("add-song-playlist", function (data) {
      connection.query("SELECT ID FROM users WHERE Username = ?", data.username, function (err, result) {
          if(err) console.log(err);
          else{
              connection.query("SELECT Tracks FROM playlist WHERE Playlist_User = ? AND Name = ?", [result[0].ID, data.name], function (err, row) {
                  var json = JSON.parse(row[0].Tracks);
                  var val = {name: data.song.title, artist: data.song.artist, img: data.song.img};
                  json.songs.push(val);
                  json = JSON.stringify(json);
                  connection.query("UPDATE playlist SET Tracks = ? WHERE Playlist_User = ? AND Name = ?", [json, result[0].ID, data.name], function (err) {
                      if(err) console.log(err);
                      else socket.emit("added");
                  });
              });
          }
      })
  });

  socket.on("removefromplaylists", function (data) {
      connection.query("SELECT ID FROM users WHERE Username = ?", socket.username, function (err, row) {
          if (err) console.log(err);
          else {
              connection.query("SELECT Tracks FROM playlist WHERE Playlist_User = ? AND Name = ?", [row[0].ID, data.name] , function (err, results) {
                  if(err) console.log(err);
                  else{
                      var json = JSON.parse(results[0].Tracks);
                      var tracks = json.songs;
                      if(tracks){
                          if(tracks.length > 0){
                              tracks.forEach(function (value, index, arr) {
                                  if(value.name == data.title && value.artist == data.artist) {
                                      arr.splice(index, 1);
                                  }
                              });
                              tracks = {songs: tracks};
                              tracks = JSON.stringify(tracks);
                          }
                      } else{
                          tracks = {songs: []};
                          tracks = JSON.stringify(tracks);
                      }
                      connection.query("UPDATE playlist SET Tracks = ? WHERE Playlist_User = ? AND Name = ?", [tracks, row[0].ID, data.name], function (err) {
                          if(err) console.log(err);
                          else socket.emit("delete-playlist-success", {obj: data.obj, title: data.title, artist: data.artist});
                      });
                  }
              });
          }
      });
  });

  socket.on("removeplaylist", function (data) {
     connection.query("SELECT ID FROM users WHERE Username = ?", data.username, function (err, result) {
         if(err) console.log(err);
         else{
             connection.query("DELETE FROM playlist WHERE Playlist_User = ? && Name = ?", [result[0].ID, data.name], function (err) {
                 if(err) console.log(err);
             });
         }
     });
  });
});
