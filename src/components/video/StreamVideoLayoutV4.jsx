import { CallingState, CancelCallButton, RecordCallButton, StreamTheme, ToggleAudioPreviewButton, ToggleVideoPreviewButton, useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import SideBySideLayout from "./SideBySideLayout";

import { useEffect, useRef } from 'react';

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
    const isCallRecordingInProgress = useIsCallRecordingInProgress();

    const callingState = useCallCallingState();
    const Participants = useParticipants();
    const username = useSelector((state) => state.me.me.email);

    const intervalRef = useRef(null);
    const cyclingRef = useRef(false); // flag to prevent multiple intervals


    useEffect(() => {
        if (!isCallRecordingInProgress) return;

        const interval = setInterval(() => {
            call.stopRecording().then(() => {
                call.startRecording()
            })
            console.log("Triggering record button click");
        }, 5 * 60 * 1000); // every 3 minutes

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCallRecordingInProgress]);


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
            call.on("call.ended", async () => {
                if (isCallRecordingInProgress) {
                    await call.stopRecording();
                }
            })
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

    return (
        <StreamTheme>
            <div>
                <SideBySideLayout participants={Participants} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                <ToggleAudioPreviewButton />
                <ToggleVideoPreviewButton />
                <RecordCallButton />
                <div onClick={handleCancel}>
                    <CancelCallButton />
                </div>
            </div>
        </StreamTheme>
    );
};

export default StreamVideoLayoutV4;