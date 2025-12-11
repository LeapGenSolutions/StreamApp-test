import { CheckCircle, Rocket, Lock, Bot, UserCircle, Bell, AlertTriangle } from "lucide-react";
import { useCallback } from "react";
import { PageNavigation } from "../components/ui/page-navigation";

const news = [
  {
    title: "Exciting Development in Healthcare AI",
    summary:
      "Discover how we are innovating in the field of healthcare with our latest advancements in AI.",
    date: "April 23, 2024",
    link: "#",
    image: "https://placehold.co/300x180/blue/white?text=News+1",
  },
  {
    title: "Exciting Development in Healthcare AI",
    summary:
      "Discover how we are innovating in the field of healthcare with our latest advancements in AI.",
    date: "April 23, 2024",
    link: "#",
    image: "https://placehold.co/300x180/blue/white?text=News+2",
  },
  {
    title: "Exciting Development in Healthcare AI",
    summary:
      "Discover how we are innovating in the field of healthcare with our latest advancements in AI.",
    date: "April 23, 2024",
    link: "#",
    image: "https://placehold.co/300x180/blue/white?text=News+3",
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
  const openPulseChat = useCallback(() => {
    const evt = new CustomEvent("open-pulse-chat");
    window.dispatchEvent(evt);
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
        <h2 className="text-2xl font-bold mb-2 mt-2">Latest News Articles</h2>
        <div className="w-24 h-1 bg-blue-600 rounded mb-6" />
        <div className="overflow-x-auto flex gap-6 pb-4 -mx-2 px-2">
          {news.map((n, i) => (
            <div
              key={i}
              className="min-w-[300px] max-w-[300px] bg-white rounded-xl shadow p-4 flex flex-col border border-neutral-100"
            >
              <img
                src={n.image}
                alt={n.title}
                className="rounded-lg mb-3 w-full h-36 object-cover"
              />
              <h3 className="font-semibold text-lg mb-1">{n.title}</h3>
              <p className="text-neutral-600 text-sm mb-2 line-clamp-3">
                {n.summary}
              </p>
              <div className="text-xs text-neutral-400 mb-2">{n.date}</div>
              <a
                href={n.link}
                className="text-blue-700 font-medium hover:underline flex items-center gap-1"
              >
                Read More &rarr;
              </a>
            </div>
          ))}
        </div>

        {/* Updates & Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {/* Updates Timeline */}
          <div>
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

          {/* Features */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-6 flex flex-col items-center text-center border border-neutral-100">
              <Bot className="text-blue-600 w-10 h-10" />
              <h3 className="font-semibold text-lg mt-2 mb-1">
                AI Chat Assistant
              </h3>
              <p className="text-neutral-700 text-sm mb-3">
                Get real-time assistance and support with our new AI-powered chat 
                assistant.
              </p>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition"
                onClick={openPulseChat}
              >
                Try it now
              </button>
            </div>

            <div className="bg-white rounded-xl p-6 flex flex-col items-center text-center border border-neutral-100">
              <UserCircle className="text-purple-600 w-10 h-10" />
              <h3 className="font-semibold text-lg mt-2 mb-1">
                Seismic Avatar "Nova"
              </h3>
              <p className="text-neutral-700 text-sm mb-3">
                Meet Nova, your personalized AI companion that adapts to your
                communication style and enhances your virtual care experience.
              </p>
              <button
                className="bg-purple-600 text-white px-4 py-2 rounded font-medium hover:bg-purple-700 transition"
                onClick={() => {
                  // TODO: Implement avatar interaction
                }}
              >
                Meet Nova
              </button>
            </div>
          </div>
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
