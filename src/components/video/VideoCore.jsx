import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import VideoUi from "./VideoUi";
import { useToast } from "../../hooks/use-toast";

const BACKEND_LINK = "https://seismic-backend-04272025-bjbxatgnadguabg9.centralus-01.azurewebsites.net"
// const BACKEND_LINK = "http://localhost:8080";
const socket = io(BACKEND_LINK);

const VideoCore = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const role = queryParams.get("role");
  const roomId = queryParams.get("roomId");
  const nickname = queryParams.get("name");
  const hasInitialized = useRef(false);
  const { toast } = useToast();
  const [waitingForHost, setWaitingForHost] = useState(
    role === "patient" ? true : false
  );
  const [otherUserNickname, setOtherUserNickname] = useState(undefined);
  const [incomingCall, setIncomingCall] = useState({
    show: false,
    name: "",
    socketId: null,
  });

  const setLogs = useState({
    myNickname: nickname,
    roomId,
    callerSocketId: undefined,
    mySocketId: undefined,
    answeredSocketId: undefined,
    localDescription: undefined,
    remoteDescription: undefined,
    receivedOffers: [],
    sentOffers: [],
    receivedAnswers: [],
    sentAnswers: [],
    sentICECandidates: [],
    receivedICECandidates: [],
  })[1];

  const myVideo = useRef(null);
  const partnerVideo = useRef(null);
  const peerRef = useRef(null);
  const otherUserId = useRef(null);
  const myStream = useRef(null);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (myVideo.current) myVideo.current.srcObject = stream;
        myStream.current = stream;
        rtcPeerLogic();
      } catch (err) {
        console.error(err);
      }
    })();

    return removeMyStream;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rtcPeerLogic = () => {
    setLogs((prev) => ({ ...prev, mySocketId: socket.id }));
    socket.emit("joinRoom", { roomId, nickname, role });

    socket.on("otherUserId", ({ otherUserNickname, otherUserSocketId }) => {
      toast({
        title: "Connected",
        description: `Successfully accepted: ${otherUserNickname}`,
        duration: 3000,
      });
      setLogs((prev) => ({ ...prev, callerSocketId: otherUserSocketId }));
      otherUserId.current = otherUserSocketId;
      peerRef.current = createPeer(otherUserSocketId);
      myStream.current
        .getTracks()
        .forEach((track) => peerRef.current.addTrack(track, myStream.current));
    });

    socket.on("userJoined", ({ otherUserSocketId, otherUserNickname }) => {
      setIncomingCall({
        show: true,
        name: otherUserNickname,
        socketId: otherUserSocketId,
      });
      setLogs((prev) => ({ ...prev, answeredSocketId: otherUserSocketId }));
      otherUserId.current = otherUserSocketId;
    });

    socket.on("acceptedBy", (name) => {
      setWaitingForHost(false);
      toast({
        title: "Call Accepted",
        description: `Successfully accepted by user: ${name}`,
        duration: 3000,
      });
      setOtherUserNickname(name);
    });

    socket.on("waitingToBeAcceptedBy", (name) => {
      toast({
        title: "Waiting for Acceptance",
        description: `Waiting to be accepted by ${name}`,
        duration: 3000,
      });
    });

    socket.on("callRejected", (name) => {
      toast({
        title: "Call Rejected",
        description: `User ${name} did not accept your call!`,
        duration: 3000,
      });
    });

    socket.on("otherUserDisconnected", (name) => {
      toast({
        title: "Disconnected",
        description: `${name} just disconnected!`,
        duration: 3000,
      });
      if (partnerVideo.current) partnerVideo.current.srcObject = null;
    });

    socket.on("offer", async (offer) => {
      try {
        setLogs((prev) => ({
          ...prev,
          receivedOffers: [...prev.receivedOffers, offer],
        }));
        peerRef.current = createPeer();
        const description = new RTCSessionDescription(offer.sdp);
        await peerRef.current.setRemoteDescription(description);
        setLogs((prev) => ({
          ...prev,
          remoteDescription: JSON.parse(JSON.stringify(description)),
        }));
        myStream.current
          .getTracks()
          .forEach((track) =>
            peerRef.current.addTrack(track, myStream.current)
          );
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        setLogs((prev) => ({
          ...prev,
          localDescription: JSON.parse(JSON.stringify(answer)),
        }));
        socket.emit("answer", {
          target: offer.caller,
          caller: socket.id,
          sdp: peerRef.current.localDescription,
        });
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("answer", async (answer) => {
      try {
        setLogs((prev) => ({
          ...prev,
          receivedAnswers: [...prev.receivedAnswers, answer],
        }));
        const description = new RTCSessionDescription(answer.sdp);
        await peerRef.current.setRemoteDescription(description);
        setLogs((prev) => ({
          ...prev,
          remoteDescription: JSON.parse(JSON.stringify(description)),
        }));
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("ICECandidate", async (ICECandidate) => {
      try {
        setLogs((prev) => ({
          ...prev,
          receivedICECandidates: [...prev.receivedICECandidates, ICECandidate],
        }));
        const candidate = new RTCIceCandidate(ICECandidate);
        await peerRef.current.addIceCandidate(candidate);
      } catch (err) {
        console.error(err);
      }
    });
  };

  const createPeer = (otherUserSocketId) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ICECandidate", {
          target: otherUserId.current,
          candidate: event.candidate,
        });
        setLogs((prev) => ({
          ...prev,
          sentICECandidates: [...prev.sentICECandidates, event.candidate],
        }));
      }
    };

    peer.ontrack = (event) => {
      if (!partnerVideo.current?.srcObject) {
        partnerVideo.current.srcObject = event.streams[0];
      }
    };

    peer.onnegotiationneeded = async () => {
      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("offer", {
          target: otherUserSocketId,
          caller: socket.id,
          sdp: peer.localDescription,
        });
        setLogs((prev) => ({
          ...prev,
          sentOffers: [
            ...prev.sentOffers,
            { target: otherUserSocketId, caller: socket.id, sdp: offer },
          ],
        }));
      } catch (err) {
        console.error(err);
      }
    };

    return peer;
  };

  const removeMyStream = () => {
    myStream.current?.getTracks().forEach((track) => track.stop());
  };

  const handleAccept = () => {
    socket.emit("callAccepted", { roomId, nickname });
    setOtherUserNickname(incomingCall.name);
    setIncomingCall({ show: false, name: "", socketId: null });
  };

  const handleReject = () => {
    socket.emit("callRejected", { roomId, nickname });
    setIncomingCall({ show: false, name: "", socketId: null });
  };

  window.addEventListener("beforeunload", (ev) => {
    ev.preventDefault();
    removeMyStream();
    return true;
  });

  return (
    <>
      {/* Incoming call modal */}
      {incomingCall.show && (
        <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-xl p-4 w-80 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-lg font-semibold">
                {incomingCall.name[0]}
              </span>
            </div>
            <div>
              <h2 className="text-sm font-semibold">{incomingCall.name}</h2>
              <p className="text-xs text-gray-500">Incoming call</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
              onClick={handleReject}
            >
              Reject
            </button>
            <button
              className="px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
              onClick={handleAccept}
            >
              Accept
            </button>
          </div>
        </div>
      )}

      {/* Video containers */}
      <VideoUi
        myStream={myStream}
        socket={socket}
        userVideo={partnerVideo}
        myVideo={myVideo}
        BACKEND_LINK={BACKEND_LINK}
        me={nickname}
        waitingForHost={waitingForHost}
        role={role}
        userName={otherUserNickname}
      />
    </>
  );
};

export default VideoCore;
