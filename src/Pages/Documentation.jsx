import { useState } from "react";
import {
  LayoutDashboard, User, MessageCircle,
  UserCog, RefreshCcw, Lock, Newspaper, Bot, Calendar, BarChart2, Star,
  Link as LinkIcon, Video, FileText, Users
} from "lucide-react";
import { PageNavigation } from "../components/ui/page-navigation";

const tabs = [
  "Introduction",
  "Getting Started",
  "Navigation Guide",
  "Feature Walkthroughs",
  "Tips & Best Practices",
  "FAQ",
  "Support"
];

function GettingStartedTab() {
  const [openStep, setOpenStep] = useState(1);
  const steps = [
    {
      icon: <Lock className="w-6 h-6 text-blue-500" />,
      title: "Sign In or Continue as Guest",
      num: 1, details: (
        <ul className="text-sm list-disc ml-6 mt-2 space-y-1">
          <li>Click <b>Sign in</b> to log in securely with your Microsoft account. You will be redirected to the Microsoft login page to authenticate.</li>
          <li>Or, click <b>Continue as Guest</b> for limited access without signing in.</li>
        </ul>
      )
    },
    {
      icon: <LayoutDashboard className="w-6 h-6 text-blue-500" />,
      title: "Explore the Dashboard & Features",
      num: 2, details: (
        <ul className="text-sm list-disc ml-6 mt-2 space-y-1">
          <li>After signing in, you'll be taken to the dashboard.</li>
          <li>View upcoming appointments, transcripts, and summaries.</li>
          <li>Navigate to Patients, Reports, Chat, or Settings from the sidebar.</li>
          <li>Access clinical documentation, patient management, and video call features.</li>
        </ul>
      )
    },
    {
      icon: <UserCog className="w-6 h-6 text-blue-500" />,
      title: "View Your Profile (Optional)",
      num: 3, details: (
        <ul className="text-sm list-disc ml-6 mt-2 space-y-1">
          <li>Click your avatar at the top right to view your profile information.</li>
          <li>Profile editing options (such as name, specialty, timezone, and notifications) may be limited or coming soon in the Settings page.</li>
        </ul>
      )
    },
    {
      icon: <BarChart2 className="w-6 h-6 text-blue-500" />,
      title: "Get Help and Support",
      num: 4, details: (
        <ul className="text-sm list-disc ml-6 mt-2 space-y-1">
          <li>Use the in-app AI Chat Assistant (Pulse) by clicking the chat icon for real-time help and guidance.</li>
          <li>For further support, go to the <b>Contact Us</b> page from the sidebar to submit a support ticket or send an email to the support team.</li>
          <li>For urgent issues, refer to emergency support instructions in the Connect or Support sections.</li>
        </ul>
      )
    },
  ];
  return (
    <div className="max-w-3xl mx-auto px-4">
      <PageNavigation 
        title="Documentation"
        subtitle="Getting started guides and help resources"
        showBackButton={false}
      />
      <h2 className="text-2xl font-bold mb-1">Getting Started</h2>
      <p className="mb-6 text-neutral-600">Follow these steps to get started as a user of the Seismic application. For best results, use the latest version of Chrome or Firefox.</p>
      <div className="space-y-2 mb-6">
        {steps.map((step) => (
          <div
            key={step.num}
            className={`rounded-lg transition group cursor-pointer px-0 py-1 ${openStep === step.num ? '' : 'hover:bg-blue-50'}`}
            onClick={() => setOpenStep(openStep === step.num ? null : step.num)}
          >
            <div className="flex items-center px-2 py-2 select-none">
              <span className="w-6 h-6 flex items-center justify-center text-blue-500 mr-3">{step.icon}</span>
              <span className="bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded text-xs mr-2">STEP {step.num}</span>
              <span className="truncate font-semibold text-neutral-800 flex-1">{step.title}</span>
              <span className="ml-2 flex items-center justify-center">
                <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openStep === step.num ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </span>
            </div>
            {openStep === step.num && (
              <div className="bg-[#f8f9fa] rounded-xl shadow-sm p-5 mt-2 animate-slide-down">
                {step.details}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function NavigationGuideAccordion() {
  const [openSection, setOpenSection] = useState(null);
  const sections = [
    {
      icon: <LayoutDashboard className="w-7 h-7 text-blue-500" />,
      title: "Dashboard",
      details: (
        <>
          {/* Subtle, professional Dashboard walkthrough section with smaller font and neutral colors */}
          <div
            className="flex flex-col md:flex-row items-center md:items-start py-8 gap-8 relative"
            style={{ background: 'linear-gradient(135deg, #f6f8fa 0%, #f3f7fd 100%)', borderRadius: '1.5rem' }}
          >
            {/* Left: Subtle feature list with smaller font */}
            <div className="flex-1 min-w-0 md:pr-6">
              <ul className="space-y-4 text-base text-neutral-800 font-normal">
                <li>
                  <span className="font-semibold text-neutral-900">Today's Schedule:</span>
                  <span className="ml-2 text-neutral-700">See your total appointments for the day</span>
                </li>
                <li>
                  <span className="font-semibold text-neutral-900">Status Overview:</span>
                  <span className="ml-2 text-neutral-700">Track Completed, In Progress, Waiting, and No-Show appointments</span>
                </li>
                <li>
                  <span className="font-semibold text-neutral-900">Quick Actions:</span>
                  <span className="ml-2 text-neutral-700">Join video calls, view appointment details, and more</span>
                </li>
              </ul>
              <button
                id="explore-dashboard-btn"
                className="mt-8 px-5 py-2 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition text-sm"
                style={{ display: 'none' }}
                onClick={() => window.location.href = '/'}
              >
                Explore your Dashboard
              </button>
            </div>
            {/* Right: Video card with clean heading */}
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md flex flex-col items-center md:items-start border border-neutral-200">
              <div className="mb-2 text-lg font-bold text-neutral-900">
                Dashboard Video Walkthrough
              </div>
              <div className="text-xs text-neutral-500 mb-3">A quick tour of your homepage features</div>
              <video
                src="/dashboard.mp4"
                controls
                controlsList="nodownload"
                className="w-full rounded-xl object-cover shadow"
                style={{ background: '#000' }}
                onContextMenu={e => e.preventDefault()}
                onEnded={() => {
                  const btn = document.getElementById('explore-dashboard-btn');
                  if (btn) btn.style.display = 'flex';
                }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </>
      ),
      description: "Your homepage provides an at-a-glance view of your daily activity. From here, you can:"
    },
    {
      icon: <Calendar className="w-7 h-7 text-blue-500" />,
      title: "Appointments",
      details: (
        <>
          {/* Subtle, professional Appointments walkthrough section with video */}
          <div
            className="flex flex-col md:flex-row items-center md:items-start py-8 gap-8 relative"
            style={{ background: 'linear-gradient(135deg, #f6f8fa 0%, #f3f7fd 100%)', borderRadius: '1.5rem' }}
          >
            {/* Left: Appointments feature list */}
            <div className="flex-1 min-w-0 md:pr-6">
              <ul className="space-y-4 text-base text-neutral-800 font-normal">
                <li>
                  <span className="font-semibold text-neutral-900">View Upcoming & Past Appointments:</span>
                  <span className="ml-2 text-neutral-700">See your full schedule and appointment history</span>
                </li>
                <li>
                  <span className="font-semibold text-neutral-900">Manage Appointments:</span>
                  <span className="ml-2 text-neutral-700">Reschedule, cancel, or join video calls directly</span>
                </li>
                <li>
                  <span className="font-semibold text-neutral-900">Sync with Calendar:</span>
                  <span className="ml-2 text-neutral-700">(If enabled) Keep your appointments in sync with your calendar</span>
                </li>
              </ul>
              <button
                id="explore-appointments-btn"
                className="mt-8 px-5 py-2 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition text-sm"
                style={{ display: 'none' }}
                onClick={() => window.location.href = '/appointments'}
              >
                Explore your Appointments
              </button>
            </div>
            {/* Right: Video card with clean heading */}
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md flex flex-col items-center md:items-start border border-neutral-200">
              <div className="mb-2 text-lg font-bold text-neutral-900">
                Appointments Video Walkthrough
              </div>
              <div className="text-xs text-neutral-500 mb-3">A quick tour of your appointments features</div>
              <video
                src="/appointments.mp4"
                controls
                controlsList="nodownload"
                className="w-full rounded-xl object-cover shadow"
                style={{ background: '#000' }}
                onContextMenu={e => e.preventDefault()}
                onEnded={() => {
                  const btn = document.getElementById('explore-appointments-btn');
                  if (btn) btn.style.display = 'flex';
                }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </>
      ),
      description: "This section helps you manage your clinical schedule with ease:"
    },
    {
      icon: <User className="w-7 h-7 text-blue-500" />,
      title: "Patients",
      details: (
        <>
          {/* Subtle, professional Patients walkthrough section with video */}
          <div
            className="flex flex-col md:flex-row items-center md:items-start py-8 gap-8 relative"
            style={{ background: 'linear-gradient(135deg, #f6f8fa 0%, #f3f7fd 100%)', borderRadius: '1.5rem' }}
          >
            {/* Left: Patients feature list (key highlights) */}
            <div className="flex-1 min-w-0 md:pr-6">
              <ul className="space-y-4 text-base text-neutral-800 font-normal">
                <li>Search patients by name or advanced filters.</li>
                <li>Filter by doctor or appointment date range</li>
                <li>View patient list with contact, last visit, and assigned doctor</li>
                <li>Click a patient for clinical summary and appointment history</li>
                <li>Access Post-Call Documentation: SOAP, Transcript, Billing, Recommendations</li>
              </ul>
              <button
                id="explore-patients-btn"
                className="mt-8 px-5 py-2 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition text-sm"
                style={{ display: 'none' }}
                onClick={() => window.location.href = '/patients'}
              >
                Explore your Patients
              </button>
            </div>
            {/* Right: Video card with clean heading */}
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md flex flex-col items-center md:items-start border border-neutral-200">
              <div className="mb-2 text-lg font-bold text-neutral-900">
                Patients Video Walkthrough
              </div>
              <div className="text-xs text-neutral-500 mb-3">Key Highlights</div>
              <video
                src="/patients.mp4"
                controls
                controlsList="nodownload"
                className="w-full rounded-xl object-cover shadow"
                style={{ background: '#000' }}
                onContextMenu={e => e.preventDefault()}
                onEnded={() => {
                  const btn = document.getElementById('explore-patients-btn');
                  if (btn) btn.style.display = 'flex';
                }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </>
      ),
      description: "Access and manage your patient records securely:"
    },
    {
      icon: <BarChart2 className="w-7 h-7 text-blue-500" />,
      title: "Reports",
      details: (
        <ul className="space-y-4 text-base text-neutral-800 font-normal">
          <li>View a summary of services used by each doctor, including total sessions conducted.</li>
          <li>Access billing breakdowns showing charges incurred based on usage (e.g., per session or per minute).</li>
          <li>Understand how Seismic calculates charges for telehealth services provided through the platform.</li>
          <li>Identify trends in provider activity, appointment volume, and usage patterns.</li>
          <li>Export report data for billing, audits, or performance review in CSV or other formats.</li>
        </ul>
      ),
      description: "Generate actionable insights and export data:"
    },
    {
      icon: <Star className="w-7 h-7 text-blue-500" />,
      title: "About Us",
      details: (
        <ul className="list-disc ml-5 mt-1">
          <li>Read our mission and vision</li>
          <li>Understand our approach to empathetic AI in healthcare</li>
          <li>Explore how Seismic is evolving care delivery</li>
        </ul>
      ),
      description: "Learn about the team and the technology behind Seismic Connect:"
    },
    {
      icon: <LinkIcon className="w-7 h-7 text-blue-500" />,
      title: "Connect",
      details: (
        <>
          <div
            className="flex flex-col md:flex-row items-center md:items-start py-8 gap-8 relative"
            style={{ background: 'linear-gradient(135deg, #f6f8fa 0%, #f3f7fd 100%)', borderRadius: '1.5rem' }}
          >
            {/* Left: Connect feature list */}
            <div className="flex-1 min-w-0 md:pr-6">
              <ul className="space-y-4 text-base text-neutral-800 font-normal">
                <li>View the latest Seismic feature releases and product news</li>
                <li>Access platform improvement logs and new tool previews</li>
                <li>Stay updated with emergency contact features and alerts</li>
                <li>Read announcements and changelogs</li>
              </ul>
              <button
                id="explore-connect-btn"
                className="mt-8 px-5 py-2 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition text-sm"
                style={{ display: 'none' }}
                onClick={() => window.location.href = '/connect'}
              >
                Explore Connect
              </button>
            </div>
            {/* Right: Video card with clean heading */}
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md flex flex-col items-center md:items-start border border-neutral-200">
              <div className="mb-2 text-lg font-bold text-neutral-900">
                Connect Video Walkthrough
              </div>
              <div className="text-xs text-neutral-500 mb-3">A quick tour of the Connect page features</div>
              <video
                src="/connectwalkthrough.mp4"
                controls
                controlsList="nodownload"
                className="w-full rounded-xl object-cover shadow"
                style={{ background: '#000' }}
                onContextMenu={e => e.preventDefault()}
                onEnded={() => {
                  const btn = document.getElementById('explore-connect-btn');
                  if (btn) btn.style.display = 'flex';
                }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </>
      ),
      description: "Stay informed and updated with:"
    },
    {
      icon: <MessageCircle className="w-7 h-7 text-blue-500" />,
      title: "Contact Us",
      details: (
        <>
          <div
            className="flex flex-col md:flex-row items-center md:items-start py-8 gap-8 relative"
            style={{ background: 'linear-gradient(135deg, #f6f8fa 0%, #f3f7fd 100%)', borderRadius: '1.5rem' }}
          >
            {/* Left: Contact Us feature list */}
            <div className="flex-1 min-w-0 md:pr-6">
              <ul className="space-y-4 text-base text-neutral-800 font-normal">
                <li>Submit a ticket to our support team</li>
                <li>Start a live chat with Pulse, your AI assistant</li>
                <li>Find our support email and emergency line</li>
              </ul>
              <button
                id="explore-contactus-btn"
                className="mt-8 px-5 py-2 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition text-sm"
                style={{ display: 'none' }}
                onClick={() => window.location.href = '/contact'}
              >
                Explore Contact Us
              </button>
            </div>
            {/* Right: Video card with clean heading */}
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md flex flex-col items-center md:items-start border border-neutral-200">
              <div className="mb-2 text-lg font-bold text-neutral-900">
                Contact Us Video Walkthrough
              </div>
              <div className="text-xs text-neutral-500 mb-3">A quick tour of the Contact Us page features</div>
              <video
                src="/contactus.mp4"
                controls
                controlsList="nodownload"
                className="w-full rounded-xl object-cover shadow"
                style={{ background: '#000' }}
                onContextMenu={e => e.preventDefault()}
                onEnded={() => {
                  const btn = document.getElementById('explore-contactus-btn');
                  if (btn) btn.style.display = 'flex';
                }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </>
      ),
      description: "Need assistance? Head here to:"
    },
  ];
  return (
    <div>
      <h2 className="text-4xl font-bold text-center mb-2">Navigation Guide</h2>
      <p className="text-lg text-center text-neutral-500 mb-8">Quickly navigate Seismic Connect using the links below.</p>
      <div className="max-w-3xl mx-auto space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="bg-white border-2 border-blue-100 rounded-xl shadow">
            <button
              className="w-full flex items-center p-5 focus:outline-none transition hover:border-blue-400 rounded-xl"
              onClick={() => setOpenSection(openSection === section.title ? null : section.title)}
              aria-expanded={openSection === section.title}
            >
              <span className="text-3xl mr-4">{section.icon}</span>
              <span className="font-bold text-lg text-blue-700 flex-1 text-left">{section.title}</span>
              <svg className={`w-5 h-5 ml-2 transition-transform ${openSection === section.title ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {openSection === section.title && (
              <div className="px-8 pb-5 pt-0 animate-fade-in">
                <div className="text-neutral-700 text-sm mb-2">{section.description}</div>
                {section.details}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureWalkthroughsAccordion() {
  const [openFeature, setOpenFeature] = useState(null);
  const features = [
    {
      icon: <RefreshCcw className="w-7 h-7 text-blue-500" />,
      title: "How to Create and Track Support Tickets",
      content: (
        <div className="text-neutral-700 text-sm space-y-2">
          <ol className="list-decimal ml-6 space-y-1">
            <li>Navigate to the <b>Contact Us</b> page from the sidebar.</li>
            <li>Click on <b>"Create a Ticket."</b></li>
            <li>Fill in the ticket form:
              <ul className="list-disc ml-6">
                <li>Subject, Category, Description, Priority</li>
              </ul>
            </li>
            <li>Submit the ticket and note the <b>Ticket ID</b>.</li>
            <li>Visit the <b>Ticket Center</b> to track status updates and responses.</li>
          </ol>
          <div className="mt-2 text-blue-700 flex items-center"><span className="mr-2">🔁</span>Tickets can be updated or reopened from your history view.</div>
        </div>
      )
    },
    {
      icon: <Bot className="w-7 h-7 text-blue-500" />,
      title: "Using the AI Chat Assistant (\u201cPulse\u201d)",
      content: (
        <div className="text-neutral-700 text-sm space-y-2">
          <ol className="list-decimal ml-6 space-y-1">
            <li>Click the <b>Chat With Us</b> icon at the bottom right.</li>
            <li>Pulse will greet you and offer quick help topics.</li>
            <li>You can:
              <ul className="list-disc ml-6">
                <li>Ask questions about the platform</li>
                <li>Request walkthroughs</li>
                <li>Escalate to a live support agent (if needed)</li>
              </ul>
            </li>
          </ol>
          <div className="mt-2 text-blue-700 flex items-center"><span className="mr-2">💡</span>Pulse is available 24/7 and continuously learns from interactions to improve assistance.</div>
        </div>
      )
    },
    {
      icon: <Newspaper className="w-7 h-7 text-blue-500" />,
      title: "Accessing News, Updates, and Emergency Call",
      content: (
        <div className="text-neutral-700 text-sm space-y-2">
          <ol className="list-decimal ml-6 space-y-1">
            <li>Go to the <b>Connect</b> tab in the top navigation.</li>
            <li>View:
              <ul className="list-disc ml-6">
                <li>Latest news articles</li>
                <li>Recent feature releases</li>
                <li>Announcements and changelogs</li>
              </ul>
            </li>
            <li>For urgent situations, click <b>"Emergency Call"</b> to trigger immediate support or initiate a direct call.</li>
          </ol>
        </div>
      )
    },
    {
      icon: <UserCog className="w-7 h-7 text-blue-500" />,
      title: "Customizing Your Profile and Settings",
      content: (
        <div className="text-neutral-700 text-sm space-y-2">
          <ol className="list-decimal ml-6 space-y-1">
            <li>Click your profile avatar at the top right corner.</li>
            <li>Select <b>Settings &amp;gt; Profile</b>.</li>
            <li>Update:
              <ul className="list-disc ml-6">
                <li>Your name, specialty, timezone</li>
                <li>Notification preferences</li>
                <li>Appointment availability</li>
              </ul>
            </li>
            <li>Click <b>Save</b> to apply changes instantly.</li>
          </ol>
          <div className="mt-2 text-blue-700 flex items-center"><span className="mr-2">🔒</span>Your profile data is encrypted and HIPAA-compliant.</div>
        </div>
      )
    },
  ];
  return (
    <div>
      <h2 className="text-4xl font-bold text-center mb-2">Feature Walkthroughs</h2>
      <p className="text-lg text-center text-neutral-500 mb-8">This section provides step-by-step guidance on how to make the most of Seismic Connect's key features. Whether you're new or need a quick refresher, these walkthroughs will help you navigate confidently.</p>
      <div className="max-w-3xl mx-auto space-y-4">
        {features.map((feature) => (
          <div key={feature.title} className="bg-white border-2 border-blue-100 rounded-xl shadow">
            <button
              className="w-full flex items-center p-5 focus:outline-none transition hover:border-blue-400 rounded-xl"
              onClick={() => setOpenFeature(openFeature === feature.title ? null : feature.title)}
              aria-expanded={openFeature === feature.title}
            >
              <span className="text-3xl mr-4">{feature.icon}</span>
              <span className="font-bold text-lg text-blue-700 flex-1 text-left">{feature.title}</span>
              <svg className={`w-5 h-5 ml-2 transition-transform ${openFeature === feature.title ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {openFeature === feature.title && (
              <div className="px-8 pb-5 pt-0 animate-fade-in">
                {feature.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FAQAccordion() {
  const [openFaq, setOpenFaq] = useState(null);
  const faqs = [
    {
      icon: <Lock className="w-7 h-7 text-blue-500" />,
      question: "How do I reset my password?",
      answer: (
        <div className="text-neutral-700 text-sm space-y-2">
          <ol className="list-decimal ml-6 space-y-1">
            <li>Go to the Login Page: <span className="underline">seismicconnect.com/login</span></li>
            <li>Click on "Forgot Password"</li>
            <li>Enter your registered email address</li>
            <li>Follow the instructions sent to your inbox to securely reset your password</li>
          </ol>
          <div className="mt-2 text-blue-700 flex items-center"><span className="mr-2">🔒</span>For security reasons, passwords must include at least one uppercase letter, one number, and one special character.</div>
        </div>
      )
    },
    {
      icon: <MessageCircle className="w-7 h-7 text-blue-500" />,
      question: "How do I contact support?",
      answer: (
        <div className="text-neutral-700 text-sm space-y-2">
          <div>There are two fast ways to get help:</div>
          <ul className="list-disc ml-6">
            <li>Visit the Contact Us page to:
              <ul className="list-disc ml-6">
                <li>Submit a support ticket</li>
                <li>Chat live with an agent</li>
              </ul>
            </li>
            <li>Use Pulse, the AI Chat Assistant, available on every page for guided help</li>
          </ul>
          <div className="mt-2 text-blue-700 flex items-center"><span className="mr-2">🕐</span>Support is available 24/7 for emergencies and within standard business hours for general inquiries.</div>
        </div>
      )
    },
    {
      icon: <Newspaper className="w-7 h-7 text-blue-500" />,
      question: "Where can I find updates?",
      answer: (
        <div className="text-neutral-700 text-sm space-y-2">
          <div>All the latest news, release notes, and feature announcements can be found under the Connect tab in the top navigation bar.</div>
          <ul className="list-disc ml-6">
            <li>Product enhancements</li>
            <li>Scheduled maintenance alerts</li>
            <li>Emergency call protocols</li>
            <li>Changelog summaries</li>
          </ul>
          <div className="mt-2 text-blue-700 flex items-center"><span className="mr-2">📢</span>You can also opt into email notifications for important updates in your profile settings.</div>
        </div>
      )
    },
  ];
  return (
    <div>
      <h2 className="text-4xl font-bold text-center mb-2">FAQ</h2>
      <p className="text-lg text-center text-neutral-500 mb-8">Find quick answers to common questions from new and returning users. If your question isn't listed here, try the Chat Assistant or reach out through the Contact Us page.</p>
      <div className="max-w-2xl mx-auto space-y-4">
        {faqs.map((faq) => (
          <div key={faq.question} className="bg-white border-2 border-blue-100 rounded-xl shadow">
            <button
              className="w-full flex items-center p-5 focus:outline-none transition hover:border-blue-400 rounded-xl"
              onClick={() => setOpenFaq(openFaq === faq.question ? null : faq.question)}
              aria-expanded={openFaq === faq.question}
            >
              <span className="text-2xl mr-4 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center">{faq.icon}</span>
              <span className="font-bold text-md text-neutral-900 flex-1 text-left">{faq.question}</span>
              <svg className={`w-5 h-5 ml-2 transition-transform ${openFaq === faq.question ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {openFaq === faq.question && (
              <div className="px-8 pb-5 pt-0 animate-fade-in">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const tabContent = {
  "Introduction": (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-center">What Makes Seismic Connect Unique</h2>
      <div className="flex justify-center mb-6">
        <span className="block w-24 h-1 bg-blue-500 rounded" />
      </div>
      <p className="mb-6 text-lg text-neutral-700 text-center">
        Welcome to Seismic Connect — a next-generation platform that redefines how healthcare providers interact with patients, manage appointments, and document care.<br /><br />
        In an era where time, empathy, and efficiency matter more than ever, Seismic empowers clinicians with AI-enhanced telehealth tools that work silently in the background. Our goal is simple: free you from the burden of manual tasks, so you can focus entirely on delivering meaningful care.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="border rounded-lg p-4 flex items-start bg-white">
          <div className="mr-4 bg-blue-100 p-2 rounded-full">
            <Video className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-800 mb-1">Video Consultations</h3>
            <p className="text-sm text-neutral-600">Connect with patients virtually through secure, HIPAA-compliant video calls.</p>
          </div>
        </div>
        <div className="border rounded-lg p-4 flex items-start bg-white">
          <div className="mr-4 bg-blue-100 p-2 rounded-full">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-800 mb-1">Appointment Management</h3>
            <p className="text-sm text-neutral-600">Schedule and track patient appointments with an intuitive calendar interface.</p>
          </div>
        </div>
        <div className="border rounded-lg p-4 flex items-start bg-white">
          <div className="mr-4 bg-blue-100 p-2 rounded-full">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-800 mb-1">Clinical Documentation</h3>
            <p className="text-sm text-neutral-600">Maintain comprehensive patient notes and clinical documentation.</p>
          </div>
        </div>
        <div className="border rounded-lg p-4 flex items-start bg-white">
          <div className="mr-4 bg-blue-100 p-2 rounded-full">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-800 mb-1">Patient Management</h3>
            <p className="text-sm text-neutral-600">Search and manage your patient database with integrated EMR features.</p>
          </div>
        </div>
      </div>
    </div>
  ),
  "Getting Started": <GettingStartedTab />,
  "Navigation Guide": <NavigationGuideAccordion />,
  "Feature Walkthroughs": <FeatureWalkthroughsAccordion />,
  "Tips & Best Practices": (
    <div>
      <h2 className="text-4xl font-bold text-center mb-2">Tips & Best Practices</h2>
      <p className="text-lg text-center text-neutral-500 mb-8">To ensure the best experience with Seismic Connect, we recommend following these key tips and operational best practices. These simple habits can save time, reduce errors, and help you get the most out of the platform.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Profile Info */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center border-2 border-blue-100">
          <span className="text-5xl mb-3">🧑‍💼</span>
          <h4 className="font-bold text-lg mb-1 text-blue-700">Keep Your Profile Information Up to Date</h4>
          <ul className="text-neutral-700 text-sm mb-2 list-disc list-inside text-left mx-auto" style={{ maxWidth: '320px' }}>
            <li>Update your name, specialty, and availability regularly</li>
            <li>Ensure your email and contact number are current</li>
            <li>Keep notification preferences aligned with your workflow</li>
            <li>Go to <b>Settings &gt; Profile</b> to make changes</li>
          </ul>
          <div className="text-xs text-blue-700 mt-2 flex items-center"><span className="mr-1">🔐</span>Up-to-date profiles ensure secure communication and proper role access.</div>
        </div>
        {/* Chat Assistant */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center border-2 border-blue-100">
          <span className="text-5xl mb-3">🤖</span>
          <h4 className="font-bold text-lg mb-1 text-blue-700">Use the Chat Assistant for Quick Answers</h4>
          <ul className="text-neutral-700 text-sm mb-2 list-disc list-inside text-left mx-auto" style={{ maxWidth: '320px' }}>
            <li>Access Pulse, the AI Chat Assistant, anytime using the chat icon</li>
            <li>Ask for navigation help, feature tutorials, troubleshooting tips</li>
            <li>Escalate to a live agent if needed</li>
          </ul>
          <div className="text-xs text-blue-700 mt-2 flex items-center"><span className="mr-1">💬</span>Pulse provides instant, context-aware support to keep you moving forward.</div>
        </div>
        {/* Connect for Updates */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center border-2 border-blue-100">
          <span className="text-5xl mb-3">📰</span>
          <h4 className="font-bold text-lg mb-1 text-blue-700">Check Connect for the Latest Updates</h4>
          <ul className="text-neutral-700 text-sm mb-2 list-disc list-inside text-left mx-auto" style={{ maxWidth: '320px' }}>
            <li>Visit the Connect page for new features, security patches, planned maintenance, and emergency communications</li>
          </ul>
          <div className="text-xs text-blue-700 mt-2 flex items-center"><span className="mr-1">🧭</span>Staying informed ensures you're always using the most stable, secure version.</div>
        </div>
        {/* Contact Support */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center border-2 border-blue-100">
          <span className="text-5xl mb-3">🆘</span>
          <h4 className="font-bold text-lg mb-1 text-blue-700">Contact Support for Unresolved Issues</h4>
          <ul className="text-neutral-700 text-sm mb-2 list-disc list-inside text-left mx-auto" style={{ maxWidth: '320px' }}>
            <li>Use the Contact Us page to submit a support ticket, chat with an agent, or reach emergency contacts</li>
            <li>Always include clear details and screenshots when possible</li>
          </ul>
          <div className="text-xs text-blue-700 mt-2 flex items-center"><span className="mr-1">🛠</span>Our support team responds within 24 hours for standard tickets and instantly for urgent cases.</div>
        </div>
      </div>
    </div>
  ),
  "FAQ": <FAQAccordion />,
  "Support": (
    <div>
      <h2 className="text-4xl font-bold text-center mb-2">Support</h2>
      <p className="text-lg text-center text-neutral-500 mb-8">We're here to ensure you get the help you need—quickly and efficiently. Whether it's technical assistance, a general inquiry, or an urgent situation, Seismic Connect provides multiple ways to reach our support team.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {/* Email Support */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center border-2 border-blue-100">
          <span className="text-5xl mb-3">📧</span>
          <h4 className="font-bold text-lg mb-1 text-blue-700">Email Support</h4>
          <div className="text-neutral-700 text-sm mb-2">You can contact us anytime at:</div>
          <a href="mailto:support@seismic.com" className="text-blue-600 underline mb-1">support@seismic.com</a>
          <div className="text-neutral-700 text-xs mb-2">Response time: within 24 business hours</div>
          <div className="text-neutral-700 text-xs mb-2">Ideal for: non-urgent queries, feedback, account issues</div>
        </div>
        {/* Live Chat with Pulse */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center border-2 border-blue-100">
          <span className="text-5xl mb-3">💬</span>
          <h4 className="font-bold text-lg mb-1 text-blue-700">Live Chat with Pulse (AI Assistant)</h4>
          <div className="text-neutral-700 text-sm mb-2">Need real-time help while using the platform? Use the "Chat With Us" widget available at the bottom-right of any screen.</div>
          <ul className="text-neutral-700 text-xs mb-2 list-disc list-inside text-left mx-auto" style={{ maxWidth: '320px' }}>
            <li>Ask about platform features, navigation, and troubleshooting</li>
            <li>Pulse can answer instantly or connect you to a live agent during working hours</li>
          </ul>
          <div className="text-xs text-blue-700 mt-2 flex items-center"><span className="mr-1">🧠</span>Pulse learns from your interactions to provide smarter support every time.</div>
          <button className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition">Chat With Us</button>
        </div>
        {/* Emergency Support */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center border-2 border-blue-100">
          <span className="text-5xl mb-3">🚨</span>
          <h4 className="font-bold text-lg mb-1 text-blue-700">Emergency Support</h4>
          <div className="text-neutral-700 text-sm mb-2">For time-sensitive clinical or platform issues, contact your designated emergency support team through your usual channel.</div>
          <ul className="text-neutral-700 text-xs mb-2 list-disc list-inside text-left mx-auto" style={{ maxWidth: '320px' }}>
            <li>This will initiate a priority escalation to the appropriate response team.</li>
            <li>Contact options may include: direct phone, email, or your organization's incident management tool.</li>
            <li>Example: <a href="mailto:incident@domain.com" className="text-blue-600 underline">incident@domain.com</a></li>
          </ul>
          <div className="text-xs text-red-600 mt-2 flex items-center"><span className="mr-1">⚠️</span>Please reserve this option for urgent disruptions only related to patient care or operational continuity.</div>
        </div>
      </div>
    </div>
  ),
};

const Documentation = () => {
  const [activeTab, setActiveTab] = useState("Introduction");

  return (
    <div className="space-y-6 px-4">
      <div className="relative mb-6">
        {/* Back button (left aligned, from PageNavigation) */}
        <div className="mt-[11px]"> 
          <PageNavigation 
          showBackButton={true} 
          hideTitle={true} 
          />
        </div>

        {/* Centered title (same line as back button) */}
        <h1 className="absolute inset-0 flex items-center justify-center 
                      text-3xl font-bold text-blue-700 pointer-events-none">Seismic Application Documentation</h1>
      </div>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap gap-3 mb-8">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap
                ${activeTab === tab
                    ? "bg-blue-100 text-blue-700 border-b-2 border-blue-500"
                    : "bg-neutral-100 text-neutral-600 hover:bg-blue-50"}
              `}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow p-6 min-h-[200px]">
          {tabContent[activeTab]}
        </div>
      </div>
    </div>
  );
};

export default Documentation;