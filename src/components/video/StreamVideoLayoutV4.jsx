import { CallingState, CancelCallButton, StreamTheme, ToggleAudioPreviewButton, ToggleVideoPreviewButton, useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import SideBySideLayout from "./SideBySideLayout";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaCircle, FaStopCircle } from 'react-icons/fa';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useSelector } from "react-redux";
import sendMessageToQueue from "../../api/SendMessageToQueue";
import { navigate } from "wouter/use-browser-location";

const AUDIO_CHUNK_SECONDS = 0.12;
const AUDIO_BUFFER_SIZE = 2048;

const extractTranscriptSpeaker = (payload) =>
    payload?.speaker ??
    payload?.speaker_name ??
    payload?.speakerName ??
    payload?.speaker_label ??
    payload?.speakerLabel ??
    payload?.participant_name ??
    payload?.participantName ??
    payload?.participant ??
    payload?.role ??
    payload?.user_id ??
    payload?.userId ??
    '';

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

    const wsRef = useRef(null);
    const audioCtxRef = useRef(null);
    const processorRef = useRef(null);
    const sourceRef = useRef(null);
    const mixDestinationRef = useRef(null);
    const silentGainRef = useRef(null);
    const inputSourcesRef = useRef([]);
    const transcriptionStreamsRef = useRef([]);

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

    const stopRealtimeAudioCapture = useCallback(() => {
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

            if (mixDestinationRef.current) {
                mixDestinationRef.current.disconnect();
                mixDestinationRef.current = null;
            }

            inputSourcesRef.current.forEach((sourceNode) => {
                try {
                    sourceNode.disconnect();
                } catch (e) {}
            });
            inputSourcesRef.current = [];

            if (silentGainRef.current) {
                silentGainRef.current.disconnect();
                silentGainRef.current = null;
            }

            if (audioCtxRef.current) {
                try { audioCtxRef.current.close(); } catch (e) {}
                audioCtxRef.current = null;
            }
        } catch (e) {
            console.warn('cleanup audio error', e);
        }
    }, []);

    const transcriptionStreams = useMemo(() => {
        const streams = [];

        if (!isMute && mediaStream?.getAudioTracks?.().some((track) => track.readyState === 'live')) {
            streams.push({
                key: `local:${mediaStream.id || 'local'}`,
                stream: mediaStream,
            });
        }

        Participants.forEach((participant) => {
            if (participant?.isLocalParticipant) return;

            const participantAudioStream = participant?.audioStream;
            const hasLiveTrack = participantAudioStream?.getAudioTracks?.().some(
                (track) => track.readyState === 'live'
            );

            if (!hasLiveTrack) return;

            streams.push({
                key: `remote:${participant?.sessionId || participant?.userId || participantAudioStream.id || 'participant'}`,
                stream: participantAudioStream,
            });
        });

        return streams;
    }, [Participants, isMute, mediaStream]);

    const transcriptionStreamSignature = useMemo(
        () =>
            transcriptionStreams
                .map(({ key, stream }) => {
                    const trackIds = (stream?.getAudioTracks?.() || [])
                        .map((track) => `${track.id}:${track.readyState}`)
                        .join(',');
                    return `${key}:${stream?.id || 'stream'}:${trackIds}`;
                })
                .join('|'),
        [transcriptionStreams]
    );

    useEffect(() => {
        transcriptionStreamsRef.current = transcriptionStreams;
    }, [transcriptionStreams]);

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
                            speaker = extractTranscriptSpeaker(parsedObj);
                            const parsedTimestamp = parsedObj.timestamp
                              ? Date.parse(parsedObj.timestamp)
                              : NaN;
                            timestamp = Number.isFinite(parsedTimestamp)
                              ? parsedTimestamp
                              : Date.now();
                            is_final = parsedObj.is_final ?? true;
                        } catch (parseErr) {
                            text = data;
                        }
                    } else {
                        text = String(data);
                    }

                    const normalizedText = String(text || '').trim();

                    if (normalizedText) {
                        const entry = {
                            text: normalizedText,
                            speaker,
                            time: timestamp,
                            is_final,
                            raw: parsedObj,
                        };

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
        stopRealtimeAudioCapture();

        const activeTranscriptionStreams = transcriptionStreamsRef.current;

        if (!wsRef.current || callingState !== CallingState.JOINED) return;

        if (activeTranscriptionStreams.length === 0) {
            try {
                wsRef.current.send(JSON.stringify({ audio: null }));
            } catch (e) { console.warn(e); }
            return;
        }

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;

        const destination = audioCtx.createMediaStreamDestination();
        mixDestinationRef.current = destination;

        const connectedSources = [];
        activeTranscriptionStreams.forEach(({ stream }) => {
            try {
                const inputSource = audioCtx.createMediaStreamSource(stream);
                inputSource.connect(destination);
                connectedSources.push(inputSource);
            } catch (e) {
                console.warn('audio source init error', e);
            }
        });

        inputSourcesRef.current = connectedSources;

        if (connectedSources.length === 0) {
            try {
                wsRef.current.send(JSON.stringify({ audio: null }));
            } catch (e) { console.warn(e); }
            stopRealtimeAudioCapture();
            return;
        }

        const source = audioCtx.createMediaStreamSource(destination.stream);
        sourceRef.current = source;

        const sampleRate = audioCtx.sampleRate;
        const numChannels = 1;
        const chunkSamples = Math.max(1, Math.floor(sampleRate * AUDIO_CHUNK_SECONDS));

        // Smaller buffer/chunk reduces perceived transcript latency.
        const bufferSize = AUDIO_BUFFER_SIZE;
        const processor = audioCtx.createScriptProcessor(bufferSize, numChannels, numChannels);
        processorRef.current = processor;

        let ring = new Float32Array(0);

        processor.onaudioprocess = (evt) => {
            if (activeTranscriptionStreams.length === 0) return;

            const inputBuffer = evt.inputBuffer.getChannelData(0);
            const samples = new Float32Array(inputBuffer.length);
            samples.set(inputBuffer);

            const tmp = new Float32Array(ring.length + samples.length);
            tmp.set(ring, 0);
            tmp.set(samples, ring.length);
            ring = tmp;

            while (ring.length >= chunkSamples) {
                const chunk = ring.slice(0, chunkSamples);
                ring = ring.slice(chunkSamples);

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
        const silentGain = audioCtx.createGain();
        silentGain.gain.value = 0;
        silentGainRef.current = silentGain;
        processor.connect(silentGain);
        silentGain.connect(audioCtx.destination);

        return () => {
            stopRealtimeAudioCapture();
        };
    }, [callingState, stopRealtimeAudioCapture, transcriptionStreamSignature]);
    

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
        stopRealtimeAudioCapture();

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
        navigate(`/post-call/${callId}?username=${username}`, { state: { from: "video-call" } });
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
