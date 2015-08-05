/**
 * Created by louis on 05/08/2015.
 */

var app = require('http').createServer(handler),
    Tail = require('tail').Tail,
    io = require('socket.io')(app),
    files = require('./files.json'),
    tails = {},
    fs = require('fs');

app.listen(8082);

function handler(req, res) {
    var filename = '/index.html';

    if (req.url.indexOf('assets') === 1) {
        filename = req.url;
    }

    fs.readFile(__dirname + filename, function (err, data) {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading index.html');
        }

        res.writeHead(200);
        res.end(data);
    });
}

io.on('connection', function (socket) {
    socket.on('log', function (data) {
        var room = data.room;

        socket.join(room);
        if (typeof files[room] === 'object') {
            var file = files[room];

            var tail;
            if (typeof tails[room] === 'undefined') {
                tail = new Tail(file.path, '\n', { persistent: true, recursive: false });
                tail.on('line', function(data) {
                    if (data !== '\r') {
                        io.sockets.in(room).emit(room, { log: data });
                    }
                });

                tail.on('error', function(error) {
                    tails[room].unwatch();
                    delete tails[room];
                });

                tail.watch();
                tails[room] = tail;
            }
        }
    });
});
