import { Textarea } from "../../ui/textarea";
import { formatROS } from "../utils/soapUtils";

const SubjectiveSection = ({ isEditing, patientLine, reasonLine, soapNotes, setPatientLine, setReasonLine, setSoapNotes }) => {
  return (
    <div className="bg-gray-100 rounded-md p-4">
      <h4 className="text-blue-700 font-semibold text-lg">Subjective</h4>
      {isEditing ? (
        <div className="space-y-2">
          <Textarea value={patientLine} onChange={(e) => setPatientLine(e.target.value)} rows={2} />
          <Textarea value={reasonLine} onChange={(e) => setReasonLine(e.target.value)} rows={2} />
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
        <div className="space-y-3">
          <p className="font-bold text-base">
            {patientLine} with a chief complaint of {reasonLine}
          </p>
          {soapNotes.HPI && (
            <>
              <p className="font-semibold">HPI:</p>
              <p className="ml-4 text-base leading-relaxed">{soapNotes.HPI}</p>
            </>
          )}
          {soapNotes.ROS && (
            <>
              <p className="font-semibold">ROS:</p>
              <div className="ml-4 text-base leading-relaxed space-y-1">
                {formatROS(soapNotes.ROS).map((item, idx) => (
                  <p key={idx}>
                    <span className="font-semibold">{item.system}:</span> {item.value}
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