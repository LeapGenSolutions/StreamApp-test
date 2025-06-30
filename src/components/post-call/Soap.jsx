import { useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { useQuery,useMutation } from "@tanstack/react-query";
import { fetchSoapNotes,updateSoapNotes} from "../../api/soap";
import { useSelector } from "react-redux";
import LoadingCard from "./LoadingCard"; // Adjust if path is different

const Soap = ({ appointmentId }) => {
  const username = useSelector((state) => state.me.me.email);
  const [soapNotes, setSoapNotes] = useState({ Subjective: "", Objective: "", Assessment: "", Plan: "" });
  const [initialNotes, setInitialNotes] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["soap-notes", appointmentId],
    queryFn: () => fetchSoapNotes(`${username}_${appointmentId}_soap`, username),
  });

  useEffect(() => {
    if (data && !isLoading) {
      const raw = data?.data?.soap_notes || "";
      const parts = raw.split("\n\n");
if (isLoading) {
    return <LoadingCard message="Your SOAP’s lathering... please hold." />;
  }
      const parsed = {
        Subjective: parts[0]?.replace("Subjective - ", "") || "",
        Objective: parts[1]?.replace("Objective - ", "") || "",
        Assessment: parts[2]?.replace("Assessment - ", "") || "",
        Plan: parts[3]?.replace("Plan - ", "") || "",
      };

      setSoapNotes(parsed);
      setInitialNotes(parsed);
    }
  }, [data, isLoading]);

  const mutation = useMutation({
    mutationFn: (updatedNotes) =>
      updateSoapNotes(`${username}_${appointmentId}_soap`, username, updatedNotes),
    onSuccess: () => {
      refetch();
      setIsEditing(false);
    },
    onError: () => {
      alert("❌ Failed to save SOAP notes. Please try again.");
    },
  });

  const handleSave = () => {
    const combined = `Subjective - ${soapNotes.Subjective}\n\nObjective - ${soapNotes.Objective}\n\nAssessment - ${soapNotes.Assessment}\n\nPlan - ${soapNotes.Plan}`;
    mutation.mutate(combined);
  };

  const handleCancel = () => {
    setSoapNotes(initialNotes);
    setIsEditing(false);
  };

  if (isLoading) {
    return <LoadingCard message="Your SOAP’s lathering... please hold." />;
  }
  
  if(error){
    return <LoadingCard />;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">SOAP Notes</h3>

      <Accordion type="single" collapsible className="mb-6">
        {["Subjective", "Objective", "Assessment", "Plan"].map((section) => (
          <AccordionItem value={section} key={section}>
            <AccordionTrigger className="text-blue-700 font-semibold text-lg">
              {section}
            </AccordionTrigger>
            <AccordionContent
              className={`rounded-md p-4 ${isEditing ? "bg-white" : "bg-gray-100"}`}
            >
              <Textarea
              className={`w-full mt-2 border rounded ${
              isEditing ? "bg-white border-gray-300" : "bg-gray-100 border-gray-200"
              }`}
             placeholder={`Enter ${section.toLowerCase()}...`}
             value={soapNotes[section]}
             onChange={(e) =>
             setSoapNotes({ ...soapNotes, [section]: e.target.value })
            }
            rows={4}
           readOnly={!isEditing}
          />

            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="flex justify-end gap-3">
        {!isEditing ? (
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-yellow-600 text-white hover:bg-yellow-700"
          >
            Edit
          </Button>
        ) : (
          <>
            <Button
              onClick={handleSave}
              disabled={mutation.isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {mutation.isLoading ? "Saving..." : "Save SOAP Notes"}
            </Button>
            <Button
              onClick={handleCancel}
              className="bg-gray-500 hover:bg-gray-600"
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Soap
