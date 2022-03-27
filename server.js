const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const cors = require('cors');

const app = express();
const io = socketio();

app.set('port', 6800);

const server = http.createServer(app);

app.use(cors());

app.use(express.static(path.join(__dirname + '/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/build/index.html'));
});

io.attach(server);

io.on('connection', socket => {
  try {
    // Remove previous listeners to prevent duplicate
    socket.removeAllListeners();
    // Handle connection
    console.log(`New connection: ${socket.id}`);
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Disconnected: ${socket.id}`);
    });
    // handle player events
    playerController(socket);
  } catch (err) {
    console.log('Socket error: ', err);
  }
});

server.listen(6800, () => {
  console.log('Server started on port 6800');
});

function playerController(socket) {
  socket.on('play', () => {
    socket.broadcast.emit('play');
    console.log('play');
  });
  socket.on('pause', () => {
    socket.broadcast.emit('pause');
    console.log('pause');
  });
  socket.on('seeked', (playtime) => {
    socket.broadcast.emit('seeked', playtime);
    console.log('seeked ', playtime);
  });
}