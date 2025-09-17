import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query"
import { fetchClustersByAppointment } from "../../api/clusters";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../ui/accordion"
import LoadingCard from "./LoadingCard";

//  Original clustered data (not deeply nested, still simple)


const Clusters = ({ appointmentId, username }) => {

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["clusters", appointmentId, username],
    queryFn: ()=>fetchClustersByAppointment(`${username}_${appointmentId}_clusters`, username),
  })
  const [clusteredData, setClusterData] = useState([])
  const [medicationsDiscussed, setMedicationsDiscussed] = useState([])
  const [conditionsMentioned, setConditionsMentioned] = useState({})

  useEffect(()=>{
    if(data?.data?.clustered_output){
      setClusterData(data.data.clustered_output)
    }
    if(data?.data?.medications_discussed){
      setMedicationsDiscussed(data.data.medications_discussed)
    }
    if(data?.data?.conditions_mentioned){
      setConditionsMentioned(data.data.conditions_mentioned)
    }
  },[data])

  if (isLoading) {
    return (
      <LoadingCard message="Clustering symptoms with surgical precision…" />
    );
  }

  if(error){
    return <LoadingCard />;
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="font-medium text-2xl mb-6 text-gray-800">Post-Call Clusters</h3>
      <Accordion type="multiple" collapsible = "true" className="space-y-4">
        <AccordionItem value="clustered">
          <AccordionTrigger className="text-blue-700 font-semibold text-lg">
            Clustered Output
          </AccordionTrigger>
          <AccordionContent className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            {clusteredData?.length > 0 ? (
              clusteredData.map((c) => (
                <div key={c.topic} className="mb-5">
                  <h4 className="font-semibold text-gray-900 mb-2">{c.topic}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">SOAP Section:</span> {c.soap_section || '—'}
                  </p>
                  <ul className="list-disc ml-6 space-y-1 text-gray-700">
                    {c.lines?.length > 0 ? (
                      c.lines.map((line, i) => <li key={i}>{line}</li>)
                    ) : (
                      <li className="text-gray-500 italic">No lines available.</li>
                    )}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No clustered output available.</p>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="medications">
          <AccordionTrigger className="text-blue-700 font-semibold text-lg">
            Medications Discussed
          </AccordionTrigger>
          <AccordionContent className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            {medicationsDiscussed?.length > 0 ? (
              <ul className="list-disc ml-6 space-y-1 text-gray-700">
                {medicationsDiscussed.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No medications discussed.</p>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="conditions">
          <AccordionTrigger className="text-blue-700 font-semibold text-lg">
            Conditions Mentioned ({conditionsMentioned.count || 0})
          </AccordionTrigger>
          <AccordionContent className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            {conditionsMentioned?.count > 0 && conditionsMentioned.conditions ? (
              Object.entries(conditionsMentioned.conditions).map(
                ([cond, lines]) => (
                  <div key={cond} className="mb-5">
                    <h4 className="font-semibold text-gray-900 mb-2">{cond}</h4>
                    <ul className="list-disc ml-6 space-y-1 text-gray-700">
                      {lines?.length > 0 ? (
                        lines.map((line, i) => <li key={i}>{line}</li>)
                      ) : (
                        <li className="text-gray-500 italic">No details available.</li>
                      )}
                    </ul>
                  </div>
                )
              )
            ) : (
              <p className="text-gray-500 italic">No conditions mentioned.</p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>

  );
};

export default Clusters
