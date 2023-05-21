import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

const SERVER_PORT = 3001;
const socket = io(`http://localhost:${SERVER_PORT}`); // signalling server socket.on('connection')

const ContextProvider = ({ children }) => {
  const [stream, setStream] = useState(null);
  const [me, setMe] = useState('');
  const [call, setCall] = useState({});
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState('');

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  // initialization, request camera & mic, and set the given stream to myVideo
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      .then((currentStream) => {
        setStream(currentStream);
        myVideo.current.srcObject = currentStream;
      });

    socket.on('me', (id) => {
      setMe(id);
      setName('Local: ' + id);
    })

    // signal
    socket.on('callUser', ({ from, name: callerName, signal }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });
  }, []);

  const answerCall = () => {
    setCallAccepted(true);

    const peerConnection = new RTCPeerConnection();

    peerConnection.ontrack = ({ streams: [currentStream] }) => {
      userVideo.current.srcObject = currentStream;
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('sendIceCandidate', {
          candidate: event.candidate,
          to: call.from,
        });
      }
    };

    socket.on('receiveIceCandidate', ({ candidate }) => {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    stream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, stream));

    peerConnection
      .setRemoteDescription(new RTCSessionDescription(call.signal))
      .then(() => {
        peerConnection
          .createAnswer()
          .then((answer) => {
            peerConnection.setLocalDescription(answer).then(() => {
              socket.emit('answerCall', {
                signal: peerConnection.localDescription,
                to: call.from,
              });
            });
          })
          .catch((error) => console.error('Error creating answer:', error));
      });
  };

  const callUser = (id) => {
    const peerConnection = new RTCPeerConnection();
    const dc = peerConnection.createDataChannel('channel')

    dc.onmessage = message => {
      console.log('Message from remote: ' + message.data)
    }

    dc.onopen = e => {
      console.log('datachannel opened!')
      dc.send('sup python peer')
    }

    stream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, stream));

    peerConnection.ontrack = ({ streams: [currentStream] }) => {
      console.log('track received')
      userVideo.current.srcObject = currentStream;
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('sendIceCandidate', {
          candidate: event.candidate,
          to: id,
        });
      }
    };

    socket.on('receiveIceCandidate', ({ candidate }) => {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    peerConnection
      .createOffer()
      .then((offer) => {
        peerConnection.setLocalDescription(offer).then(() => {
          console.log("js sdp: " + offer)
          socket.emit('callUser', {
            userToCall: id,
            signalData: peerConnection.localDescription,
            from: me,
            name,
          });
        });
      })
      .catch((error) => console.error('Error creating offer:', error));

    socket.on('callAccepted', ({ signal, id }) => {
      setCallAccepted(true);
      setCall({ name: `Remote: ${id}`}); 
      peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(signal)));
    });

    connectionRef.current = peerConnection;

  };

  const leaveCall = () => {
    setCallEnded(true);

    connectionRef.current.close();
    connectionRef.current = null;

    window.location.reload();
  };

  return (
    <SocketContext.Provider
      value={{
        call,
        callAccepted,
        myVideo,
        userVideo,
        stream,
        name,
        setName,
        callEnded,
        me,
        callUser,
        leaveCall,
        answerCall,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext };