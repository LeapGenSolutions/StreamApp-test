import { Textarea } from "../../ui/textarea";
import { formatROS } from "../utils/soapUtils";

const SubjectiveSection = ({
  isEditing,
  patientLine,
  reasonLine,
  soapNotes,
  setPatientLine,
  setReasonLine,
  setSoapNotes,
}) => {
  return (
    <div className="space-y-3">
      <p className="font-semibold text-blue-700 text-lg">Subjective</p>

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={patientLine}
            onChange={(e) => setPatientLine(e.target.value)}
            rows={2}
            placeholder="Patient line..."
          />
          <Textarea
            value={reasonLine}
            onChange={(e) => setReasonLine(e.target.value)}
            rows={2}
            placeholder="Reason for visit..."
          />
          <Textarea
            value={soapNotes.HPI}
            onChange={(e) => setSoapNotes({ ...soapNotes, HPI: e.target.value })}
            rows={4}
            placeholder="HPI..."
          />
          <Textarea
            value={soapNotes.ROS}
            onChange={(e) => setSoapNotes({ ...soapNotes, ROS: e.target.value })}
            rows={4}
            placeholder="ROS..."
          />
        </div>
      ) : (
        <div className="space-y-2 text-base leading-relaxed text-gray-900">
          {patientLine && reasonLine && (
            <p className="font-medium">
              {patientLine} with a chief complaint of{" "}
             {reasonLine
            .replace(/^(The\s*)?(Patient|Pt)\s*(presents|reports)\s*(with\s*)?/i, "")
            .trim()}
            </p>
          )}

          {soapNotes.HPI && (
            <>
              <p className="text-base font-bold text-black">
                History of Present Illness:
              </p>
              <p className="ml-4">{soapNotes.HPI}</p>
            </>
          )}

          {soapNotes.ROS && (
            <>
              <p className="text-base font-bold text-black">Review of Symptoms:</p>
              <div className="ml-4 space-y-1">
                {formatROS(soapNotes.ROS).map((item, idx) => (
                  <p key={idx}>
                    <span className="font-bold">{item.system}:</span>{" "}
                    {item.value}
                  </p>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SubjectiveSection
