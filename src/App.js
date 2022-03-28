import React, { useRef, useEffect, useState } from 'react';
import './App.css';
import io from 'socket.io-client';
import { v1 } from 'uuid';

let socket = null;
const userId = v1();

function connectSocket() {
  // socket = io.connect('http://192.168.86.33:6800/', { query: `userId=${userId}` });
  socket = io('https://manager.zhitiaox.com', { query: `userId=${userId}` });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('connect_error', (err) => {
    console.log(`connect_error due to ${err.message}`);
  });
}

function listenPlayer(player) {
  let syncing = false;
  let waiting = true;

  // Play
  player.addEventListener('play', () => {
    if (waiting || syncing) return;
    socket.emit('play');
  });
  socket.on('play', () => {
    player.play();
  });

  // Pause
  player.addEventListener('pause', () => {
    if (syncing) return;
    socket.emit('pause');
  });
  socket.on('pause', () => {
    player.pause();
  });

  // Seeked
  player.addEventListener('seeked', (event) => {
    // 如果是来自同步则忽略
    if (syncing) {
      syncing = false;
      return;
    }
    socket.emit('seeked', player.currentTime);
    // 等待其他设备
    waiting = true;
    // 先一起暂停，等待其他设备加载进度
    player.pause();
    console.log('paused');
  });
  // 接收到其他设备的进度 => 同步进度
  socket.on('seeked', (playtime) => {
    player.currentTime = playtime;
    // 防止同步进度再次触发seeked event
    syncing = true;
  });

  // 同步进度后，可以播放了
  player.addEventListener('canplay', () => {
    if (waiting) {
      waiting = false;
      return;
    }
    setTimeout(() => {
      player.play();
      console.log('canplay play');
    }, 150);
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
          <div style={styles.startBtn} onClick={() => setStart(true)}>
            Start
          </div>
        </div>
      )}
      <header className="App-header">
        <video ref={vidRef} controls width="50%" autoPlay>
          <source
            // src={`http://192.168.86.33:6800/video?userId=${userId}`}
            src={`/video?userId=${userId}`}
            // src="https://cdn.zhitiaox.com/static/Doctor.Who.S06E10.mp4"
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
