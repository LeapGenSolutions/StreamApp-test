import { CallingState, CancelCallButton, StreamTheme, ToggleAudioPreviewButton, ToggleVideoPreviewButton, useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import SideBySideLayout from "./SideBySideLayout";

import { useEffect, useRef, useState } from 'react';
import { FaCircle, FaStopCircle } from 'react-icons/fa';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useSelector } from "react-redux";
import sendMessageToQueue from "../../api/SendMessageToQueue";
import { navigate } from "wouter/use-browser-location";

const StreamVideoLayoutV4 = ({ callId }) => {
    const {
        useCallCallingState,
        useParticipants,
        useIsCallRecordingInProgress
    } = useCallStateHooks();
    const call = useCall();
    const [recording, setRecording] = useState(false);
    const isCallRecordingInProgress = useIsCallRecordingInProgress();

    const callingState = useCallCallingState();
    const Participants = useParticipants();
    const username = useSelector((state) => state.me.me.email);

    const intervalRef = useRef(null);
    const cyclingRef = useRef(false); // flag to prevent multiple intervals


    useEffect(() => {
        if (!isCallRecordingInProgress && !recording) return;

        try {
            const interval = setInterval(() => {
                call.stopRecording().then(() => {
                    call.startRecording()
                })
            }, 5 * 60 * 1000); // every 3 minutes
    
            return () => clearInterval(interval);
        } catch (error) {
            console.log("Some error here");
            console.warn(error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recording]);


    useEffect(() => {
        if (!call) return;

        const handleRecordingStarted = () => {
            console.log("recording started - " + new Date());
        };

        const handleRecordingStopped = () => {
            console.log("recording stopped - " + new Date());
        };

        const unsubscribers = [
            call.on("call.recording_started", handleRecordingStarted),
            call.on("call.recording_stopped", handleRecordingStopped),
            // call.on("call.recording_ready", handleRecordingReady),
        ];

        return () => {
            unsubscribers.forEach((unsub) => unsub());
            
            // eslint-disable-next-line react-hooks/exhaustive-deps
            if (intervalRef.current) clearInterval(intervalRef.current);
            cyclingRef.current = false;
        };        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [call]);

    const handleCancel = async () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if(isCallRecordingInProgress) await call.stopRecording();
        sendMessageToQueue(callId, username);
        navigate(`/post-call/${callId}`, {state: { from : "video-call" }});
    };

    if (callingState !== CallingState.JOINED) {
        return <div>Loading...</div>;
    }

    const handleRecordingButtonClicked = async () => {
        if (!call) return;
        if (recording) {
            setRecording(false);
            await call.stopRecording();
        } else {
            setRecording(true);
            await call.startRecording();
        }
    };
    return (
        <StreamTheme>
            <div>
                <SideBySideLayout participants={Participants} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                <ToggleAudioPreviewButton />
                <ToggleVideoPreviewButton />
                <button
                    style={{
                        padding: '8px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: 'none',
                        boxShadow: recording ? '0 0 0 2px #e53e3e' : '0 0 0 2px #38a169',
                        transition: 'box-shadow 0.2s',
                    }}
                    aria-label={recording ? 'Stop Recording' : 'Start Recording'}
                    title={recording ? 'Stop Recording' : 'Start Recording'}
                    onClick={handleRecordingButtonClicked}
                >
                    {recording ? (
                        <FaStopCircle size={20} color="#e53e3e" />
                    ) : (
                        <FaCircle size={20} color="#38a169" />
                    )}
                </button>
                <div onClick={handleCancel}>
                    <CancelCallButton />
                </div>
            </div>
        </StreamTheme>
    );
};

export default StreamVideoLayoutV4;