import {
  CallingState,
  CancelCallButton,
  RecordCallButton,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  ToggleAudioPreviewButton,
  ToggleVideoPreviewButton,
  useCallStateHooks
} from '@stream-io/video-react-sdk';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useRef, useState } from 'react';

import html2canvas from "html2canvas";
import { navigate } from "wouter/use-browser-location";

const apiKey = 'mmhfdzb5evj2';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Byb250by5nZXRzdHJlYW0uaW8iLCJzdWIiOiJ1c2VyL0Jlbl9Ta3l3YWxrZXIiLCJ1c2VyX2lkIjoiQmVuX1NreXdhbGtlciIsInZhbGlkaXR5X2luX3NlY29uZHMiOjYwNDgwMCwiaWF0IjoxNzQ3ODY0ODY3LCJleHAiOjE3NDg0Njk2Njd9.EIcmcoGIrrb21i_M70DE5nvoc7IEMYqXh3gOSWidaHM';
const userId = 'Ben_Skywalker';
const callId = 'jGdKsruxWg4H';
console.log(window.location.href);

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

const doctor = {
  id: userId,
  name: 'Doctor'
};

const client = new StreamVideoClient({ apiKey, user: doctor, token });
const call = client.call('default', callId);
call.join({ create: true });

export default function StreamVideoCoreV2() {
  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <MyUILayout />
      </StreamCall>
    </StreamVideo>
  );
}

export const MyUILayout = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
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
    setRecording(true)

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

    const canvasStream = canvasRef.current.captureStream(60);
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

  const handleRecordingClick = async () => {
    console.log("Recording Button clicked");
    if (!recording) {
      await startRecording();
    }
    else {
      stopRecording()
    }

  }

  const handleCancel = () => {
    // Optional: stop recording or cleanup
    stopRecording();
    navigate("/post-call"); // ✅ Redirect to PostCallDocumentation
  };

  if (callingState !== CallingState.JOINED) {
    console.log("Joining");

    return <div>Loading...</div>;
  }

  return (
    <StreamTheme>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div ref={divRef}>
        <SpeakerLayout participantsBarPosition='bottom' />
        {/* {localParticipant && <ParticipantView participant={localParticipant} />} */}
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
        <ToggleAudioPreviewButton />
        <ToggleVideoPreviewButton />
        <div onClick={handleRecordingClick}>
          <RecordCallButton />
        </div>
        <div onClick={handleCancel}>
        <CancelCallButton />
        </div>
      </div>
    </StreamTheme>
  );
};