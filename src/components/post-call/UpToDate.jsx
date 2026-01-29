import { BookOpen, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRecommendationByAppointment } from "../../api/recommendations";
import LoadingCard from "./LoadingCard";

// Fetch fallback data if component not provided `data`
const UpToDate = ({ appId, username, data }) => {
  const { data: upToDate, isLoading, error } = useQuery({
    queryKey: ["recommendations", appId, username],
    queryFn: () =>
      fetchRecommendationByAppointment(
        `${username}_${appId}_recommendations`,
        username
      ),
  });

  const upToDateResult = data?.uptodate_results || upToDate?.data?.uptodate_results;

  const cleanSnippet = (s = "") => s.replace(/&hellip;/g, "…").replace(/\s+/g, " ");

  // local state for reference collapse toggles (declared before any returns)
  const [openRefs, setOpenRefs] = useState({});
  const toggleRefs = (i) => setOpenRefs((s) => ({ ...s, [i]: !s[i] }));

  // If the parent didn't provide `data`, show loading / error states from the query
  if (!data && isLoading) {
    return <LoadingCard message="From symptoms to strategy… aligning recommendations." />;
  }

  if (!data && error) {
    return <LoadingCard />;
  }

  // Normalize to a `topics` array for the newer format, fall back to legacy `results`
  const topics = upToDateResult?.topics || (upToDateResult?.results || []).map((r) => ({
    topic: r.title,
    summary: r.snippet,
    references: r.references || (r.webapp_link ? [{ title: r.title, link: r.webapp_link, reason: "" }] : []),
    contentMeta: r.contentMeta,
  }));
  

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-2">
        <BookOpen size={20} />
        <h2 className="text-lg font-semibold">UpToDate — Recommendations</h2>
      </div>

      <div className="flex flex-col gap-4">
        {topics.map((t, idx) => (
          <article
            key={idx}
            className="border rounded-lg p-5 shadow-sm bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {t.topic}
                </h3>

                <div className="text-sm text-slate-700 dark:text-slate-300 mb-3" style={{ maxHeight: '7.5rem', overflow: 'hidden' }}>
                  {cleanSnippet(t.summary).length > 520
                    ? `${cleanSnippet(t.summary).slice(0, 520)}…`
                    : cleanSnippet(t.summary)}
                </div>

                {t.references?.length > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={() => toggleRefs(idx)}
                      aria-expanded={!!openRefs[idx]}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border shadow-sm text-sm font-medium ${openRefs[idx] ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'}`}
                    >
                      <span>References</span>
                      <span className="text-xs text-white/90">({t.references.length})</span>
                      <svg
                        className={`w-3 h-3 transform transition-transform ${openRefs[idx] ? "rotate-180" : "rotate-0"}`}
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button> 

                    {openRefs[idx] && (
                      <ul className="text-sm space-y-3 pl-4 mt-3">
                        {t.references.map((ref, i) => (
                          <li key={i} className="">
                            <div className="flex items-start gap-2">
                              <a href={ref.link} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline flex items-center gap-2 font-medium break-words">
                                <span className="text-slate-900 dark:text-slate-100">{ref.title || ref.link}</span>
                                <ExternalLink size={14} />
                              </a>
                            </div>
                            {ref.reason ? <div className="text-sm text-slate-700 dark:text-slate-400 mt-1">{ref.reason}</div> : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-start gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                  {t.contentMeta?.audience || "patient"}
                </span>
                <span className="text-xs text-muted-foreground">{t.contentMeta?.contentType}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default UpToDate;