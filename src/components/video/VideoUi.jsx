import html2canvas from "html2canvas";
import { useRef, useState } from "react";
import { FaPhoneSlash, FaStop, FaVideo } from "react-icons/fa";

const getFormattedDate = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${month}${day}-${hours}${minutes}`
}

const DATETIME = getFormattedDate()

function VideoUi({
  myStream,
  socket,
  userVideo,
  myVideo,
  BACKEND_LINK,
  me,
  waitingForHost,
  role,
  userName,
}) {
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const removeMyStream = () => {
    myStream.current?.getTracks().forEach((track) => track.stop());
  };

  const leaveCall = () => {
    removeMyStream();
    socket.disconnect();
    window.location.reload();
  };

  const toggleMute = () => {
    if (!myStream.current) return;
    const audioTrack = myStream.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (!myStream.current) return;
    const videoTrack = myStream.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  const divRef = useRef(null);
  const canvasRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const intervalRef = useRef(null);
  const canvasDrawIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const chunkIndex = useRef(0)

  const startRecording = async () => {
    if (!divRef.current || !canvasRef.current) return;

    // Set canvas size same as div
    const { offsetWidth, offsetHeight } = divRef.current;
    canvasRef.current.width = offsetWidth;
    canvasRef.current.height = offsetHeight;

    // Start drawing the div content into the canvas
    canvasDrawIntervalRef.current = setInterval(() => {
      html2canvas(divRef.current).then((canvasImage) => {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, offsetWidth, offsetHeight);
        ctx.drawImage(canvasImage, 0, 0, offsetWidth, offsetHeight);
      });
    }, 100); // ~10fps

    const canvasStream = canvasRef.current.captureStream(30); // 30fps
    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    // Combine canvas + audio
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioStream.getAudioTracks(),
    ]);
    streamRef.current = combinedStream;

    startMediaRecorder(combinedStream); // Start first 5s chunk

    // Repeat every 5 seconds
    intervalRef.current = setInterval(() => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop(); // this triggers ondataavailable
        startMediaRecorder(combinedStream); // start next chunk
      }
    }, 5000);

    setRecording(true);
  };

  const startMediaRecorder = (stream) => {
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    chunksRef.current = [];

    recorder.ondataavailable = async (e) => {
      if (e.data.size > 0) {
        const blob = new Blob([e.data], { type: "video/webm" });
        const formData = new FormData();
        const index = chunkIndex.current++
        formData.append("chunk", blob, `recording-${index}.webm`);

        try {
          const response = await fetch(
            `${BACKEND_LINK}/upload-chunk/Guest-${DATETIME}/${index}`,
            {
              method: "POST",
              body: formData,
            }
          );

          if (!response.ok) {
            throw new Error("Upload failed");
          }

          console.log("Upload successful");
        } catch (err) {
          console.error("Upload error:", err);
        }
      }
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
  };

  const stopRecording = () => {
    clearInterval(intervalRef.current);
    clearInterval(canvasDrawIntervalRef.current);

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setRecording(false);
  };

  return (
    <div className="rounded-lg border bg-white shadow-sm w-full mt-6">
      <div className="bg-blue-600 p-4">
        <h2 className="text-2xl font-semibold text-white mb-2">
          Call with {userName}
        </h2>
      </div>
      <div
        ref={divRef}
        className="flex justify-center p-6 video-container gap-4"
      >
        {/* {callAccepted && !callEnded && ( */}
        <div className="relative h-80 bg-gray-200 rounded-lg overflow-hidden flex-2">
          {waitingForHost && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <div className="text-center p-4 bg-white bg-opacity-90 rounded-lg">
                <p className="text-xl font-medium text-gray-800">
                  Waiting for Doctor
                </p>
                <p className="text-gray-600">
                  The consultation will begin when the doctor joins
                </p>
              </div>
            </div>
          )}
          <div className="relative w-full h-full group">
            <video
              playsInline
              ref={userVideo}
              autoPlay
              controls
              className="w-full h-full object-cover [&::-webkit-media-controls]:opacity-0 group-hover:[&::-webkit-media-controls]:opacity-100 transition-opacity duration-300 [&::-webkit-media-controls-panel]:!bg-transparent [&::-webkit-media-controls-timeline]:!bg-white/30 [&::-webkit-media-controls-current-time-display]:!text-white [&::-webkit-media-controls-time-remaining-display]:!text-white [&::-webkit-media-controls-mute-button]:!hidden [&::-webkit-media-controls-volume-slider]:!hidden [&::-webkit-media-controls-fullscreen-button]:!hidden"
            />
            <button
              onClick={() => {
                if (userVideo.current) {
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  } else {
                    userVideo.current.requestFullscreen();
                  }
                }
              }}
              className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 transition-all opacity-0 group-hover:opacity-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                />
              </svg>
            </button>
          </div>
          <p className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
            {role}
          </p>
        </div>
        {/* )} */}
        <div className="relative h-80 bg-gray-200 rounded-lg overflow-hidden flex-1">
          <video
            playsInline
            muted
            ref={myVideo}
            autoPlay
            className="w-full h-full object-cover"
          />
          <p className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
            {userName || "You"}
          </p>
          <button
            onClick={toggleMute}
            className={`px-4 py-2 rounded-lg mr-2 ${isAudioMuted
              ? "bg-yellow-500 hover:bg-yellow-600"
              : "bg-blue-500 hover:bg-blue-600"
              } text-white`}
          >
            {isAudioMuted ? "Unmute" : "Mute"}
          </button>

          <button
            onClick={toggleVideo}
            className={`px-4 py-2 rounded-lg mr-2 ${isVideoOff
              ? "bg-yellow-500 hover:bg-yellow-600"
              : "bg-blue-500 hover:bg-blue-600"
              } text-white`}
          >
            {isVideoOff ? "Turn On Video" : "Turn Off Video"}
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div className="text-center mb-4">
        {!recording ? (
          <button
            onClick={startRecording}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 mr-2"
          >
            <FaVideo className="inline-block mr-2" />
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 mr-2"
          >
            <FaStop className="inline-block mr-2" />
            Stop Recording
          </button>
        )}
        <button
          onClick={leaveCall}
          className="bg-red-500 text-white rounded-lg py-2 px-4 hover:bg-red-600 focus:outline-none mr-2"
        >
          <FaPhoneSlash className="inline-block mr-2" />
          End Call
        </button>

        {/* 🎤 Bottom mute button with toast TO THE LEFT */}
        <div className="inline-block relative mr-2 align-middle">
          <button
            onClick={toggleMute}
            className={`px-4 py-2 rounded-lg ${isAudioMuted
              ? "bg-yellow-500 hover:bg-yellow-600"
              : "bg-blue-500 hover:bg-blue-600"
              } text-white`}
          >
            {isAudioMuted ? "Unmute" : "Mute"}
          </button>

          {isAudioMuted && (
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-50">
               your mic is muted. please unmute to continue.
            </div>
          )}
        </div>

        <button
          onClick={toggleVideo}
          className={`px-4 py-2 rounded-lg mr-2 ${isVideoOff
            ? "bg-yellow-500 hover:bg-yellow-600"
            : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
        >
          {isVideoOff ? "Turn On Video" : "Turn Off Video"}
        </button>
      </div>
    </div>
  );
}

export default VideoUi;
