import { useState } from "react";
import {
  Mail, Ticket, CheckCircle, Loader2, MessageCircle, Eye
} from "lucide-react";
import { PageNavigation } from "../components/ui/page-navigation";

const priorities = ['Low', 'Medium', 'High'];
const categories = ['Technical', 'Billing', 'General'];

const defaultTicket = {
  fullName: '',
  email: '',
  contactNumber: '',
  subject: '',
  category: '',
  description: '',
  file: null,
  priority: 'Medium',
};

const defaultSalesForm = {
  name: '',
  email: '',
  company: '',
  phone: '',
  role: '',
  message: '',
  companySize: '',
  interests: []
};

function validate(ticket) {
  const errors = {};
  if (!ticket.fullName) errors.fullName = 'Full name is required.';
  const emailValid = ticket.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ticket.email);
  const phoneValid = ticket.contactNumber && /^\+?[0-9\-\s]{7,}$/.test(ticket.contactNumber);
  if (!emailValid && !phoneValid) {
    errors.email = 'Provide a valid email or contact number.';
    errors.contactNumber = 'Provide a valid contact number or email.';
  } else {
    if (ticket.email && !emailValid) errors.email = 'Valid email is required.';
    if (ticket.contactNumber && !phoneValid) errors.contactNumber = 'Valid contact number is required.';
  }
  if (!ticket.subject) errors.subject = 'Subject is required.';
  if (!ticket.category) errors.category = 'Category is required.';
  if (!ticket.description) errors.description = 'Description is required.';
  return errors;
}

const mockTickets = [
  {
    id: 'TCK-20240509-001',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    subject: 'Technical issue',
    category: 'Technical',
    description: 'App is not loading.',
    file: null,
    priority: 'Medium',
    status: 'Open',
    comments: [
      { from: 'Support', text: 'We are looking into your issue.', time: '2024-05-09 10:00' },
      { from: 'You', text: 'Thank you!', time: '2024-05-09 10:01' },
    ],
  },
  {
    id: 'TCK-20240508-002',
    fullName: 'John Smith',
    email: 'john@example.com',
    subject: 'Billing question',
    category: 'Billing',
    description: 'How do I update my payment method?',
    file: null,
    priority: 'Low',
    status: 'Resolved',
    comments: [
      { from: 'Support', text: 'Your payment method has been updated.', time: '2024-05-08 09:00' },
    ],
  },
];

