import { CallingState, CancelCallButton, RecordCallButton, StreamTheme, ToggleAudioPreviewButton, ToggleVideoPreviewButton, useCallStateHooks } from "@stream-io/video-react-sdk";
import SideBySideLayout from "./SideBySideLayout";
import { navigate } from "wouter/use-browser-location";
import { useRef, useState } from 'react';

import html2canvas from "html2canvas";
import { BACKEND_URL } from "../../constants";
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useSelector } from "react-redux";
import sendMessageToQueue from "../../api/SendMessageToQueue";



const StreamVideoLayoutV3 = ({ callId }) => {
    const {
        useCallCallingState,
        useParticipants,
    } = useCallStateHooks();

    const callingState = useCallCallingState();
    const Participants = useParticipants();
    const divRef = useRef(null);
    const canvasRef = useRef(null);
    const [recording, setRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const intervalRef = useRef(null);
    const canvasDrawIntervalRef = useRef(null);
    const streamRef = useRef(null);
    const chunkIndex = useRef(0);
    const username = useSelector((state) => state.me.me.email)

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
        }, 60000);

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
                    await fetch(`${BACKEND_URL}/upload-chunk/${callId}/${index}?username=${username}`, {
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
            await stopRecording()
        }

    }

    const handleCancel = async () => {
        await stopRecording();
        await sendMessageToQueue(callId, username)
        navigate(`/post-call/${callId}`);
    };

    if (callingState !== CallingState.JOINED) {
        return <div>Loading...</div>;
    }
    return (
        <StreamTheme>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div ref={divRef}>
                <SideBySideLayout participants={Participants} />
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

export default StreamVideoLayoutV3;