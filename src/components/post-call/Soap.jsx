import { useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { useQuery } from "@tanstack/react-query";
import { fetchSoapNotes } from "../../api/soap";
import { useSelector } from "react-redux";

const Soap = ({ appointmentId }) => {
    const [soapNotes, setSoapNotes] = useState({ Subjective: "", Objective: "", Assessment: "", Plan: "" });
    const username = useSelector((state)=>state.me.me.email)
    
    const { data, isLoading, error } = useQuery({
        queryKey: "soap-notes",
        queryFn: () => fetchSoapNotes(`${username}_${appointmentId}_soap`, username)
    })

    useEffect(() => {
        if (data && !isLoading) {
            const data_splitted = data.data.soap_notes.split("\n\n");
            setSoapNotes({
                Subjective: data_splitted[0]?.replace("Subjective - ", "") || "",
                Objective: data_splitted[1]?.replace("Objective - ", "") || "",
                Assessment: data_splitted[2]?.replace("Assessment - ", "") || "",
                Plan: data_splitted[3]?.replace("Plan - ", "") || ""
            });
        }
    }, [data, isLoading]);

    if (error) {
        return <div>Unable to fetch the SOAP.........!!</div>
    }



    return (
        <div>
            <h3 className="font-medium text-lg mb-4">SOAP Notes</h3>
            <Accordion type="single" collapsible className="mb-6">
                {['Subjective', 'Objective', 'Assessment', 'Plan'].map(section => (
                    <AccordionItem value={section} key={section}>
                        <AccordionTrigger className="text-blue-700 font-semibold text-lg">{section}</AccordionTrigger>
                        <AccordionContent>
                            <Textarea
                                className="w-full mt-2"
                                placeholder={`Enter ${section.toLowerCase()}...`}
                                value={soapNotes[section]}
                                onChange={e => setSoapNotes({ ...soapNotes, [section]: e.target.value })}
                                rows={4}
                            />
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
            <div className="flex justify-end">
                <Button className="bg-blue-600 hover:bg-blue-700">Save SOAP Notes</Button>
            </div>
        </div>
    )
}

export default Soap