const Contact = () => {
  const [view, setView] = useState('landing');
  const [ticket, setTicket] = useState(defaultTicket);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState(mockTickets);
  const [viewTicket, setViewTicket] = useState(null);
  const [emailForm, setEmailForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailErrors, setEmailErrors] = useState({});
  const [salesForm, setSalesForm] = useState(defaultSalesForm);
  const [salesSent, setSalesSent] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesErrors, setSalesErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setTicket((t) => ({ ...t, [name]: files ? files[0] : value }));
    setErrors((err) => ({ ...err, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate(ticket);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setSubmitted(true);
        setTickets((prev) => [
          {
            id: `TCK-${Date.now()}`,
            ...ticket,
            status: 'Open',
            comments: [
              { from: 'Support', text: 'We have received your ticket.', time: new Date().toLocaleString() },
            ],
          },
          ...prev,
        ]);
      }, 1200);
    }
  };

  const resetForm = () => {
    setTicket(defaultTicket);
    setErrors({});
    setSubmitted(false);
    setView('landing');
  };

  // Email form handlers
  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailForm((f) => ({ ...f, [name]: value }));
    setEmailErrors((err) => {
      const newErr = { ...err };
      delete newErr[name];
      return newErr;
    });
  };
  const handleEmailSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!emailForm.name) errs.name = 'Name is required.';
    if (!emailForm.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailForm.email)) errs.email = 'Valid email is required.';
    if (!emailForm.subject) errs.subject = 'Subject is required.';
    if (!emailForm.message) errs.message = 'Message is required.';
    setEmailErrors(errs);
    if (Object.keys(errs).length === 0) {
      setEmailLoading(true);
      setTimeout(() => {
        setEmailLoading(false);
        setEmailSent(true);
      }, 1200);
    }
  };
  const resetEmail = () => {
    setEmailForm({ name: '', email: '', subject: '', message: '' });
    setEmailErrors({});
    setEmailSent(false);
    setView('landing');
  };

  const handleSalesChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setSalesForm(prev => ({
        ...prev,
        interests: checked
          ? [...prev.interests, value]
          : prev.interests.filter(i => i !== value)
      }));
    } else {
      setSalesForm(prev => ({ ...prev, [name]: value }));
    }
    setSalesErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSalesSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!salesForm.name) errs.name = 'Name is required.';
    if (!salesForm.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(salesForm.email)) errs.email = 'Valid email is required.';
    if (!salesForm.company) errs.company = 'Company name is required.';
    if (!salesForm.role) errs.role = 'Role is required.';
    if (!salesForm.message) errs.message = 'Message is required.';
    setSalesErrors(errs);

    if (Object.keys(errs).length === 0) {
      setSalesLoading(true);
      setTimeout(() => {
        setSalesLoading(false);
        setSalesSent(true);
      }, 1200);
    }
  };

  const resetSales = () => {
    setSalesForm(defaultSalesForm);
    setSalesErrors({});
    setSalesSent(false);
    setView('landing');
  };

  return (
    <div className="px-4 pb-6">
      <div className="max-w-5xl mx-auto">
        <div className="-ml-[3px]">
        <div className="mt-[11px]">
          <PageNavigation showBackButton={true} hideTitle={true} />
        </div>
      </div>
        <h1 className="text-4xl font-bold mb-2 text-center text-blue-700">Contact Us</h1>
        <p className="text-lg text-neutral-700 mb-10 text-center">Reach out for support, service, or inquiries. We're here to help!</p>

        {view === 'landing' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center text-center border border-neutral-100">
              <Ticket className="text-blue-500 w-12 h-12 mb-3" />
              <h2 className="text-xl font-semibold mb-1">Create a Ticket</h2>
              <p className="text-neutral-500 mb-4 text-sm">Submit a support ticket and we'll respond as soon as possible.</p>
              <button className="bg-blue-600 text-white px-5 py-2 rounded-md font-medium hover:bg-blue-700 transition" onClick={() => setView('ticket')}>Submit Ticket</button>
            </div>
            <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center text-center border border-neutral-100">
              <Mail className="text-blue-500 w-12 h-12 mb-3" />
              <h2 className="text-xl font-semibold mb-1">Email</h2>
              <p className="text-neutral-500 mb-4 text-sm">Send us an email and we'll get back to you promptly.</p>
              <button className="bg-blue-600 text-white px-5 py-2 rounded-md font-medium hover:bg-blue-700 transition" onClick={() => setView('email')}>Send Email</button>
            </div>
          </div>
        )}

        {/* Submit Ticket View */}
        {view === 'ticket' && (
          <>
            <button className="mb-6 text-blue-700 underline font-medium" onClick={() => setView('landing')}>&larr; Back</button>
            <div className="bg-white rounded-xl shadow p-8 border border-neutral-100">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-2xl font-bold text-center mb-1">Submit Ticket</h2>
                  <p className="text-neutral-600 text-center mb-4">Let us know how we can assist you, and we'll respond within 24 hours.</p>
                  <div>
                    <label className="font-semibold">Full name</label>
                    <input name="fullName" value={ticket.fullName} onChange={handleChange} className={`mt-1 w-full rounded border px-3 py-2 ${errors.fullName ? 'border-red-400' : 'border-neutral-300'} focus:outline-none focus:ring-2 focus:ring-blue-200`} />
                    {errors.fullName && <div className="text-red-500 text-xs mt-1">{errors.fullName}</div>}
                  </div>
                  <div>
                    <label className="font-semibold">Email</label>
                    <input name="email" value={ticket.email} onChange={handleChange} className={`mt-1 w-full rounded border px-3 py-2 ${errors.email ? 'border-red-400' : 'border-neutral-300'} focus:outline-none focus:ring-2 focus:ring-blue-200`} />
                    {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
                  </div>
                  <div>
                    <label className="font-semibold">Contact Number</label>
                    <input name="contactNumber" value={ticket.contactNumber} onChange={handleChange} className={`mt-1 w-full rounded border px-3 py-2 ${errors.contactNumber ? 'border-red-400' : 'border-neutral-300'} focus:outline-none focus:ring-2 focus:ring-blue-200`} />
                    {errors.contactNumber && <div className="text-red-500 text-xs mt-1">{errors.contactNumber}</div>}
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="font-semibold">Subject</label>
                      <input name="subject" value={ticket.subject} onChange={handleChange} className={`mt-1 w-full rounded border px-3 py-2 ${errors.subject ? 'border-red-400' : 'border-neutral-300'} focus:outline-none focus:ring-2 focus:ring-blue-200`} />
                      {errors.subject && <div className="text-red-500 text-xs mt-1">{errors.subject}</div>}
                    </div>
                    <div className="flex-1">
                      <label className="font-semibold">Category</label>
                      <select name="category" value={ticket.category} onChange={handleChange} className={`mt-1 w-full rounded border px-3 py-2 ${errors.category ? 'border-red-400' : 'border-neutral-300'} focus:outline-none focus:ring-2 focus:ring-blue-200`}>
                        <option value="">Select</option>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.category && <div className="text-red-500 text-xs mt-1">{errors.category}</div>}
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold">Description</label>
                    <textarea name="description" value={ticket.description} onChange={handleChange} className={`mt-1 w-full rounded border px-3 py-2 ${errors.description ? 'border-red-400' : 'border-neutral-300'} focus:outline-none focus:ring-2 focus:ring-blue-200`} rows={3} />
                    {errors.description && <div className="text-red-500 text-xs mt-1">{errors.description}</div>}
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="flex-1">
                      <label className="font-semibold">Attach file (optional)</label>
                      <input name="file" type="file" onChange={handleChange} className="mt-1 w-full" />
                    </div>
                    <div className="flex-1">
                      <label className="font-semibold">Priority</label>
                      <select name="priority" value={ticket.priority} onChange={handleChange} className="mt-1 w-full rounded border px-3 py-2 border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-200">
                        {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition flex items-center justify-center" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                    Submit
                  </button>
                </form>
              ) : (
                <div className="text-center">
                  <CheckCircle className="mx-auto text-green-500 mb-2" size={48} />
                  <h2 className="text-2xl font-bold mb-2">Your ticket has been submitted!</h2>
                  <p className="mb-4 text-neutral-700">We'll get back to you within 24 hours.</p>
                  <div className="flex justify-center gap-6 mb-4">
                    <button className="text-blue-700 underline font-medium" onClick={() => setView('email')}>Email</button>
                    <button className="text-blue-700 underline font-medium" onClick={resetForm}>Back to dashboard</button>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-left text-sm">
                    <div className="font-semibold mb-1">Auto-response email sent:</div>
                    <div><span className="font-semibold">Ticket ID:</span> TCK-{Date.now()}</div>
                    <div><span className="font-semibold">Summary:</span> {ticket.subject} ({ticket.category})</div>
                    <div><span className="font-semibold">Estimated response:</span> 24 hours</div>
                  </div>
                </div>
              )}
            </div>
            {/* Ticket Tracking Panel below the form/confirmation */}
            <div className="bg-white rounded-xl shadow p-8 border border-neutral-100 mt-8">
              <h2 className="text-2xl font-bold mb-4">Your Tickets</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-neutral-500 border-b">
                      <th className="py-2 pr-4">ID</th>
                      <th className="py-2 pr-4">Subject</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Priority</th>
                      <th className="py-2 pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-mono">{t.id}</td>
                        <td className="py-2 pr-4">{t.subject}</td>
                        <td className={`py-2 pr-4 font-semibold ${t.status === 'Open' ? 'text-yellow-600' : t.status === 'Resolved' ? 'text-green-600' : 'text-blue-600'}`}>{t.status}</td>
                        <td className="py-2 pr-4">{t.priority}</td>
                        <td className="py-2 pr-4 flex gap-2">
                          <button className="flex items-center gap-1 text-blue-700 underline font-medium" onClick={() => setViewTicket(t)}><Eye size={16} /> View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* View Ticket Details */}
        {viewTicket && (
          <div className="bg-white rounded-xl shadow p-8 border border-neutral-100 mt-6">
            <button className="text-blue-700 underline font-medium mb-4" onClick={() => setViewTicket(null)}>&larr; Back to tickets</button>
            <h2 className="text-2xl font-bold mb-2">Ticket Details</h2>
            <div className="mb-2"><span className="font-semibold">Ticket ID:</span> {viewTicket.id}</div>
            <div className="mb-2"><span className="font-semibold">Status:</span> <span className={`font-semibold ${viewTicket.status === 'Open' ? 'text-yellow-600' : viewTicket.status === 'Resolved' ? 'text-green-600' : 'text-blue-600'}`}>{viewTicket.status}</span></div>
            <div className="mb-2"><span className="font-semibold">Priority:</span> {viewTicket.priority}</div>
            <div className="mb-2"><span className="font-semibold">Subject:</span> {viewTicket.subject}</div>
            <div className="mb-2"><span className="font-semibold">Category:</span> {viewTicket.category}</div>
            <div className="mb-2"><span className="font-semibold">Description:</span> {viewTicket.description}</div>
            <div className="mb-4">
              <div className="font-semibold mb-1">Chat Log</div>
              <div className="bg-neutral-100 rounded p-2 max-h-32 overflow-y-auto text-sm">
                {viewTicket.comments.map((c, i) => (
                  <div key={i} className="mb-2 flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 mt-0.5 text-blue-400" />
                    <div>
                      <span className="font-semibold">{c.from}:</span> {c.text}
                      <div className="text-xs text-neutral-400">{c.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Email View */}
        {view === 'email' && (
          <div className="bg-white rounded-xl shadow p-8 border border-neutral-100">
            <button className="mb-6 text-blue-700 underline font-medium" onClick={() => setView('landing')}>&larr; Back</button>
            {!emailSent ? (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <h2 className="text-2xl font-bold text-center mb-1">Email Us</h2>
                <p className="text-neutral-600 text-center mb-4">Send us a message and we'll get back to you promptly.</p>
                <div>
                  <label className="font-semibold">Name</label>
                  <input name="name" value={emailForm.name} onChange={handleEmailChange} className={`mt-1 w-full rounded border px-3 py-2 ${emailErrors.name ? 'border-red-400' : 'border-neutral-300'} focus:outline-none focus:ring-2 focus:ring-blue-200`} />
                  {emailErrors.name && <div className="text-red-500 text-xs mt-1">{emailErrors.name}</div>}
                </div>
                <div>
                  <label className="font-semibold">Email</label>
                  <input name="email" value={emailForm.email} onChange={handleEmailChange} className={`mt-1 w-full rounded border px-3 py-2 ${emailErrors.email ? 'border-red-400' : 'border-neutral-300'} focus:outline-none focus:ring-2 focus:ring-blue-200`} />
                  {emailErrors.email && <div className="text-red-500 text-xs mt-1">{emailErrors.email}</div>}
                </div>
                <div>
                  <label className="font-semibold">Subject</label>
                  <input name="subject" value={emailForm.subject} onChange={handleEmailChange} className={`mt-1 w-full rounded border px-3 py-2 ${emailErrors.subject ? 'border-red-400' : 'border-neutral-300'} focus:outline-none focus:ring-2 focus:ring-blue-200`} />
                  {emailErrors.subject && <div className="text-red-500 text-xs mt-1">{emailErrors.subject}</div>}
                </div>
                <div>
                  <label className="font-semibold">Message</label>
                  <textarea name="message" value={emailForm.message} onChange={handleEmailChange} className={`mt-1 w-full rounded border px-3 py-2 ${emailErrors.message ? 'border-red-400' : 'border-neutral-300'} focus:outline-none focus:ring-2 focus:ring-blue-200`} rows={4} />
                  {emailErrors.message && <div className="text-red-500 text-xs mt-1">{emailErrors.message}</div>}
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition flex items-center justify-center" disabled={emailLoading}>
                  {emailLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                  Send
                </button>
              </form>
            ) : (
              <div className="text-center">
                <CheckCircle className="mx-auto text-green-500 mb-2" size={48} />
                <h2 className="text-2xl font-bold mb-2">Your message has been sent!</h2>
                <p className="mb-4 text-neutral-700">We'll get back to you within 24 hours.</p>
                <button className="text-blue-700 underline font-medium" onClick={resetEmail}>Send another message</button>
              </div>
            )}
          </div>
        )}

        {/* Sales Contact View */}
        {view === 'sales' && (
          <div className="bg-white rounded-xl shadow p-8 border border-neutral-100">
            <button className="mb-6 text-blue-700 underline font-medium" onClick={() => setView('landing')}>&larr; Back</button>
            {!salesSent ? (
              <form onSubmit={handleSalesSubmit} className="space-y-4">
                <h2 className="text-2xl font-bold text-center mb-1">Contact Sales</h2>
                <p className="text-neutral-600 text-center mb-4">Tell us about your organization and how we can help.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold">Full Name *</label>
                    <input name="name" value={salesForm.name} onChange={handleSalesChange} className={`mt-1 w-full rounded border px-3 py-2 ${salesErrors.name ? 'border-red-400' : 'border-neutral-300'} focus:outline-none focus:ring-2 focus:ring-purple-200`} />
                    {salesErrors.name && <div className="text-red-500 text-xs mt-1">{salesErrors.name}</div>}
                  </div>
                  <div>
                    <label className="font-semibold">Email *</label>
                    <input name="email" type="email" value={salesForm.email} onChange={handleSalesChange} className={`mt-1 w-full rounded border px-3 py-2 ${salesErrors.email ? 'border-red-400' : 'border-neutral-300'} focus:outline-none focus:ring-2 focus:ring-purple-200`} />
                    {salesErrors.email && <div className="text-red-500 text-xs mt-1">{salesErrors.email}</div>}
                  </div>
                  <div>
                    <label className="font-semibold">Company Name *</label>
                    <input name="company" value={salesForm.company} onChange={handleSalesChange} className={`mt-1 w-full rounded border px-3 py-2 ${salesErrors.company ? 'border-red-400' : 'border-neutral-300'} focus:outline-none focus:ring-2 focus:ring-purple-200`} />
                    {salesErrors.company && <div className="text-red-500 text-xs mt-1">{salesErrors.company}</div>}
                  </div>
                  <div>
                    <label className="font-semibold">Phone</label>
                    <input name="phone" type="tel" value={salesForm.phone} onChange={handleSalesChange} className="mt-1 w-full rounded border px-3 py-2 border-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-200" />
                  </div>
                  <div>
                    <label className="font-semibold">Your Role *</label>
                    <input name="role" value={salesForm.role} onChange={handleSalesChange} className={`mt-1 w-full rounded border px-3 py-2 ${salesErrors.role ? 'border-red-400' : 'border-neutral-300'} focus:outline-none focus:ring-2 focus:ring-purple-200`} />
                    {salesErrors.role && <div className="text-red-500 text-xs mt-1">{salesErrors.role}</div>}
                  </div>
                  <div>
                    <label className="font-semibold">Company Size</label>
                    <select name="companySize" value={salesForm.companySize} onChange={handleSalesChange} className="mt-1 w-full rounded border px-3 py-2 border-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-200">
                      <option value="">Select size</option>
                      <option value="1-50">1-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="501-1000">501-1000 employees</option>
                      <option value="1000+">1000+ employees</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold">Interested In</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {['Enterprise Solutions', 'Custom Integration', 'API Access', 'Training & Support'].map(interest => (
                      <label key={interest} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="interests"
                          value={interest}
                          checked={salesForm.interests.includes(interest)}
                          onChange={handleSalesChange}
                          className="rounded border-neutral-300 text-purple-600 focus:ring-purple-500"
                        />
                        {interest}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-semibold">Message *</label>
                  <textarea name="message" value={salesForm.message} onChange={handleSalesChange} className={`mt-1 w-full rounded border px-3 py-2 ${salesErrors.message ? 'border-red-400' : 'border-neutral-300'} focus:outline-none focus:ring-2 focus:ring-purple-200`} rows={4} placeholder="Tell us about your needs and how we can help..." />
                  {salesErrors.message && <div className="text-red-500 text-xs mt-1">{salesErrors.message}</div>}
                </div>

                <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700 transition flex items-center justify-center" disabled={salesLoading}>
                  {salesLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                  Contact Sales Team
                </button>
              </form>
            ) : (
              <div className="text-center">
                <CheckCircle className="mx-auto text-green-500 mb-2" size={48} />
                <h2 className="text-2xl font-bold mb-2">Thank you for your interest!</h2>
                <p className="mb-4 text-neutral-700">Our sales team will contact you within 24 hours to discuss how we can help your organization.</p>
                <div className="bg-purple-50 rounded-lg p-4 text-left text-sm">
                  <div className="font-semibold mb-1">What happens next?</div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>A sales representative will reach out to schedule a consultation</li>
                    <li>We'll discuss your specific needs and requirements</li>
                    <li>You'll receive a customized proposal and demo</li>
                  </ul>
                </div>
                <button className="mt-6 text-purple-700 underline font-medium" onClick={resetSales}>Submit another inquiry</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Contact; 