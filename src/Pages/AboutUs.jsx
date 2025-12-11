import { useState } from "react";
import {
  Video, CalendarClock, ShieldCheck, Plug, FileText, BrainCircuit,
  Smile, ActivitySquare, BarChart3, Bot, Handshake 
} from "lucide-react";
import { PageNavigation } from "../components/ui/page-navigation";

const features = [
  { icon: <Video className="text-blue-500 w-7 h-7" />, title: "Seamless Video Consultations", desc: "High-quality, reliable video calls for patient care." },
  { icon: <CalendarClock className="text-blue-500 w-7 h-7" />, title: "Intelligent Scheduling", desc: "Smart, automated appointment management." },
  { icon: <ShieldCheck className="text-blue-500 w-7 h-7" />, title: "Enterprise-Grade Security", desc: "HIPAA-compliant, end-to-end encrypted platform." },
  { icon: <Plug className="text-blue-500 w-7 h-7" />, title: "Seamless Integration", desc: "Connects with EHRs and third-party tools effortlessly." },
];

const aiCapabilities = [
  { icon: <FileText className="text-blue-500 w-9 h-9 mb-2" />, title: "Automated Documentation", desc: "AI-generated notes and summaries for every call." },
  { icon: <BrainCircuit className="text-blue-500 w-9 h-9 mb-2" />, title: "Contextual Clinical Insights", desc: "Real-time suggestions and alerts during consultations." },
  { icon: <Smile className="text-blue-500 w-9 h-9 mb-2" />, title: "Sentiment Analysis", desc: "AI detects patient mood and engagement." },
];

const roadmap = [
  { icon: <ActivitySquare className="text-blue-500 w-9 h-9 mb-2" />, title: "Remote Monitoring Integration", desc: "Connect wearable and home devices for continuous care." },
  { icon: <BarChart3 className="text-blue-500 w-9 h-9 mb-2" />, title: "Predictive Analytics", desc: "AI-driven risk and outcome predictions." },
  { icon: <Bot className="text-blue-500 w-9 h-9 mb-2" />, title: "Virtual Health Assistants", desc: "24/7 patient support and triage bots." },
];

const About = () => {
  const [tab, setTab] = useState("features");
  return (
    <div className="px-4 pb-6">
      <div className="max-w-5xl mx-auto">
        {/* Back Navigation (aligned with other pages) */}
        <div className="mt-[11px]">
          <PageNavigation showBackButton={true} hideTitle={true} />
        </div>


        {/* Hero Section */}
        <div className="rounded-2xl bg-gradient-to-tr from-blue-100 via-blue-200 to-purple-100 p-8 mt-4 mb-8 flex flex-col items-center text-center">
          {/* Remove the hero image below */}
          {/* <img src="/about-hero.png" alt="About Seismic Connect" className="w-48 h-48 object-contain mb-4" /> */}
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-500 mb-2">About Seismic Connect</h1>
          <p className="text-lg text-neutral-700 max-w-2xl mx-auto">Transforming healthcare by providing an intelligent, intuitive platform for telehealth consultations enhanced with AI-powered insights.</p>
        </div>

        {/* Mission Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-2 flex items-center">Our Mission <span className="ml-2 w-12 h-1 bg-blue-500 rounded" /></h2>
          <div className="bg-blue-50 rounded-2xl flex flex-col md:flex-row items-center justify-between p-8">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-blue-700 mb-2">Humanizing Healthcare Through Technology</h3>
              <p className="text-neutral-700 mb-4">
                Seismic Connect leverages AI to handle administrative documentation—giving healthcare providers more time and focus to build authentic, empathetic relationships with patients.
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition">Learn More</button>
            </div>
            <div className="ml-0 md:ml-8 mt-8 md:mt-0 flex flex-col items-center justify-center">
              <Handshake className="w-20 h-20 text-blue-500 mb-2" />
              {/* Or use <Heart className="w-20 h-20 text-blue-500 mb-2" /> for a heart icon */}
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Our Core Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center text-center">
              <span className="text-blue-500 text-3xl mb-2">💙</span>
              <h4 className="font-semibold mb-1">Empathy</h4>
              <p className="text-sm text-neutral-500">We prioritize compassion in every patient interaction.</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center text-center">
              <span className="text-blue-500 text-3xl mb-2">🧠</span>
              <h4 className="font-semibold mb-1">Innovation</h4>
              <p className="text-sm text-neutral-500">We drive forward with bold, AI-powered solutions.</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center text-center">
              <span className="text-blue-500 text-3xl mb-2">🛡️</span>
              <h4 className="font-semibold mb-1">Reliability</h4>
              <p className="text-sm text-neutral-500">We ensure consistent, secure performance at scale.</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center text-center">
              <span className="text-blue-500 text-3xl mb-2">🌐</span>
              <h4 className="font-semibold mb-1">Accessibility</h4>
              <p className="text-sm text-neutral-500">We build inclusive tools for global reach.</p>
            </div>
          </div>
        </div>

        {/* Technology Tabs */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Our Technology</h2>
          <div className="flex space-x-2 mb-6 border-b border-neutral-200">
            <button
              className={`px-4 py-2 font-medium border-b-2 transition ${tab === "features" ? "border-blue-600 text-blue-700" : "border-transparent text-neutral-500 hover:text-blue-600"}`}
              onClick={() => setTab("features")}
            >
              Platform Features
            </button>
            <button
              className={`px-4 py-2 font-medium border-b-2 transition ${tab === "ai" ? "border-blue-600 text-blue-700" : "border-transparent text-neutral-500 hover:text-blue-600"}`}
              onClick={() => setTab("ai")}
            >
              AI Capabilities
            </button>
            <button
              className={`px-4 py-2 font-medium border-b-2 transition ${tab === "roadmap" ? "border-blue-600 text-blue-700" : "border-transparent text-neutral-500 hover:text-blue-600"}`}
              onClick={() => setTab("roadmap")}
            >
              Future Roadmap
            </button>
          </div>
          <div>
            {tab === "features" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {features.map((f, i) => (
                  <div key={i} className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center">
                    {f.icon}
                    <h4 className="font-semibold mt-3 mb-1">{f.title}</h4>
                    <p className="text-sm text-neutral-500">{f.desc}</p>
                  </div>
                ))}
              </div>
            )}
            {tab === "ai" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {aiCapabilities.map((a, i) => (
                  <div key={i} className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center">
                    {a.icon}
                    <h4 className="font-semibold mb-1">{a.title}</h4>
                    <p className="text-sm text-neutral-500">{a.desc}</p>
                  </div>
                ))}
              </div>
            )}
            {tab === "roadmap" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {roadmap.map((r, i) => (
                  <div key={i} className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center">
                    {r.icon}
                    <h4 className="font-semibold mb-1">{r.title}</h4>
                    <p className="text-sm text-neutral-500">{r.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;