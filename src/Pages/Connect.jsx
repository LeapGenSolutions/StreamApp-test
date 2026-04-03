import { CheckCircle, Rocket, Lock, Bell, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { PageNavigation } from "../components/ui/page-navigation";

const SITE_URL = "https://www.seismicconnect.com";
const SITE_SNAPSHOT_URL = "https://r.jina.ai/http://www.seismicconnect.com";

const fallbackNews = [
  {
    title: "Launching Soon",
    summary:
      "The official SeismicConnect.com site is currently showing its launch announcement. Visit the site for the latest public updates.",
    date: "SeismicConnect.com",
    link: SITE_URL,
    gradient: "from-blue-600 to-blue-800",
    label: "Seismic Connect",
    sublabel: "Healthcare Intelligence",
  },
  {
    title: "Contact Us",
    summary:
      "The public site includes a contact section so visitors can reach out directly to the Seismic team.",
    date: "SeismicConnect.com",
    link: SITE_URL,
    gradient: "from-blue-500 to-indigo-700",
    label: "Contact Us",
    sublabel: "Reach Out Anytime",
  },
  {
    title: "Join the Email List",
    summary:
      "SeismicConnect.com invites visitors to sign up for updates, promotions, and future announcements.",
    date: "SeismicConnect.com",
    link: SITE_URL,
    gradient: "from-slate-800 to-slate-950",
    label: "Stay Updated",
    sublabel: "Join Our Mailing List",
  },
];

const updates = [
  {
    icon: <CheckCircle className="text-green-500 w-5 h-5" />,
    version: "v2.3.4",
    desc: "Improved video latency",
  },
  {
    icon: <Rocket className="text-blue-500 w-5 h-5" />,
    version: "v2.3.3",
    desc: "Launched AI chat summaries",
  },
  {
    icon: <Lock className="text-blue-400 w-5 h-5" />,
    version: "v2.3.2",
    desc: "Security patch",
  },
];

export default function Connect() {
  const [news, setNews] = useState(fallbackNews);

  useEffect(() => {
    let isActive = true;

    const buildFallback = () => fallbackNews;

    const parseSiteSnapshot = (text) => {
      const normalized = String(text || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (normalized.length === 0) {
        return buildFallback();
      }

      const launchLine =
        normalized.find((line) => /launching soon/i.test(line)) || "Launching Soon";
      const contactLine =
        normalized.find((line) => /^##?\s*contact us$/i.test(line)) || "Contact Us";
      const emailLine =
        normalized.find((line) => /sign up for our email list/i.test(line)) ||
        "Sign up for updates, promotions, and more.";

      return [
        {
          title: launchLine.replace(/^#+\s*/, ""),
          summary:
            "Live public-site snapshot from SeismicConnect.com. Open the official site to view the latest landing-page updates.",
          date: "SeismicConnect.com",
          link: SITE_URL,
          gradient: "from-blue-600 to-blue-800",
          label: "Seismic Connect",
          sublabel: "Healthcare Intelligence",
        },
        {
          title: contactLine.replace(/^#+\s*/, ""),
          summary:
            "The official site currently highlights its contact form for inquiries and outreach.",
          date: "SeismicConnect.com",
          link: SITE_URL,
          gradient: "from-blue-500 to-indigo-700",
          label: "Contact Us",
          sublabel: "Reach Out Anytime",
        },
        {
          title: "Email Updates",
          summary: emailLine,
          date: "SeismicConnect.com",
          link: SITE_URL,
          gradient: "from-slate-800 to-slate-950",
          label: "Stay Updated",
          sublabel: "Join Our Mailing List",
        },
      ];
    };

    const loadSiteHighlights = async () => {
      try {
        const response = await fetch(SITE_SNAPSHOT_URL);
        if (!response.ok) {
          throw new Error("Could not load SeismicConnect.com snapshot");
        }

        const snapshot = await response.text();
        if (isActive) {
          setNews(parseSiteSnapshot(snapshot));
        }
      } catch {
        if (isActive) {
          setNews(buildFallback());
        }
      }
    };

    loadSiteHighlights();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="px-4 pb-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Navigation */}
        <div className="mt-[11px]">
          <PageNavigation showBackButton={true} hideTitle={true} />
        </div>

        {/* Emergency Support Banner */}
        <div className="rounded-2xl bg-gradient-to-tr from-blue-50 via-blue-100 to-white p-8 mt-4 mb-6 text-center">
          <h1 className="text-5xl font-bold text-blue-800 mb-2">Connect</h1>
          <p className="text-lg text-neutral-700 max-w-2xl mx-auto">
            Bridging the gap between healthcare providers and technology: Your
            gateway to smarter, more efficient patient care.
          </p>
        </div>

        {/* Slim Emergency Support Banner (moved below hero to save space near back button) */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg mb-8 overflow-hidden">
          <div className="animate-scroll-banner whitespace-nowrap py-1 text-xs md:text-sm text-blue-800 flex items-center gap-2 px-3">
            <Bell className="w-4 h-4 text-blue-600" />
            <span className="font-medium">🔔 Seismic Support:</span>
            <span>
              For time-sensitive clinical or platform issues, contact your
              designated emergency support team through your usual channels.
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500 ml-2" />
            <span className="text-amber-600 font-medium">
              Use only for urgent disruptions requiring immediate attention.
            </span>
          </div>
        </div>

        {/* News Carousel */}
        <h2 className="text-2xl font-bold mb-2 mt-2">Latest From SeismicConnect.com</h2>
        <div className="w-24 h-1 bg-blue-600 rounded mb-6" />
        <div className="overflow-x-auto flex gap-6 pb-4 -mx-2 px-2">
          {news.map((n, i) => (
            <div
              key={i}
              className="min-w-[300px] max-w-[300px] bg-white rounded-xl shadow p-4 flex flex-col border border-neutral-100"
            >
              <div className={`rounded-lg mb-3 w-full h-36 bg-gradient-to-br ${n.gradient || 'from-blue-600 to-blue-800'} flex flex-col items-center justify-center`}>
                <span className="text-white font-bold text-lg">{n.label || n.title}</span>
                {n.sublabel && <span className="text-white/70 text-sm mt-1">{n.sublabel}</span>}
              </div>
              <h3 className="font-semibold text-lg mb-1">{n.title}</h3>
              <p className="text-neutral-600 text-sm mb-2 line-clamp-3">
                {n.summary}
              </p>
              <div className="text-xs text-neutral-400 mb-2">{n.date}</div>
              <a
                href={n.link}
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 font-medium hover:underline flex items-center gap-1"
              >
                Visit Site &rarr;
              </a>
            </div>
          ))}
        </div>

        {/* Updates */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-2">New Updates</h2>
          <div className="w-20 h-1 bg-blue-600 rounded mb-4" />
          <ul className="space-y-4">
            {updates.map((u, i) => (
              <li key={i} className="flex items-center gap-3">
                {u.icon}
                <span className="font-semibold mr-2">{u.version}</span>
                <span className="text-neutral-700">{u.desc}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Add custom styles for the scrolling banner */}
        <style jsx>{`
          @keyframes scroll-banner {
            0% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
          .animate-scroll-banner {
            animation: scroll-banner 20s linear infinite;
          }
          .animate-scroll-banner:hover {
            animation-play-state: paused;
          }
        `}</style>
      </div>
    </div>
  );
}
