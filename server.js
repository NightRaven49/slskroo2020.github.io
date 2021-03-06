// server.js

require('dotenv').config();

const express = require('express')
, app = express()
, server = require('http').createServer(app)
, port = process.env.PORT || 3000
, path = require('path')
, socketio = require('socket.io')
, mysql = require('mysql')
, pool = mysql.createPool({
	host : process.env.MYSQLHOST,
	user : process.env.MYSQLUSER,
	password : process.env.MYSQLPASS,
	database : process.env.MYSQLDB,
    charset : 'utf8mb4_unicode_ci',
    port : process.env.MYSQLPORT
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/*', function (req, res) {
    res.sendFile('index.html', {root: path.join(__dirname, 'public')});
})

server.listen(port, function(){
    console.log (`Server listening on port ${port}.`);
});

socketio.listen(server).on('connection', function (socket) {
    console.log(`Got a connection on socket: ${socket}.`);

    socket.on('reqIG', function(targetIG) {
        console.log(`Retrieving IG data for ${targetIG}`);
        pool.getConnection(function(err, connection){
            if (err) throw err;
            var igDetails = [];
            var imagesVideos = [];
            var socialMedia = [];
            connection.query(`SELECT * FROM ig_details WHERE name='${targetIG}'`, function (err, result1) {
                if (err) throw err;
                if (result1.length < 1) {
                    socket.emit('retIG', "empty");
                    console.log(`Step 1 Failed: IG does not exist.`);
                    connection.release();
                } else {
                    igDetails = result1;
                    console.log(`Step 1 Success`);
                    connection.query(`SELECT * FROM images_videos WHERE name='${targetIG}'`, function (err, result2) {
                        if (err) throw err;
                        imagesVideos = result2;
                        console.log(`Step 2 Success`);
                        connection.query(`SELECT * FROM social_media WHERE name='${targetIG}'`, function (err, result3) {
                            if (err) throw err;
                            socialMedia = result3;
                            console.log(`Step 3 Success`);
                            socket.emit('retIG', {ig: igDetails, img: imagesVideos, sm: socialMedia});
                            connection.release();
                        });
                    });
                };
            });
        });
    })
    
    socket.on('disconnect', function(){
        console.log(`Socket: ${socket} disconnected.`);
    });
});