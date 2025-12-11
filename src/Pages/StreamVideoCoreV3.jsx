import {
  StreamCall,
  StreamVideo,
  StreamVideoClient
} from '@stream-io/video-react-sdk';
import { useEffect, useState, useRef } from 'react';
import getUserToken from '../api/UserToken';
import { useParams, useSearchParams } from 'wouter';
import { useSelector } from 'react-redux';
import StreamVideoLayoutV4 from '../components/video/StreamVideoLayoutV4';
import { insertCallHistory } from '../api/callHistory';
import { STREAM_API_KEY } from '../constants';
import { NotesTrigger } from "../components/ui/notes-trigger";
import { FloatingNotepad } from "../components/ui/floating-notepad";


const StreamVideoCoreV3 = () => {
  const apiKey = STREAM_API_KEY;
  const me = useSelector((state) => state.me.me)
  const userId = me.aud;
  const { callId } = useParams();
  const searchParams = useSearchParams()[0]
  const patientName = searchParams.get("patient")
  const type = searchParams.get("type") || "online";
  const normalizedType = type.toLowerCase().replace(/[\s_-]/g, '');
  const isInPerson = normalizedType === "inperson";

  const role = 'doctor'
  const userName = me.given_name + " " + me.family_name
  const myEmail = me.email

  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const callRef = useRef(null);
  const [showCall, setShowCall] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rejected, setRejected] = useState(false);
  const [waitingApproval, setWaitingApproval] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [requestingUser, setRequestingUser] = useState(null);
  const [meetingStartTime, setMeetingStartTime] = useState(null);
  const [recordingReminderVisible, setRecordingReminderVisible] = useState(false);
  const [patientApproved, setPatientApproved] = useState(false);

  // Show browser notification
  const showBrowserNotification = (name) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      const notif = new Notification(`${name} wants to join the call`, {
        body: "Click here to approve.",
        icon: "https://static.wikia.nocookie.net/starwars/images/4/4c/Satele_Shan.png",
      });
      notif.onclick = () => {
        window.focus();
        setPopupVisible(true); // Show in-app popup as well on click
      };
    }
  };

  // Approve / Reject handlers
  const handleApprove = () => {
    if (!callRef.current || !requestingUser) return;
    callRef.current.sendCustomEvent({ type: "join-accepted", user: requestingUser });
    setPopupVisible(false);
    setRequestingUser(null);
    setPatientApproved(true);
  };

  const handleReject = () => {
    if (!callRef.current || !requestingUser) return;
    callRef.current.sendCustomEvent({ type: "join-rejected", user: requestingUser });
    setPopupVisible(false);
    setRequestingUser(null);
  };

  useEffect(() => {
    if (isInPerson) {
      setPatientApproved(true);
    }
  }, [isInPerson]);

  useEffect(() => {
    if (!callRef.current || !showCall || !patientApproved) return;

    const call = callRef.current;

    const timer = setTimeout(() => {
      if (!call.state.recording?.status || call.state.recording.status !== "started") {
        setRecordingReminderVisible(true);
        if (Notification.permission === "granted") {
          new Notification("Recording not started!", {
            body: "Please click the record button to start recording this session.",
            icon: "https://cdn-icons-png.flaticon.com/512/483/483947.png",
          });
        }
      }
    }, 15000);

    const handleRecordingStarted = () => {
      console.log(">>> call.recording_started fired at", new Date().toISOString());
      clearTimeout(timer);
      setRecordingReminderVisible(false);
    };

    call.on("call.recording_started", handleRecordingStarted);

    return () => {
      clearTimeout(timer);
      call.off("call.recording_started", handleRecordingStarted);
    };
  }, [showCall, patientApproved]);

  useEffect(() => {
    let isMounted = true;

    const setupCall = async () => {
      setLoading(true);
      const token = await getUserToken(userId);
      if (!token) {
        setLoading(false);
        return;
      }

      const videoClient = new StreamVideoClient({
        apiKey,
        user: { id: userId, name: myEmail },
        token,
      });

      const videoCall = videoClient.call("default", callId);

      callRef.current = videoCall;

      videoCall.on("call.session_participant_joined", (req) => {
        console.log("Session started");
        try {
          insertCallHistory(req.session_id, {
            userID: myEmail,
            appointmentID: callId,
            startTime: req.created_at,
            fullName: userName,
            patientName: patientName,
            role: "doctor"
          });
        } catch (error) {
          console.log(
            "New call History not inserted. Call history and id might exist"
          );
        }
      });

      if (role === "doctor") {
        await videoCall.join({
          data: {
            settings_override: {
              recording: {
                quality: "360p",
                mode: "available",
              },
            },
          },
          create: true,
        });

        setMeetingStartTime(Date.now());

        videoCall.on("custom", (event) => {
          if (event.custom?.type === "join-request") {
            const name = event.user?.name || "A patient";
            setRequestingUser(event.user || null);
            setPopupVisible(true);
            showBrowserNotification(name);
          }
        });

        if (isMounted) {
          setClient(videoClient);
          setCall(videoCall);
          setShowCall(true);
          setLoading(false);
        }
      } else {
        try {
          await videoCall.get();
          const count = videoCall.state.participantCount;

          if (count >= 2) {
            // Auto leave after showing message
            setShowCall(false);
            setLoading(false);
            setTimeout(() => {
              window.location.href = "/"; // or replace with navigation to home/dashboard
            }, 5000);
            return;
          }

          // Send join request and wait for approval
          videoCall.sendCustomEvent({
            type: "join-request",
            user: { id: userId, name: userName },
          });
          setWaitingApproval(true);

          videoCall.on("custom", async (event) => {
            if (event.custom.type === "join-accepted") {
              await videoCall.join();
              if (isMounted) {
                setClient(videoClient);
                setCall(videoCall);
                setShowCall(true);
                setWaitingApproval(false);
                setLoading(false);
              }
            }
            if (event.custom.type === "join-rejected") {
              setWaitingApproval(false);
              setRejected(true);
              setLoading(false);
            }
          });
        } catch (error) {
          console.error("Call does not exist yet", error);
          setLoading(false);
        }
      }
    };

    setupCall();

    return () => {
      isMounted = false;
       callRef.current?.leave().catch(() => {});
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, callId, role, apiKey, myEmail, patientName, userName]); 

  return (
    <>
      <style>
        {`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            @keyframes slideFadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }


            .join-request-popup {
                position: fixed;
                bottom: 1.5rem;
                right: 1.5rem;
                background: linear-gradient(135deg, #e0f7fa, #ffffff);
                border: 1px solid rgba(0, 0, 0, 0.1);
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                padding: 1rem 1.25rem;
                width: 340px;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                animation: slideFadeIn 0.3s ease-out;
                backdrop-filter: blur(6px);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }

            .join-request-popup:hover {
                transform: scale(1.02);
                box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
            }

            .join-request-popup .request-text {
                font-size: 1rem;
                font-weight: 600;
                color: #2c3e50;
                text-align: center;
                line-height: 1.4;
                padding: 0.25rem 0;
            }

            .join-request-popup .actions {
                margin-top: 0.25rem;
                display: flex;
                justify-content: center;
                gap: 0.75rem;
            }

            .join-request-popup button {
                padding: 0.45rem 1.1rem;
                border: none;
                border-radius: 8px;
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                color: #fff;
                transition: background-color 0.2s, transform 0.1s, box-shadow 0.2s;
            }

            .join-request-popup button:active {
                transform: scale(0.95);
            }

            .join-request-popup .approve {
                background-color: #27ae60;
            }

            .join-request-popup .approve:hover {
                background-color: #219150;
                box-shadow: 0 0 8px rgba(39, 174, 96, 0.4);
            }

            .join-request-popup .reject {
                background-color: #e74c3c;
            }

           .join-request-popup .reject:hover {
                background-color: #c0392b;
                box-shadow: 0 0 8px rgba(231, 76, 60, 0.4);
            }
        `}
      </style>

      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(255,255,255,0.85)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              border: "8px solid #f3f3f3",
              borderTop: "8px solid #3498db",
              borderRadius: "50%",
              width: "60px",
              height: "60px",
              animation: "spin 1s linear infinite",
              marginBottom: "24px",
            }}
          />
          <div style={{ fontSize: "1.2rem", color: "#222" }}>
            Loading, please wait...
          </div>
        </div>
      )}

      {!loading && rejected && (
        <div style={{ padding: "2rem" }}>
          ❌ Your request was rejected by the doctor.
        </div>
      )}

      {waitingApproval && (
        <div style={{ padding: "2rem" }}>
          ⌛ Waiting for doctor’s approval...
        </div>
      )}

      {!loading && !showCall && !waitingApproval && !rejected && (
        <div style={{ padding: "2rem" }}>
          ⚠️ The call is currently full. You will be redirected in 5 seconds...
        </div>
      )}

      {popupVisible && requestingUser && (
        <div
          className="join-request-popup"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            zIndex: 1000,
            animation: "slideFadeInUp 0.4s ease-out",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", width: "100%" }}
          >
            <span className="request-text" style={{ textAlign: "center" }}>
              <strong>{requestingUser.name}</strong> wants to join the call
            </span>
            <div className="actions">
              <button
                className="approve"
                onClick={handleApprove}
                aria-label="Approve join request"
              >
                Approve
              </button>
              <button
                className="reject"
                onClick={handleReject}
                aria-label="Reject join request"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && showCall && client && call && (
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <StreamVideoLayoutV4
              callId={callId}
              onRecordingStarted={() => setRecordingReminderVisible(false)}
            />
          </StreamCall>
        </StreamVideo>
      )}
      {!loading && showCall && role === "doctor" && (
        <>
          <NotesTrigger
            onToggle={() => setIsNotepadOpen(!isNotepadOpen)}
            isOpen={isNotepadOpen}
            patientName={patientName}
          />

          <FloatingNotepad
            isOpen={isNotepadOpen}
            onClose={() => setIsNotepadOpen(false)}
            patientName={patientName}
            appointmentId={callId}
            meetingStartTime={meetingStartTime}
            isVideoCall={true}
          />
        </>
      )}

      {recordingReminderVisible && role === "doctor" && (
        <div style={{ position:"fixed", bottom:"2rem", right:"2rem", backgroundColor:"#fff3cd", color:"#856404", border:"1px solid #ffeeba", borderRadius:"10px", padding:"1rem 1.5rem", boxShadow:"0 4px 12px rgba(0,0,0,0.15)", fontFamily:"'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", zIndex:2000, animation:"slideFadeInUp 0.4s ease-out" }}>
          <strong>⚠️ Recording not started</strong>
          <div style={{ marginTop:"0.5rem" }}>Please click the <b>Record</b> button to start recording this call.</div>
          <button style={{ marginTop:"0.75rem", backgroundColor:"#ffc107", border:"none", borderRadius:"6px", padding:"0.5rem 1rem", cursor:"pointer", fontWeight:600 }} onClick={() => setRecordingReminderVisible(false)}>Dismiss</button>
        </div>
      )}
    </>
  );
};

export default StreamVideoCoreV3;
