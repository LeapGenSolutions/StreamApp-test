import { CallingState, CancelCallButton, StreamTheme, ToggleAudioPreviewButton, ToggleVideoPreviewButton, useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import SideBySideLayout from "./SideBySideLayout";
import RightPanel from './RightPanel';

import { useEffect, useRef, useState } from 'react';
import { FaCircle, FaStopCircle } from 'react-icons/fa';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useSelector } from "react-redux";
import sendMessageToQueue from "../../api/SendMessageToQueue";
import { navigate } from "wouter/use-browser-location";

const StreamVideoLayoutV4 = ({ callId, onRecordingStarted }) => {
    const {
        useCallCallingState,
        useParticipants,
        useIsCallRecordingInProgress,
        useMicrophoneState,     
    } = useCallStateHooks();
    const call = useCall();
    const [recording, setRecording] = useState(false);
    const isCallRecordingInProgress = useIsCallRecordingInProgress();

    const callingState = useCallCallingState();
    const Participants = useParticipants();
    const username = useSelector((state) => state.me.me.email);
    const intervalRef = useRef(null);
    const cyclingRef = useRef(false); // flag to prevent multiple intervals

    const { isMute, mediaStream  } = useMicrophoneState();
    const [transcriptionLines, setTranscriptionLines] = useState([]);

    const wsRef = useRef(null);
    const audioCtxRef = useRef(null);
    const processorRef = useRef(null);
    const sourceRef = useRef(null);

    const encodeWav = (samples, sampleRate, numChannels) => {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);

        const writeString = (dv, offset, str) => {
            for (let i = 0; i < str.length; i++) dv.setUint8(offset + i, str.charCodeAt(i));
        };

        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * 2, true);
        view.setUint16(32, numChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, 'data');
        view.setUint32(40, samples.length * 2, true);

        let offset = 44;
        for (let i = 0; i < samples.length; i++, offset += 2) {
            let s = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }

        return buffer;
    };

    useEffect(() => {
        if (callingState !== CallingState.JOINED) return;

        const role = "doctor";
        const userId = username;
        const sessionId = callId;

        const wsUrl = `wss://seismicdockerbackend-fthfbxbscbcwe3hr.centralus-01.azurewebsites.net/realtime/ws/${role}/${encodeURIComponent(userId)}/${sessionId}`;

        try {
            const ws = new WebSocket(wsUrl);
            ws.binaryType = 'arraybuffer';
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('realtime websocket open', wsUrl);
            };

            // handle incoming messages (text) and push into transcription state
            ws.onmessage = (e) => {
                try {
                    let data = e.data;

                    if (data instanceof ArrayBuffer) {
                        try {
                            data = new TextDecoder().decode(data);
                        } catch (decErr) {
                            // fall back to leaving as ArrayBuffer
                        }
                    }

                    let parsedObj = null;
                    let text = '';
                    let speaker = '';
                    let timestamp = Date.now();
                    let is_final = true;

                    if (typeof data === 'string') {
                        try {
                            parsedObj = JSON.parse(data);
                            text = parsedObj.transcript ?? parsedObj.text ?? data;
                            speaker = parsedObj.speaker ?? parsedObj.user_id ?? '';
                            timestamp = parsedObj.timestamp ? Date.parse(parsedObj.timestamp) : Date.now();
                            is_final = parsedObj.is_final ?? true;
                        } catch (parseErr) {
                            text = data;
                        }
                    } else {
                        text = String(data);
                    }

                    console.log('realtime websocket message:', parsedObj ?? text);

                    if (text) {
                        const entry = { text, speaker, time: timestamp, is_final, raw: parsedObj };

                        // update local state for in-component panel
                        setTranscriptionLines((prev) => {
                            const next = [...prev, entry];
                            return next.slice(-200);
                        });

                        // also dispatch a global event so other mounted RightPanel instances can update
                        try {
                            window.dispatchEvent(new CustomEvent('realtime-transcript', { detail: entry }));
                        } catch (evErr) {
                            // older browsers may not support CustomEvent constructor
                            try {
                                const ev = document.createEvent('CustomEvent');
                                ev.initCustomEvent('realtime-transcript', false, false, entry);
                                window.dispatchEvent(ev);
                            } catch (ignore) {}
                        }
                    }
                } catch (err) {
                    console.warn('error handling ws message', err);
                }
            };

            ws.onclose = () => console.log('realtime websocket closed');
            ws.onerror = (e) => console.warn('realtime websocket error', e);
        } catch (e) {
            console.warn('websocket init error', e);
        }

        return () => {
            if (wsRef.current) {
                try { wsRef.current.close(); } catch (e) {}
                wsRef.current = null;
            }
        };
    }, [callingState, callId, username]);

    useEffect(() => {
        if (!wsRef.current || callingState !== CallingState.JOINED) return;

        if (!mediaStream) {
            try {
                wsRef.current.send(JSON.stringify({ audio: null }));
            } catch (e) { console.warn(e); }
            return;
        }

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(mediaStream);
        sourceRef.current = source;

        const sampleRate = audioCtx.sampleRate;
        const numChannels = source.channelCount || 1;

        // samples per 250ms chunk (not used directly)

        const bufferSize = 4096;
        const processor = audioCtx.createScriptProcessor(bufferSize, numChannels, numChannels);
        processorRef.current = processor;

        let ring = new Float32Array(0);

        processor.onaudioprocess = (evt) => {
            if (!mediaStream) return; // guard

            if (isMute) {
                try { wsRef.current.send(JSON.stringify({ audio: null })); } catch (e) {}
                return;
            }

            const inputBuffers = [];
            for (let ch = 0; ch < numChannels; ch++) inputBuffers.push(evt.inputBuffer.getChannelData(ch));

            let samples = new Float32Array(inputBuffers[0].length);
            if (numChannels === 1) samples.set(inputBuffers[0]);
            else {
                for (let i = 0; i < samples.length; i++) {
                    let s = 0;
                    for (let ch = 0; ch < numChannels; ch++) s += inputBuffers[ch][i];
                    samples[i] = s / numChannels;
                }
            }

            const tmp = new Float32Array(ring.length + samples.length);
            tmp.set(ring, 0);
            tmp.set(samples, ring.length);
            ring = tmp;

            while (ring.length >= Math.floor(sampleRate * 0.25)) {
                const chunk = ring.slice(0, Math.floor(sampleRate * 0.25));
                ring = ring.slice(Math.floor(sampleRate * 0.25));

                const wavBuffer = encodeWav(chunk, sampleRate, 1);

                try {
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                        wsRef.current.send(wavBuffer);
                    }
                } catch (e) {
                    console.warn('ws send error', e);
                }
            }
        };

        source.connect(processor);
        processor.connect(audioCtx.destination);

        return () => {
            try {
                if (processorRef.current) {
                    processorRef.current.disconnect();
                    processorRef.current.onaudioprocess = null;
                    processorRef.current = null;
                }
                if (sourceRef.current) {
                    sourceRef.current.disconnect();
                    sourceRef.current = null;
                }
                if (audioCtxRef.current) {
                    try { audioCtxRef.current.close(); } catch (e) {}
                    audioCtxRef.current = null;
                }
            } catch (e) { console.warn('cleanup audio error', e); }
        };
    }, [mediaStream, isMute, callingState]);
    

    useEffect(() => {
        if (!isCallRecordingInProgress && !recording) return;

        try {
            const interval = setInterval(() => {
                call.stopRecording().then(() => {
                    call.startRecording()
                })
            }, 5 * 60 * 1000);

            return () => clearInterval(interval);
        } catch (error) {
            console.log("Some error here");
            console.warn(error);
        }
    }, [recording, isCallRecordingInProgress, call]);


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
        ];
        const maybeInterval = intervalRef.current;

        return () => {
            unsubscribers.forEach((unsub) => unsub());

            if (maybeInterval) clearInterval(maybeInterval);
            cyclingRef.current = false;
        };
    }, [call]);

    const handleCancel = async () => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        // Stop audio processor and close AudioContext
        try {
            if (processorRef.current) {
                try { processorRef.current.disconnect(); } catch (e) {}
                processorRef.current.onaudioprocess = null;
                processorRef.current = null;
            }
            if (sourceRef.current) {
                try { sourceRef.current.disconnect(); } catch (e) {}
                sourceRef.current = null;
            }
            if (audioCtxRef.current) {
                try { audioCtxRef.current.close(); } catch (e) {}
                audioCtxRef.current = null;
            }
        } catch (e) { console.warn('error stopping audio capture', e); }

        // send explicit null over websocket then close
        // try {
        //     if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        //         wsRef.current.send(JSON.stringify({ audio: null }));
        //         wsRef.current.close();
        //     }
        //     wsRef.current = null;
        // } catch (e) { console.warn('error closing websocket', e); }

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
            if (onRecordingStarted) {
                onRecordingStarted();
            }
        }
    };
    return (
        <StreamTheme>
            <div>
                <SideBySideLayout participants={Participants} />
            </div>
            <RightPanel lines={transcriptionLines} />
            <div
                style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: '10px',
                }}
            >
                {/* 🎤 Mic button with toast to the LEFT (Google-Meet style) */}
                <div
                    style={{
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <ToggleAudioPreviewButton />

                    {isMute && (
                        <div
                            style={{
                                position: 'absolute',
                                right: '110%',                // LEFT of mic
                                top: '50%',
                                transform: 'translateY(-50%)',
                                backgroundColor: '#111827',
                                color: '#F9FAFB',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                boxShadow: '0 8px 20px rgba(15,23,42,0.45)',
                                whiteSpace: 'nowrap',
                                zIndex: 999,
                            }}
                        >
                            your mic is muted. please unmute to continue.
                        </div>
                    )}
                </div>

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

