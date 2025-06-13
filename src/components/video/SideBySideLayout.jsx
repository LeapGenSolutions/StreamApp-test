import { ParticipantView } from "@stream-io/video-react-sdk";

const SideBySideLayout = ({ participants }) => {
  const isSingle = participants.length === 1;
  const isDouble = participants.length === 2;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: isSingle ? "center" : "space-between",
        gap: isDouble ? "3vw" : "0",
        padding: "2vw",
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        margin: "4vh auto",
        width: "75vw",
        border: "2px solid #222",
        borderRadius: "24px",
        background: "#181818",
        height: "65vh",
        transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
      }}
    >
      {participants.map((participant) => (
        <div
          key={participant.sessionId}
          style={{
            width: isDouble ? "48%" : isSingle ? "80%" : "auto",
            height: "100%",
            margin: isSingle ? "0 auto" : undefined,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#222",
            borderRadius: "18px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
            overflow: "hidden",
            transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
          }}
        >
          <ParticipantView participant={participant} />
        </div>
      ))}
    </div>
  );
};

export default SideBySideLayout;