const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3001'
})
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream)

//   myPeer.on('call', call => {
//     call.answer(stream)
//     const video = document.createElement('video')
//     call.on('stream', userVideoStream => {
//       addVideoStream(video, userVideoStream)
//     })
//   })

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
  })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

// Set up the peer on 'call' event before getting user media stream
myPeer.on('call', call => {
    console.log(`Incoming call from ${call.peer}`);
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        call.answer(stream); // Answer the call with the local stream
        const video = document.createElement('video');
        
        // Handle the remote user's video stream
        call.on('stream', userVideoStream => {
          console.log(`Received stream from ${call.peer}`);
          addVideoStream(video, userVideoStream); // Show the remote user's video stream
        });
  
        // Handle peer closing the connection (cleanup)
        call.on('close', () => {
          console.log(`User ${call.peer} disconnected`);
          video.remove();
        });
      })
      .catch(err => {
        console.error('Error getting user media:', err);
      });
  });
  

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}