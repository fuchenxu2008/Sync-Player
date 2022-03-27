import React, { useRef, useEffect, useState } from 'react';
import './App.css';
import io from 'socket.io-client';

let socket = null;

function connectSocket() {
  socket = io();

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('connect_error', (err) => {
    console.log(`connect_error due to ${err.message}`);
  });
}

function listenPlayer(player) {
  // Play
  player.addEventListener('play', () => {
    socket.emit('play');
  });
  socket.on('play', () => {
    player.play();
  });

  // Pause
  player.addEventListener('pause', () => {
    socket.emit('pause');
  });
  socket.on('pause', () => {
    player.pause();
  });

  let seeking = false;
  // Seeked
  player.addEventListener('timeupdate', (event) => {
    if (seeking) {
      seeking = false;
      return;
    };
    socket.emit('seeked', player.currentTime);
  });
  socket.on('seeked', (playtime) => {
    if (Math.abs(playtime - player.currentTime) < 2) return;
    player.currentTime = playtime;
    seeking = true;
    player.play();
  });

  // 
  player.addEventListener('waiting', (event) => {
    console.log('Video is waiting for more data.');
  });
}

function App() {
  const vidRef = useRef(null);

  const [started, setStart] = useState(false);

  useEffect(() => {
    connectSocket();
    listenPlayer(vidRef.current);
  }, []);

  return (
    <div className="App">
      {!started && (
        <div style={styles.splashScreen}>
          <div style={styles.startBtn} onClick={() => setStart(true)}>Start</div>
        </div>
      )}
      <header className="App-header">
        <video ref={vidRef} controls width={700}>
          <source
            src="https://cdn.zhitiaox.com/static/Doctor.Who.S06E10.mp4"
            type="video/mp4"
          />
        </video>
      </header>
    </div>
  );
}

export default App;

const styles = {
  splashScreen: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startBtn: {
    color: 'white',
    backgroundColor: '#40bc96',
    padding: '10px 20px',
    fontSize: 25,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};
