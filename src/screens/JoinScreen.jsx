import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, TouchableOpacity, View,Alert } from 'react-native';
import { useAppState } from '@react-native-community/hooks';
import { RTCPeerConnection, RTCView, mediaDevices, RTCIceCandidate, RTCSessionDescription, MediaStream } from 'react-native-webrtc';
import { db, firebase } from '../utils/firebase';
import { requestCamAudioPermissions } from '../utils/permissions';

const configuration = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export default function JoinScreen({ setScreen, screens, roomId }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [cachedLocalPC, setCachedLocalPC] = useState(null);
  const [isFrontCamera, setFrontCamera] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [callInProgress, setCallInProgress] = useState(false);
  const [hasPermissions, setPermissions] = useState(false);
  const appState = useAppState();
  console.log('appState:', appState);

  useEffect(() => {
    handlePermissions();
  }, []);

  const handlePermissions = async () => {
    try {
      const hasPermission = await requestCamAudioPermissions();
      setPermissions(hasPermission);
      if (!hasPermission) {
        return;
      } else {
        startLocalStream();
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (appState === 'active') {
      resumeLocalStream();
    } else if (appState === 'background' || appState === 'inactive') {
      pauseLocalStream();
    }
  }, [appState]);

  const pauseLocalStream = () => {
    localStream?.getTracks().forEach(track => track.enabled = false);
    // Send a message to the remote peer to blur the video
  };

  const resumeLocalStream = () => {
    localStream?.getTracks().forEach(track => track.enabled = true);
    // Send a message to the remote peer to resume the video
  };

  const onBackPress = async () => {
    try {
      localStream.getTracks().forEach(track => track.stop());
      cachedLocalPC?.getSenders()?.forEach((sender) => {
        cachedLocalPC?.removeTrack(sender);
      });
      cachedLocalPC?.close();

      setLocalStream(null);
      setRemoteStream(null);
      setCachedLocalPC(null);
      setCallInProgress(false);
      setScreen(screens.ROOM);


     /* // Delete answer field from room
      const roomRef = db.collection('rooms').doc(roomId);
      await roomRef?.update({
        answer: firebase.firestore.FieldValue.delete()
      });

      // Delete caller candidates collection from room
      const calleeCandidates = roomRef.collection('calleeCandidates');
      await calleeCandidates?.get()?.then(snapshot => {
        snapshot.forEach(doc => {
          doc?.ref?.delete();
        });
      })
    */
    } catch (err) {
      console.log(err);
    }
  };

  const startLocalStream = async () => {
    const isFront = true;
    const devices = await mediaDevices.enumerateDevices();

    const facing = isFront ? 'front' : 'environment';
    const videoSourceId = devices.find(device => device.kind === 'videoinput' && device.facing === facing);
    const facingMode = isFront ? 'user' : 'environment';
    const constraints = {
      audio: true,
      video: {
        mandatory: {
          minWidth: 500,
          minHeight: 300,
          minFrameRate: 30,
        },
        facingMode,
        optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
      },
    };
    const newStream = await mediaDevices.getUserMedia(constraints);
    setLocalStream(newStream);
  };

  const joinCall = async id => {
    setCallInProgress(true);
    try {
      const localPC = new RTCPeerConnection(configuration);
      const roomRef = db.collection('rooms').doc(id);
      const roomSnapshot = await roomRef.get();
      if (!roomSnapshot.exists) {
        console.log('No room with id:', id, 'found!');
        return;
      }

      localStream?.getTracks().forEach((track) => {
        localPC?.addTrack(track, localStream);
      });

      const calleeCandidatesCollection = roomRef.collection('calleeCandidates');

      localPC.onicecandidate = e => {
        if (!e.candidate) {
          console.log('got final candidate of callee!');
          return;
        }
        console.log('adding callee ice candidate to firestore');
        calleeCandidatesCollection.add(e.candidate.toJSON());
      };

      localPC.ontrack = (event) => {
        const newRemoteStream = new MediaStream();
        event.streams[0].getTracks().forEach((track) => {
          newRemoteStream.addTrack(track);
        });
        setRemoteStream(newRemoteStream);
      };

      localPC.onconnectionstatechange = () => {
        switch (localPC.connectionState) {
          case 'connected':
            console.log('Peer connection is connected!');
            break;
          case 'disconnected':
            console.log('Peer connection disconnected');
            break;
          case 'failed':
            console.log('Peer connection failed');
            break;
          default:
            break;
        }
      };

      const offer = roomSnapshot.data().offer;
      await localPC.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await localPC.createAnswer();
      await localPC.setLocalDescription(answer);

      const roomWithAnswer = { answer };
      await roomRef.update(roomWithAnswer);

      roomRef.collection('callerCandidates').onSnapshot(snapshot => {
        console.log('got new caller candidates from firestore');
        snapshot.docChanges().forEach(async change => {
          try {
            let data = change.doc.data();
            console.log(data);
            await localPC.addIceCandidate(new RTCIceCandidate(data));
          } catch (err) {
            console.log('error:', err);
          }
        });
      });

      setCachedLocalPC(localPC);
    } catch (err) {
      console.log('err:', err);
    }
  };

  const switchCamera = () => {
    localStream?.getVideoTracks()?.forEach(track => track._switchCamera());
    setFrontCamera((prev) => !prev);
  };


  const toggleMute = () => {
    if (!remoteStream) {
      return;
    }
    localStream?.getAudioTracks()?.forEach(track => {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    });
  };

  const openPermsSettings = () => {
    try {
      Linking.openSettings();
    }
    catch (err) {
      console.log(err);
    }
  }

  const showAlert = () => {
    Alert.alert(
      'Permissions Required',
      'This app requires camera and audio permissions to work properly',
      [
        {
          text: 'Go to Settings',
          onPress: () => openPermsSettings(),
        },

      ],
      { cancelable: false},
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Join Screen</Text>
      <Text style={styles.roomText}>Room: {roomId}</Text>

      <View>
        {!localStream && (
          <TouchableOpacity style={styles.startStreamButton} onPress={showAlert} >
            <Text style={styles.buttonText}>Give Permission</Text>
          </TouchableOpacity>
        )}
        {localStream && (
          <View style={styles.callButtons}>
            <TouchableOpacity onPress={onBackPress} style={styles.stopCallButton}>
              <Text style={styles.buttonText}>Stop Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => joinCall(roomId)}
              disabled={callInProgress}
              style={[styles.startCallButton, callInProgress && styles.disabledButton]}>
              <Text style={styles.buttonText}>{callInProgress ? 'Joining' : 'Join Call'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {localStream && (
        <View style={styles.toggleButtons}>
          <TouchableOpacity
            onPress={switchCamera}
            style={styles.switchCameraButton}
          >
            <Text style={styles.buttonText}>Switch Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleMute} disabled={!remoteStream} style={[styles.toggleMuteButton, !remoteStream && styles.disabledButton]}>
            <Text style={styles.buttonText}>{`${isMuted ? 'Unmute' : 'Mute'} Stream`}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.rtcViews}>
        <View style={styles.rtcview}>
          {localStream && <RTCView style={styles.rtc} streamURL={localStream?.toURL()} mirror={isFrontCamera} />}
        </View>
        <View style={styles.rtcview}>
          {remoteStream && <RTCView style={styles.rtc} streamURL={remoteStream?.toURL()} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  heading: {
    alignSelf: 'center',
    fontSize: 30,
    color: '#3498db',
    marginVertical: 10,
  },
  roomText: {
    alignSelf: 'center',
    fontSize: 18,
    color: '#2c3e50',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },

  startStreamButton: {
    backgroundColor: '#7f8c8d',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 30,
    width: '35%'
  },

  callButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10
  },

  startCallButton: {
    backgroundColor: '#f1c40f',
    backgroundColor: '#2ecc71',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 30,
    width: '35%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stopCallButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 30,
    width: '35%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  toggleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },

  switchCameraButton: {
    backgroundColor: '#3498db',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 30,
    width: '35%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  toggleMuteButton: {
    backgroundColor: '#3498db',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 30,
    width: '35%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rtcViews: {
    flex: 1,
    padding: 10,
  },

  rtcview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
    margin: 5,
    borderRadius: 10,
  },

  rtc: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 10,
  }
});

