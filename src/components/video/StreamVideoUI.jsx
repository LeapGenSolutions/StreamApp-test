// StreamVideoUI.jsx
import React, { useRef, useState } from 'react';
import {
  useCall,
  ParticipantView,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import html2canvas from 'html2canvas';
import { FaPhoneSlash, FaStop, FaVideo } from 'react-icons/fa';

const BACKEND_LINK = "https://seismic-backend-04272025-bjbxatgnadguabg9.centralus-01.azurewebsites.net"
// const BACKEND_LINK = "http://localhost:8080";

const getFormattedDate = () => {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(
    now.getMinutes()
  ).padStart(2, '0')}`;
};
const DATETIME = getFormattedDate();

const StreamVideoUI = () => {
  const call = useCall();
  const { useLocalParticipant, useRemoteParticipants } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  const divRef = useRef(null);
  const canvasRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const intervalRef = useRef(null);
  const canvasDrawIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const chunkIndex = useRef(0);

  const startRecording = async () => {
    if (!divRef.current || !canvasRef.current) return;

    const { offsetWidth, offsetHeight } = divRef.current;
    canvasRef.current.width = offsetWidth;
    canvasRef.current.height = offsetHeight;

    canvasDrawIntervalRef.current = setInterval(() => {
      html2canvas(divRef.current).then((canvasImage) => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, offsetWidth, offsetHeight);
        ctx.drawImage(canvasImage, 0, 0, offsetWidth, offsetHeight);
      });
    }, 100);

    const canvasStream = canvasRef.current.captureStream(30);
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioStream.getAudioTracks(),
    ]);
    streamRef.current = combinedStream;

    startMediaRecorder(combinedStream);

    intervalRef.current = setInterval(() => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
        startMediaRecorder(combinedStream);
      }
    }, 5000);

    setRecording(true);
  };

  const startMediaRecorder = (stream) => {
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    chunksRef.current = [];

    recorder.ondataavailable = async (e) => {
      if (e.data.size > 0) {
        const blob = new Blob([e.data], { type: 'video/webm' });
        const formData = new FormData();
        const index = chunkIndex.current++;
        formData.append('chunk', blob, `recording-${index}.webm`);

        try {
          await fetch(`${BACKEND_LINK}/upload-chunk/Guest-${DATETIME}/${index}`, {
            method: 'POST',
            body: formData,
          });
        } catch (err) {
          console.error('Upload error:', err);
        }
      }
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
  };

  const stopRecording = () => {
    clearInterval(intervalRef.current);
    clearInterval(canvasDrawIntervalRef.current);
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setRecording(false);
  };

  return (
    <div className="rounded-lg border bg-white shadow-sm w-full mt-6">
      <div className="bg-blue-600 p-4">
        <h2 className="text-2xl font-semibold text-white mb-2">Call</h2>
      </div>
      <div ref={divRef} className="flex justify-center p-6 video-container gap-4">
        {remoteParticipants.map((p) => (
          <ParticipantView key={p.sessionId} participant={p} />
        ))}
        {localParticipant && <ParticipantView participant={localParticipant} />}
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div className="text-center mb-4">
        {!recording ? (
          <button
            onClick={startRecording}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 mr-2"
          >
            <FaVideo className="inline-block mr-2" /> Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 mr-2"
          >
            <FaStop className="inline-block mr-2" /> Stop Recording
          </button>
        )}
        <button
          onClick={() => call.leave()}
          className="bg-red-500 text-white rounded-lg py-2 px-4 hover:bg-red-600 focus:outline-none"
        >
          <FaPhoneSlash className="inline-block mr-2" /> End Call
        </button>
      </div>
    </div>
  );
};

export default StreamVideoUI;
