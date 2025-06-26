import { useState } from "react";
import { X, Loader2, CheckCircle } from "lucide-react";

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

const SalesModal = ({ onClose }) => {
  const [salesForm, setSalesForm] = useState(defaultSalesForm);
  const [salesSent, setSalesSent] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesErrors, setSalesErrors] = useState({});

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
    if (salesForm.message && salesForm.message.length < 300) errs.message = 'Message must be at least 300 characters.';
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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl border border-neutral-100 w-full max-w-lg mx-4 p-0 relative animate-fadeIn"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
      >
        <button
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
        {!salesSent ? (
          <form onSubmit={handleSalesSubmit} className="flex flex-col flex-1 space-y-5 px-6 pt-8 pb-4 sm:px-8" style={{ minHeight: 0 }}>
            <h2 className="text-2xl font-bold text-center mb-1">Contact Sales</h2>
            <p className="text-neutral-600 text-center mb-6">Tell us about your organization and how we can help.</p>
            <div className="space-y-4 flex-1">
              <div>
                <label htmlFor="sales-name" className="font-semibold">Full Name *</label>
                <input id="sales-name" name="name" value={salesForm.name} onChange={handleSalesChange} className={`mt-1 w-full rounded border px-3 py-2 ${salesErrors.name ? 'border-red-400' : 'border-neutral-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} />
                {salesErrors.name && <div className="text-red-600 text-xs mt-1">{salesErrors.name}</div>}
              </div>
              <div>
                <label htmlFor="sales-email" className="font-semibold">Email *</label>
                <input id="sales-email" name="email" type="email" value={salesForm.email} onChange={handleSalesChange} className={`mt-1 w-full rounded border px-3 py-2 ${salesErrors.email ? 'border-red-400' : 'border-neutral-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} />
                {salesErrors.email && <div className="text-red-600 text-xs mt-1">{salesErrors.email}</div>}
              </div>
              <div>
                <label htmlFor="sales-company" className="font-semibold">Company Name *</label>
                <input id="sales-company" name="company" value={salesForm.company} onChange={handleSalesChange} className={`mt-1 w-full rounded border px-3 py-2 ${salesErrors.company ? 'border-red-400' : 'border-neutral-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} />
                {salesErrors.company && <div className="text-red-600 text-xs mt-1">{salesErrors.company}</div>}
              </div>
              <div>
                <label htmlFor="sales-phone" className="font-semibold">Phone</label>
                <input id="sales-phone" name="phone" type="tel" value={salesForm.phone} onChange={handleSalesChange} className="mt-1 w-full rounded border px-3 py-2 border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="sales-role" className="font-semibold">Your Role *</label>
                <input id="sales-role" name="role" value={salesForm.role} onChange={handleSalesChange} className={`mt-1 w-full rounded border px-3 py-2 ${salesErrors.role ? 'border-red-400' : 'border-neutral-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} />
                {salesErrors.role && <div className="text-red-600 text-xs mt-1">{salesErrors.role}</div>}
              </div>
              <div>
                <label htmlFor="sales-company-size" className="font-semibold">Company Size</label>
                <select id="sales-company-size" name="companySize" value={salesForm.companySize} onChange={handleSalesChange} className="mt-1 w-full rounded border px-3 py-2 border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="" disabled>Select size</option>
                  <option value="1-50">1-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
              <div>
                <label className="font-semibold">Interested In</label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {['Enterprise Solutions', 'Custom Integration', 'API Access', 'Training & Support'].map(interest => (
                    <label key={interest} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        name="interests"
                        value={interest}
                        checked={salesForm.interests.includes(interest)}
                        onChange={handleSalesChange}
                        className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 focus:border-blue-500"
                        id={`sales-interest-${interest.replace(/\s+/g, '').toLowerCase()}`}
                      />
                      {interest}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="sales-message" className="font-semibold">Message *</label>
                <textarea id="sales-message" name="message" value={salesForm.message} onChange={handleSalesChange} className={`mt-1 w-full rounded border px-3 py-2 ${salesErrors.message ? 'border-red-400' : 'border-neutral-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} rows={5} maxLength={1000} placeholder="Tell us about your needs and how we can help... (min 300 characters)" />
                <div className="flex justify-between text-xs mt-1">
                  <span className={salesForm.message.length < 300 ? 'text-red-600' : 'text-neutral-500'}>
                    {salesForm.message.length}/300
                  </span>
                  {salesErrors.message && <span className="text-red-600">{salesErrors.message}</span>}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 left-0 right-0 bg-white pt-2 pb-2 -mx-6 sm:-mx-8 px-6 sm:px-8 border-t border-neutral-100">
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={salesLoading}>
                {salesLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                Contact Sales Team
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center">
            <CheckCircle className="mx-auto text-green-500 mb-2" size={48} />
            <h2 className="text-2xl font-bold mb-2">Thank you for your interest!</h2>
            <p className="mb-4 text-neutral-700">Our sales team will contact you within 24 hours to discuss how we can help your organization.</p>
            <div className="bg-blue-50 rounded-lg p-4 text-left text-sm">
              <div className="font-semibold mb-1">What happens next?</div>
              <ul className="list-disc list-inside space-y-1">
                <li>A sales representative will reach out to schedule a consultation</li>
                <li>We'll discuss your specific needs and requirements</li>
                <li>You'll receive a customized proposal and demo</li>
              </ul>
            </div>
            <button className="mt-6 text-blue-700 underline font-medium" onClick={resetSales}>Submit another inquiry</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesModal; 