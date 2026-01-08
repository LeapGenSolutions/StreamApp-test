import { useMemo} from "react";
import { BookOpen, ExternalLink } from "lucide-react";
import { fetchUpToDateRecommendation } from "../../api/upToDate";
import { useQuery } from "@tanstack/react-query";
import LoadingCard from "./LoadingCard";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../ui/accordion";


const UpToDate = ({appId, username}) => {
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ["uptodate-recommendation", username],
    queryFn: () => fetchUpToDateRecommendation(appId, username),
  });


  const topics = useMemo(() => {
    if (!data) return [];
    return Object.entries(data);
  }, [data]);

  if (!data || topics.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-gray-600">
        No UpToDate results available for this encounter yet.
      </div>
    );
  }

   if (isLoading) {
        return (
            <LoadingCard message="Loading UpToDate results..." />
        );
    }

    if(error){
        return <LoadingCard />;
    }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-gray-800">UpToDate insights</p>
          <p className="text-sm text-gray-500">
            Evidence-backed guidance grouped by condition.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Curated clinical references
        </span>
      </div>

      <Accordion type="multiple" collapsible="true" className="space-y-4">
        {topics.map(([topic, payload]) => (
          <AccordionItem value={topic} key={topic}>
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <AccordionTrigger className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span className="text-base font-semibold text-gray-800">{topic}</span>
                </div>
              </AccordionTrigger>

              <AccordionContent className="space-y-4 p-4">
                <Accordion type="multiple" collapsible="true" className="space-y-3">
                  {(payload?.results || []).map((article, index) => (
                    <AccordionItem value={`${topic}-${index}`} key={`${topic}-${index}`}>
                      <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                          <div className="flex flex-wrap items-center gap-3 px-4 py-3 hover:no-underline">
                            <p className="text-lg font-semibold text-gray-900">{article.title}</p>
                          </div>

                        {article.links?.webapp?.href && (
                          <a
                            href={article.links.webapp.href}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute right-4 top-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
                          >
                            View topic
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}

                          <div className="grid gap-3">
                            {(article.results || []).map((section) => {
                              const tags = section.contentMeta?.tags || [];
                              const contentType = section.contentMeta?.contentType;
                              return (
                                <div
                                  key={section.contentMeta?.id || section.title}
                                  className="rounded-lg border border-gray-100 bg-gray-50 p-3 transition hover:border-blue-200"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                      <p className="font-medium text-gray-900">{section.title}</p>
                                      <div className="flex flex-wrap items-center gap-2">
                                        {contentType && (
                                          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                                            {contentType}
                                          </span>
                                        )}
                                        {tags.map((tag) => (
                                          <span
                                            key={tag}
                                            className="rounded-full border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    {section.links?.webapp?.href && (
                                      <a
                                        href={section.links.webapp.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
                                      >
                                        Open
                                        <ExternalLink className="h-4 w-4" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                      </div>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </section>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default UpToDate; 