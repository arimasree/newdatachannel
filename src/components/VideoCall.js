import React, {useContext, useRef} from "react";

import { SocketContext } from "./Context";
import config from "../config";

const VideoCall = () => {
    const {socket, peer} = useContext(SocketContext);
    //const sendChannel = peer.createDataChannel("sendChannel");
    const {
        SOCKET_ROOM,
        SOCKET_TOPICS: {
            CREATE_JOIN_ROOM,
            ROOM_CREATED,
            ROOM_FULL,
            JOIN_ROOM,
            JOINED_ROOM,
            LOG,
            MESSAGE,
        },
    } = config;
    const localStream = useRef();
    const localVideo = useRef({});
    let remoteStream = useRef();
    const remoteVideo = useRef({});
    // Set up audio and video regardless of what devices are present.
    const sdpConstraints = {
        'mandatory': {
            'OfferToReceiveAudio': true,
            'OfferToReceiveVideo': true
        }
    };

    console.log("peer =======>");
    console.log(peer);
    let sendChannel;
    let isInitiator = false;
    let isStarted = false;
    let isChannelReady = false;

    socket.emit(CREATE_JOIN_ROOM, SOCKET_ROOM);
    console.log("Attempted to create or  join room", SOCKET_ROOM);

    socket.on(ROOM_CREATED, (room) => {
        console.log("Created room " + room);
        isInitiator = true;
    });

    socket.on(ROOM_FULL, (room) => {
        console.log("Room " + room + " is full");
    });

    socket.on(JOIN_ROOM, async (room) => {
        console.log("Another peer made a request to join room " + room);
        console.log("This peer is the initiator of room " + room + "!");
        isChannelReady = true;
    });

    socket.on(JOINED_ROOM, (room) => {
        console.log("joined: " + room);
        isChannelReady = true;
    });

    socket.on(LOG, (array) => {
        console.log.apply(console, array);
    });

    socket.on('bye', () => {
        handleRemoteHangup();
    });

    socket.on(MESSAGE, (message) => {
        console.log('Client received message:', message);
        if (message === 'got user media') {
            maybeStart();
        }  else if (message.type === 'offer') {
            if (!isInitiator && !isStarted) {
                maybeStart();
            }
            peer.setRemoteDescription(new RTCSessionDescription(message));
            doAnswer();
        } else if (message.type === 'answer' && isStarted) {
            console.log("received answer");
            peer.setRemoteDescription(new RTCSessionDescription(message));
        } else if (message.type === 'candidate' && isStarted) {
            const candidate = new RTCIceCandidate({
                sdpMLineIndex: message.label,
                candidate: message.candidate
            });
            peer.addIceCandidate(candidate);
        } else if (message === 'bye' && isStarted) {
            handleRemoteHangup();
        }
    });

  navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: true,
      })
      .then(gotStream)
      .catch((e) => {
        alert("getUserMedia() error: " + e.name);
      });

    function sendMessage(message) {
        console.log("Client sending message: ", message);
        socket.emit(MESSAGE, message);
    }

    function gotStream(stream) {
        console.log("Adding local stream.");

        localStream.current = stream;
        localVideo.current = {};
        localVideo.current.srcObject = stream;
        sendMessage("got user media");
        if (isInitiator) {
            socket.emit(MESSAGE, 'Connection Created');
            maybeStart();
        }
    }

    function maybeStart() {
        console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
        if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
            console.log('>>>>>> creating peer connection');
            createPeerConnection();
            peer.addStream(localStream.current);
            isStarted = true;
            console.log('isInitiator', isInitiator);
            if (isInitiator) {
                doCall();
            }
        }
    }

    window.onbeforeunload = function () {
        sendMessage("bye");
    };

    function createPeerConnection() {
        try {

            peer.onnegotiationneeded = handleNegotiation;
            if ('ontrack' in peer) {
                peer.ontrack = handleRemoteStreamAdded;
            } else {
                // deprecated
                peer.onaddstream = handleRemoteStreamAdded;
            }
            peer.onicecandidate = handleIceCandidate;
            peer.onremovestream = handleRemoteStreamRemoved;
            const connectionState = peer.connectionState;
            console.log("Created RTCPeerConnnection" + connectionState);
            peer.ondatachannel = handleDataChannelCreated;
        } catch (e) {
            console.log("Failed to create PeerConnection, exception: " + e.message);
            alert("Cannot create RTCPeerConnection object.");
            return;
        }
    }

    function handleNegotiation(event) {
        sendChannel = peer.createDataChannel("sendDataChannel");
        sendChannel.onmessage = handleDataChannelReceiveMessage;
        sendChannel.onopen = handleSendChannelStatusChange;
        sendChannel.onclose = handleSendChannelStatusChange;
        peer.createOffer(
            setLocalAndSendMessage,
            handleCreateOfferError,
            sdpConstraints
        );
    }

    function handleDataChannelReceiveMessage(event) {
        console.log("Message received is: " + event.data);
    }

    function handleSendChannelStatusChange(event) {
        if (sendChannel) {
            var state = sendChannel.readyState;
            console.log('The state is ' + state);
            if (state === "open") {
                sendChannel.send('Hello from sreeraman');
                console.log("The send channel is " + sendChannel);
            } else {
                console.log('in the else The state is ' + state);
            }
        }
    }

    function handleDataChannelCreated(event) {
        console.log('dataChannel opened');

        sendChannel = event.channel;
        sendChannel.onmessage = handleDataChannelReceiveMessage;
        sendChannel.onopen = handleSendChannelStatusChange;
        sendChannel.onclose = handleSendChannelStatusChange;
    }

    function handleIceCandidate(event) {
        console.log("icecandidate event: ", event);
        if (event.candidate) {
            sendMessage({
                type: "candidate",
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate,
            });

        } else {
            console.log("End of candidates.");
        }
    }

    function handleCreateOfferError(event) {
        console.log("createOffer() error: ", event);
    }

    function doCall() {
      console.log('Sending offer to peer');
      sendChannel = peer.createDataChannel("sendDataChannel");
      sendChannel.onmessage = handleDataChannelReceiveMessage;
      sendChannel.onopen = handleSendChannelStatusChange;
      sendChannel.onclose = handleSendChannelStatusChange;
      peer.createOffer(setLocalAndSendMessage, handleCreateOfferError, sdpConstraints);
    }

    function doAnswer() {

        console.log("Sending answer to peer.");
        peer
            .createAnswer()
            .then(setLocalAndSendMessage, onCreateSessionDescriptionError);
    }

    function setLocalAndSendMessage(sessionDescription) {
        peer.setLocalDescription(sessionDescription);
        console.log("setLocalAndSendMessage sending message", sessionDescription);
        sendMessage(sessionDescription);
    }

    function onCreateSessionDescriptionError(error) {
        console.error("Failed to create session description: " + error.toString());
    }

    function handleRemoteStreamAdded(event) {
        // var connectionState = peer.connectionState;
        //
        // console.log("Remote stream added." + connectionState);
        // remoteStream.current = event.stream;
        // console.log("Remote stream " + event.stream.id);
        // remoteVideo.current.srcObject = event.stream;
        //
        // peer.addEventListener("track", async (event) => {
        //     remoteStream.current.addTrack(event.track, remoteStream.current);
        // });
        console.log('Remote stream added.');
        if ('srcObject' in remoteVideo.current) {
            remoteVideo.current.srcObject = event.streams[0];
        } else {
            // deprecated
            remoteVideo.src = window.URL.createObjectURL(event.stream);
        }
        remoteStream = event.stream;
    }

    function handleRemoteStreamRemoved(event) {
        console.log("Remote stream removed. Event: ", event);
    }

    function handleRemoteHangup() {
        console.log("Session terminated.");
        stop();
        isInitiator = false;
    }

    function stop() {
        isStarted = false;
        peer.close();
        window.location.reload();
    }

    return (
        <>
            <video
                height="700"
                width="350"
                style={{float: "left"}}
                autoPlay
                ref={remoteVideo}
            />
        </>
    );
};

export default VideoCall;
