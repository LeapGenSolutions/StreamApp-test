import { useState } from "react";
import {
  UserPlus, LayoutDashboard, User, PlayCircle, Wrench, MessageCircle,
  UserCog, RefreshCcw, Lock, Newspaper, Bot, Calendar, BarChart2, Star,
  Link as LinkIcon, Video, FileText, Users
} from "lucide-react";
import { Link } from "wouter";

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
      icon: <UserPlus className="w-6 h-6 text-blue-500" />, title: "Sign Up or Log In", num: 1, details: (
        <ul className="text-sm list-disc ml-6 mt-2 space-y-1">
          <li>Visit <span className="underline">seismicconnect.com/login</span></li>
          <li>Enter your registered email and password</li>
          <li>Forgot your password? Click "Forgot Password" to reset it securely</li>
          <li>New user? Select "Sign Up" and follow the onboarding prompts</li>
        </ul>
      )
    },
    {
      icon: <LayoutDashboard className="w-6 h-6 text-blue-500" />,
      title: "Explore the Dashboard",
      num: 2,
      details: (
        <ul className="text-sm list-disc ml-6 mt-2 space-y-1">
          <li>View upcoming appointments and video call links</li>
          <li>Access recent transcripts and summaries</li>
          <li>Navigate to Patients, Reports, Chat, or Settings from the sidebar</li>
          <li>View system announcements and quick tips</li>
        </ul>
      )
    },
    {
      icon: <User className="w-6 h-6 text-blue-500" />,
      title: "Personalize Your Profile",
      num: 3,
      details: (
        <ul className="text-sm list-disc ml-6 mt-2 space-y-1">
          <li>Click your avatar at the top right</li>
          <li>Go to Settings {'>'} Profile</li>
          <li>Update your name, specialty, timezone, and notification preferences</li>
          <li>Set availability for appointments (optional)</li>
        </ul>
      )
    },
    {
      icon: <PlayCircle className="w-6 h-6 text-blue-500" />,
      title: "Test Key Features (Optional)",
      num: 4,
      details: (
        <ul className="text-sm list-disc ml-6 mt-2 space-y-1">
          <li>Try the "Video Call" section to test your webcam and mic</li>
          <li>Use Pulse, the AI Chat Assistant, to ask questions</li>
          <li>Submit a test support ticket to familiarize yourself with the process</li>
        </ul>
      )
    },
  ];
  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-1">Getting Started</h2>
      <p className="mb-6 text-neutral-600">This guide will help you set up your account, navigate the dashboard, and configure your profile so you're ready to start delivering care with ease.</p>
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
      {/* Need Help Section */}
      <div className="flex items-start bg-blue-50 rounded-xl p-4 mt-6">
        <div className="mt-1 mr-3"><Wrench className="w-6 h-6 text-blue-500" /></div>
        <div>
          <span className="font-semibold text-blue-700">Need Help?</span>
          <ul className="text-sm text-neutral-700 list-disc list-inside ml-0 mt-1">
            <li>Go to <Link href="/contact" className="underline text-blue-700 hover:text-blue-900">Contact Us</Link> to submit a ticket or start a live chat</li>
            <li>Use Pulse, the AI assistant, for step-by-step guidance</li>
          </ul>
        </div>
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
        <ul className="list-disc ml-5 mt-1">
          <li>Review upcoming appointments</li>
          <li>Access quick links to recent transcripts and notes</li>
          <li>View system alerts, updates, and to-do items</li>
        </ul>
      ),
      description: "Your homepage provides an at-a-glance view of your daily activity. From here, you can:"
    },
    {
      icon: <Calendar className="w-7 h-7 text-blue-500" />,
      title: "Appointments",
      details: (
        <ul className="list-disc ml-5 mt-1">
          <li>View upcoming and past appointments</li>
          <li>Reschedule or cancel visits</li>
          <li>Launch video calls directly from the appointment card</li>
          <li>Sync with your calendar (if enabled)</li>
        </ul>
      ),
      description: "This section helps you manage your clinical schedule with ease:"
    },
    {
      icon: <User className="w-7 h-7 text-blue-500" />,
      title: "Patients",
      details: (
        <ul className="list-disc ml-5 mt-1">
          <li>Search for patients by name, ID, or status</li>
          <li>View visit history, documents, and notes</li>
          <li>Add, update, or archive patient profiles</li>
          <li>Link EMR data for contextual insights</li>
        </ul>
      ),
      description: "Access and manage your patient records securely:"
    },
    {
      icon: <BarChart2 className="w-7 h-7 text-blue-500" />,
      title: "Reports",
      details: (
        <ul className="list-disc ml-5 mt-1">
          <li>View consultation summaries</li>
          <li>Track engagement and usage metrics</li>
          <li>Export reports for billing or compliance</li>
          <li>Filter by date, type, or provider</li>
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
        <ul className="list-disc ml-5 mt-1">
          <li>The latest Seismic feature releases and product news</li>
          <li>Platform improvement logs</li>
          <li>New tools and beta previews</li>
          <li>Emergency contact features and alerts</li>
        </ul>
      ),
      description: "Stay informed and updated with:"
    },
    {
      icon: <MessageCircle className="w-7 h-7 text-blue-500" />,
      title: "Contact Us",
      details: (
        <ul className="list-disc ml-5 mt-1">
          <li>Submit a ticket to our support team</li>
          <li>Start a live chat with Pulse, your AI assistant</li>
          <li>Find our support email and emergency line</li>
        </ul>
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
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Seismic Application Documentation</h1>
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
  );
};

export default Documentation; 