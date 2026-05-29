import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { Badge, Box, Button, IconButton, Paper, TextField, Typography } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ChatIcon from '@mui/icons-material/Chat';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import styles from '../styles/VideoMeet.module.css';
import server from '../environment';

const server_url = server;

const RemoteVideo = ({ stream }) => {
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (remoteVideoRef.current && stream) {
      remoteVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  return <video ref={remoteVideoRef} className={styles.remoteVideo} autoPlay playsInline controls={false} />;
};

export default function VideoMeetComponent() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const roomUrl = `${window.location.origin}/meeting/${meetingId}`;

  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});

  const [remoteStreams, setRemoteStreams] = useState([]);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [participantCount, setParticipantCount] = useState(1);
  const [guestLink, setGuestLink] = useState(roomUrl);

  // Fetch server IP and create shareable link
  useEffect(() => {
    const fetchServerInfo = async () => {
      try {
        const response = await fetch(`${server_url}/api/v1/server-info`);
        const data = await response.json();
        const ipBasedUrl = `http://${data.ip}:3000/meeting/${meetingId}`;
        setGuestLink(ipBasedUrl);
      } catch (error) {
        console.log('Using localhost link:', error.message);
        setGuestLink(roomUrl);
      }
    };
    
    fetchServerInfo();
  }, [meetingId, roomUrl]);

  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        cameraStreamRef.current = stream;
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        window.localStream = stream;
        setConnected(true);
      } catch (error) {
        console.error('Media error:', error);
        setConnected(false);
      }
    };

    initMedia();
    const currentVideoNode = localVideoRef.current;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      if (currentVideoNode?.srcObject) {
        currentVideoNode.srcObject.getTracks().forEach(track => track.stop());
      }

      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
      }

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!connected || !meetingId) return;
    if (socketRef.current) return;

    const socket = io(server_url, {
      transports: ['websocket', 'polling'],
      path: '/socket.io',
      autoConnect: true,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id, 'to', server_url);
      setSocketConnected(true);
      socket.emit('joinRoom', meetingId);
      console.log('joinRoom emitted for', meetingId);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
      socketRef.current = null;
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connect error:', error);
    });

    socket.on('chat-message', (data, sender) => {
      console.log('chat-message received', { data, sender });
      setMessages(prev => [...prev, { sender, data, time: new Date() }]);
    });

    socket.on('all-users', async (users) => {
      setParticipantCount(users.length + 1);
      for (const userId of users) {
        const pc = createPeerConnection(userId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log('Sending offer to', userId);
        socket.emit('signal', userId, { sdp: pc.localDescription });
      }
    });

    socket.on('user-joined', (newUserId) => {
      if (newUserId === socket.id) return;
      setParticipantCount(prev => prev + 1);
      createPeerConnection(newUserId);
    });

    socket.on('user-left', (leftId) => {
      removeRemoteStream(leftId);
      setParticipantCount(prev => Math.max(prev - 1, 1));
    });

    socket.on('signal', async (fromId, message) => {
      console.log('signal received from', fromId, message?.sdp?.type || 'candidate');
      const pc = createPeerConnection(fromId);

      if (message.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));

        if (message.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('signal', fromId, { sdp: pc.localDescription });
        }
      }

      if (message.candidate) {
        try {
          await pc.addIceCandidate(message.candidate);
            console.log('Added remote ICE candidate from', fromId);
        } catch (error) {
          console.error('ICE candidate error', error);
        }
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connected, meetingId]);

  const toggleVideo = () => {
    const currentStream = localVideoRef.current?.srcObject;
    if (currentStream) {
      currentStream.getVideoTracks().forEach(track => (track.enabled = !track.enabled));
      setVideoEnabled(prev => !prev);
    }
  };

  const addRemoteStream = (socketId, stream) => {
    setRemoteStreams(prev => {
      const existing = prev.find(item => item.id === socketId);
      if (existing) {
        return prev.map(item => item.id === socketId ? { ...item, stream } : item);
      }
      return [...prev, { id: socketId, stream }];
    });
  };

  const removeRemoteStream = (socketId) => {
    setRemoteStreams(prev => prev.filter(item => item.id !== socketId));
    if (peerConnectionsRef.current[socketId]) {
      peerConnectionsRef.current[socketId].close();
      delete peerConnectionsRef.current[socketId];
    }
  };

  const replaceVideoTrack = (newStream) => {
    if (!newStream || !localVideoRef.current) return;
    localVideoRef.current.srcObject = newStream;

    const newTrack = newStream.getVideoTracks()[0];
    Object.values(peerConnectionsRef.current).forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender && newTrack) {
        sender.replaceTrack(newTrack);
      }
    });
  };

  const createPeerConnection = (remoteSocketId) => {
    if (peerConnectionsRef.current[remoteSocketId]) {
      return peerConnectionsRef.current[remoteSocketId];
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate to', remoteSocketId);
        socketRef.current?.emit('signal', remoteSocketId, { candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        addRemoteStream(remoteSocketId, event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        removeRemoteStream(remoteSocketId);
      }
    };

    const activeStream = screenStreamRef.current || localStreamRef.current || cameraStreamRef.current;
    if (activeStream) {
      activeStream.getTracks().forEach(track => pc.addTrack(track, activeStream));
    }

    peerConnectionsRef.current[remoteSocketId] = pc;
    return pc;
  };

  const toggleAudio = () => {
    const currentStream = localVideoRef.current?.srcObject;
    if (currentStream) {
      currentStream.getAudioTracks().forEach(track => (track.enabled = !track.enabled));
      setAudioEnabled(prev => !prev);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    if (cameraStreamRef.current) {
      replaceVideoTrack(cameraStreamRef.current);
    }
    setScreenSharing(false);
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      stopScreenShare();
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = displayStream;
      replaceVideoTrack(displayStream);

      displayStream.getVideoTracks().forEach(track => {
        track.addEventListener('ended', () => {
          stopScreenShare();
        });
      });

      setScreenSharing(true);
    } catch (error) {
      console.error('Screen share error:', error);
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !socketRef.current) return;
    const chatMessage = messageText.trim();
    console.log('Sending chat-message:', chatMessage);
    socketRef.current.emit('chat-message', chatMessage, 'You');
    setMessages(prev => [...prev, { sender: 'You', data: chatMessage, time: new Date() }]);
    setMessageText('');
  };

  const handleLeaveMeeting = () => {
    navigate('/home');
  };

  return (
    <div className={styles.meetPage}>
      <Paper elevation={4} className={styles.meetHeader}>
        <Box>
          <Typography variant="h5">MeetSync Room</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Meeting code: <strong>{meetingId || 'unknown'}</strong>
          </Typography>
          <Box className={styles.roomStatusRow}>
            <span className={`${styles.statusBadge} ${socketConnected ? styles.liveBadge : styles.connectingBadge}`}>
              {socketConnected ? 'Live' : 'Connecting'}
            </span>
            <span className={styles.countBadge}>{participantCount} participant{participantCount === 1 ? '' : 's'}</span>
          </Box>
          <Typography variant="body2" color="text.secondary" className={styles.roomLabel}>
            Share this link with your guests:
          </Typography>
          <Box className={styles.roomLink}>
            {guestLink}
            <Button 
              size="small" 
              onClick={() => navigator.clipboard.writeText(guestLink)}
              sx={{ ml: 1 }}
            >
              📋 Copy
            </Button>
          </Box>
        </Box>
        <Button variant="contained" color="error" onClick={handleLeaveMeeting}>
          Leave Meeting
        </Button>
      </Paper>

      <div className={styles.meetGrid}>
        <section className={styles.videoSection}>
          <Paper elevation={4} className={styles.videoCard}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Your Camera Preview
            </Typography>
            <video className={styles.localVideo} ref={localVideoRef} autoPlay playsInline muted />
            <Box className={styles.videoStatus}>
              <Badge badgeContent={videoEnabled ? 'ON' : 'OFF'} color={videoEnabled ? 'success' : 'error'}>
                <Typography variant="body2">Video</Typography>
              </Badge>
              <Badge badgeContent={audioEnabled ? 'ON' : 'OFF'} color={audioEnabled ? 'success' : 'error'}>
                <Typography variant="body2">Audio</Typography>
              </Badge>
              <Badge badgeContent={screenSharing ? 'SCREEN' : 'CAMERA'} color={screenSharing ? 'info' : 'primary'}>
                <Typography variant="body2">Preview</Typography>
              </Badge>
            </Box>
          </Paper>

          <Paper elevation={4} className={styles.videoCard}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Remote participants
            </Typography>
            {remoteStreams.length === 0 ? (
              <Typography color="text.secondary">Waiting for others to join...</Typography>
            ) : (
              <Box className={styles.remoteGrid}>
                {remoteStreams.map((streamItem) => (
                  <Paper key={streamItem.id} elevation={3} className={styles.remoteCard}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Guest
                    </Typography>
                    <RemoteVideo stream={streamItem.stream} />
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>

          <Paper elevation={4} className={styles.controlCard}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Call controls
            </Typography>
            <Box className={styles.controlRow}>
              <Button variant="outlined" className={styles.controlButton} onClick={toggleVideo} startIcon={videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}>
                {videoEnabled ? 'Video On' : 'Video Off'}
              </Button>
              <Button variant="outlined" className={styles.controlButton} onClick={toggleScreenShare} startIcon={screenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}>
                {screenSharing ? 'Stop Share' : 'Share Screen'}
              </Button>
              <Button variant="outlined" className={styles.controlButton} onClick={toggleAudio} startIcon={audioEnabled ? <MicIcon /> : <MicOffIcon />}>
                {audioEnabled ? 'Audio On' : 'Audio Off'}
              </Button>
              <Button variant="contained" color="error" className={styles.controlButton} onClick={handleLeaveMeeting} startIcon={<CallEndIcon />}>
                Leave
              </Button>
              <Button variant="outlined" className={styles.controlButton} onClick={() => setShowChat(prev => !prev)} startIcon={<ChatIcon />}>
                {showChat ? 'Hide Chat' : 'Show Chat'}
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Use the chat panel to send messages to everyone in this room.
            </Typography>
          </Paper>
        </section>

        <aside className={`${styles.chatPanel} ${showChat ? '' : styles.chatHidden}`}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Room Chat
          </Typography>
          <Box className={styles.chatBox}>
            {messages.length === 0 ? (
              <Typography color="text.secondary">No messages yet. Say hello!</Typography>
            ) : (
              messages.map((item, index) => (
                <Box key={index} className={styles.chatMessage}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {item.sender}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, mb: 0.5 }}>
                    {item.data}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
          <Box className={styles.chatInputRow}>
            <TextField fullWidth placeholder="Type a message" value={messageText} onChange={(e) => setMessageText(e.target.value)} size="small" />
            <Button variant="contained" onClick={handleSendMessage} sx={{ ml: 1 }}>
              Send
            </Button>
          </Box>
        </aside>
      </div>
    </div>
  );
}
