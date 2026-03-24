import { useState } from "react";
import { ArrowLeft, Lock, CreditCard, User, Calendar, Shield, MapPin, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function PaymentBilling() {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit-card');
  const [useSavedCard, setUseSavedCard] = useState(false);
  const [saveCard, setSaveCard] = useState(true);
  const [showBillingAddress, setShowBillingAddress] = useState(false);
  const [isConnectingVenmo, setIsConnectingVenmo] = useState(false);
  const [isConnectingPayPal, setIsConnectingPayPal] = useState(false);
  
  const [cardDetails, setCardDetails] = useState({
    cardholderName: 'John Doe',
    cardNumber: '1234 5678 9012 3456',
    expiryDate: '',
    cvv: '123'
  });

  const [billingAddress, setBillingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  });

  const [savedCards, setSavedCards] = useState([
    {
      id: 1,
      type: 'visa',
      last4: '4242',
      cardholderName: 'John Doe',
      expiryDate: '12/25',
      isDefault: true
    },
    {
      id: 2,
      type: 'mastercard',
      last4: '5555',
      cardholderName: 'John Doe',
      expiryDate: '08/26',
      isDefault: false
    }
  ]);

  const handleGoBack = () => {
    window.history.back();
  };

  const detectCardType = (cardNumber) => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (cleanNumber.startsWith('4')) return 'visa';
    if (cleanNumber.startsWith('5')) return 'mastercard';
    if (cleanNumber.startsWith('34') || cleanNumber.startsWith('37')) return 'amex';
    if (cleanNumber.startsWith('6')) return 'discover';
    return 'unknown';
  };

  const getCardTypeIcon = (type) => {
    switch (type) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      case 'discover':
        return '💳';
      default:
        return '💳';
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
   const match = (matches && matches[0]) || '';

    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  const handleCardNumberChange = (e) => {
    const value = e.target.value;
    const formatted = formatCardNumber(value);
    if (formatted.length <= 19) {
      setCardDetails(prev => ({ ...prev, cardNumber: formatted }));
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) return v.substring(0, 2) + '/' + v.substring(2, 4);
    return v;
  };

  const handleExpiryDateChange = (e) => {
    const value = e.target.value;
    const formatted = formatExpiryDate(value);
    if (formatted.length <= 5) {
      setCardDetails(prev => ({ ...prev, expiryDate: formatted }));
    }
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/gi, '');
    if (value.length <= 4) {
      setCardDetails(prev => ({ ...prev, cvv: value }));
    }
  };


  const handleDeleteCard = (cardId) => {
    setSavedCards(prev => prev.filter(card => card.id !== cardId));
  };

  const handleSetDefaultCard = (cardId) => {
    setSavedCards(prev => prev.map(card => ({
      ...card,
      isDefault: card.id === cardId
    })));
  };

  const handleConnectVenmo = () => {
    setIsConnectingVenmo(true);
    const venmoWindow = window.open('https://account.venmo.com/', '_blank', 'width=600,height=700');
    
    const checkClosed = setInterval(() => {
      if (venmoWindow.closed) {
        clearInterval(checkClosed);
        setIsConnectingVenmo(false);
        alert('Venmo connected successfully!');
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(checkClosed);
      if (!venmoWindow.closed) venmoWindow.close();
      setIsConnectingVenmo(false);
    }, 300000);
  };

  const handleConnectPayPal = () => {
    setIsConnectingPayPal(true);
    const paypalWindow = window.open('https://www.paypal.com/signin', '_blank', 'width=600,height=700');
    
    const checkClosed = setInterval(() => {
      if (paypalWindow.closed) {
        clearInterval(checkClosed);
        setIsConnectingPayPal(false);
        alert('PayPal connected successfully!');
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(checkClosed);
      if (!paypalWindow.closed) paypalWindow.close();
      setIsConnectingPayPal(false);
    }, 300000);
  };

  const paymentMethods = [
    { id: 'credit-card', name: 'Credit Card', icon: CreditCard, selected: selectedPaymentMethod === 'credit-card' },
    { id: 'venmo', name: 'Venmo', icon: '📱', selected: selectedPaymentMethod === 'venmo' },
    { id: 'paypal', name: 'PayPal', icon: 'PP', selected: selectedPaymentMethod === 'paypal' }
  ];

  const currentCardType = detectCardType(cardDetails.cardNumber);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={handleGoBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment & Billing Management</h1>
          <p className="text-gray-600 mt-1">Complete your payment to access premium features</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT CARD */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-0 overflow-hidden">

            <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-white">Payment Information</CardTitle>
                  <p className="text-blue-100 text-sm mt-1">Your payment details are encrypted and secure</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8 space-y-8">

              {/* PAYMENT METHODS */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>

                <div className="grid grid-cols-3 gap-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        method.selected 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        {typeof method.icon === 'string' ? (
                          <span className="text-2xl">{method.icon}</span>
                        ) : (
                          <method.icon className="w-6 h-6 text-gray-600" />
                        )}
                        <span className="font-medium text-sm text-gray-700">{method.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SAVED CARDS WITH PREMIUM TOGGLE v2 */}
              {selectedPaymentMethod === 'credit-card' && savedCards.length > 0 && (
                <div className="space-y-4">

                  <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h4 className="text-md font-semibold text-gray-900">Saved Cards</h4>

                    {/* ⭐ PREMIUM TOGGLE v2 (Updated) */}
                    <button
                      type="button"
                      onClick={() => setUseSavedCard(!useSavedCard)}
                      className={`relative inline-flex items-center h-6 w-12 rounded-full transition-all duration-300 
                        ${useSavedCard ? "bg-blue-600" : "bg-gray-300"}
                      `}
                    >
                      {/* OFF icon */}
                      <span
                        className={`absolute left-1 flex h-4 w-4 items-center justify-center transition-opacity
                          ${useSavedCard ? "opacity-0" : "opacity-100"}
                        `}
                      >
                        <svg className="w-3 h-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="12" cy="12" r="9" strokeWidth="2" />
                        </svg>
                      </span>

                      {/* ON icon */}
                      <span
                        className={`absolute right-1 flex h-4 w-4 items-center justify-center transition-opacity
                          ${useSavedCard ? "opacity-100" : "opacity-0"}
                        `}
                      >
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>

                      {/* THUMB */}
                      <span
                        className={`inline-block h-5 w-5 transform bg-white rounded-full shadow-md transition-transform duration-300
                          ${useSavedCard ? "translate-x-6" : "translate-x-0"}
                        `}
                      />
                    </button>
                  </div>
                  
                  {useSavedCard && (
                    <div className="space-y-3">
                      {savedCards.map((card) => (
                        <div
                          key={card.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            card.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleSetDefaultCard(card.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{getCardTypeIcon(card.type)}</span>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {card.type.charAt(0).toUpperCase() + card.type.slice(1)} •••• {card.last4}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {card.cardholderName} • Expires {card.expiryDate}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {card.isDefault && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Default</span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCard(card.id);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VENMO / PAYPAL */}
              {selectedPaymentMethod === 'venmo' && (
                <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center space-y-4">
                  <div className="text-4xl mb-2">📱</div>
                  <h4 className="text-lg font-semibold text-gray-900">Connect Venmo Account</h4>
                  <p className="text-gray-600">Link your Venmo account for quick and secure payments</p>
                  <Button
                    onClick={handleConnectVenmo}
                    disabled={isConnectingVenmo}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isConnectingVenmo ? "Connecting..." : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Connect to Venmo
                      </>
                    )}
                  </Button>
                </div>
              )}

              {selectedPaymentMethod === 'paypal' && (
                <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center space-y-4">
                  <div className="text-4xl mb-2">PP</div>
                  <h4 className="text-lg font-semibold text-gray-900">Connect PayPal Account</h4>
                  <p className="text-gray-600">Link your PayPal account for secure online payments</p>
                  <Button
                    onClick={handleConnectPayPal}
                    disabled={isConnectingPayPal}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isConnectingPayPal ? "Connecting..." : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Connect to PayPal
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* CARD FORM */}
              {selectedPaymentMethod === 'credit-card' && !useSavedCard && (
                <div className="space-y-6">
                  
                  <div>
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4" /> Cardholder Name
                    </Label>
                    <Input
                      value={cardDetails.cardholderName}
                      onChange={(e) => setCardDetails(prev => ({ ...prev, cardholderName: e.target.value }))}
                      className="h-11"
                      placeholder="Enter cardholder name"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <CreditCard className="w-4 h-4" /> Card Number
                    </Label>
                    <div className="relative">
                      <Input
                        value={cardDetails.cardNumber}
                        onChange={handleCardNumberChange}
                        className="h-11 pr-12"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                      {currentCardType !== 'unknown' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <span className="text-lg">{getCardTypeIcon(currentCardType)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Enter 16-digit card number</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4" /> Expiry Date
                      </Label>
                      <Input
                        placeholder="MM/YY"
                        value={cardDetails.expiryDate}
                        onChange={handleExpiryDateChange}
                        className="h-11"
                        maxLength={5}
                      />
                      <p className="text-xs text-gray-500 mt-1">MM/YY format</p>
                    </div>
                    <div>
                      <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Shield className="w-4 h-4" /> CVV
                      </Label>
                      <Input
                        value={cardDetails.cvv}
                        onChange={handleCvvChange}
                        className="h-11"
                        placeholder="123"
                        maxLength={4}
                      />
                      <p className="text-xs text-gray-500 mt-1">3 or 4 digits</p>
                    </div>
                  </div>

                  {/* Save card toggle */}
                  <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <button
                      type="button"
                      onClick={() => setSaveCard(!saveCard)}
                      className={`relative inline-flex items-center h-6 w-12 rounded-full transition-all duration-300 
                        ${saveCard ? "bg-blue-600" : "bg-gray-300"}
                      `}
                    >
                      <span
                        className={`absolute left-1 flex h-4 w-4 items-center justify-center transition-opacity
                          ${saveCard ? "opacity-0" : "opacity-100"}
                        `}
                      >
                        <svg className="w-3 h-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="12" cy="12" r="9" strokeWidth="2" />
                        </svg>
                      </span>

                      <span
                        className={`absolute right-1 flex h-4 w-4 items-center justify-center transition-opacity
                          ${saveCard ? "opacity-100" : "opacity-0"}
                        `}
                      >
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>

                      <span
                        className={`inline-block h-5 w-5 transform bg-white rounded-full shadow-md transition-transform duration-300
                          ${saveCard ? "translate-x-6" : "translate-x-0"}
                        `}
                      />
                    </button>

                    <div>
                      <div className="font-medium text-gray-900">Save this card for future payments</div>
                      <div className="text-sm text-gray-600">Your card details will be securely stored</div>
                    </div>
                  </div>

                  {/* Billing Address Toggle */}
                  <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <button
                      type="button"
                      onClick={() => setShowBillingAddress(!showBillingAddress)}
                      className={`relative inline-flex items-center h-6 w-12 rounded-full transition-all duration-300 
                        ${showBillingAddress ? "bg-blue-600" : "bg-gray-300"}
                      `}
                    >
                      <span
                        className={`absolute left-1 flex h-4 w-4 items-center justify-center transition-opacity
                          ${showBillingAddress ? "opacity-0" : "opacity-100"}
                        `}
                      >
                        <svg className="w-3 h-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="12" cy="12" r="9" strokeWidth="2" />
                        </svg>
                      </span>

                      <span
                        className={`absolute right-1 flex h-4 w-4 items-center justify-center transition-opacity
                          ${showBillingAddress ? "opacity-100" : "opacity-0"}
                        `}
                      >
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>

                      <span
                        className={`inline-block h-5 w-5 transform bg-white rounded-full shadow-md transition-transform duration-300
                          ${showBillingAddress ? "translate-x-6" : "translate-x-0"}
                        `}
                      />
                    </button>

                    <div>
                      <div className="font-medium text-gray-900">Add billing address</div>
                      <div className="text-sm text-gray-600">Required for some payment methods</div>
                    </div>
                  </div>

                  {/* Billing Address Form */}
                  {showBillingAddress && (
                    <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Billing Address
                      </h4>

                      <div className="grid grid-cols-1 gap-4">

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Street Address</Label>
                          <Input
                            value={billingAddress.street}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, street: e.target.value }))}
                            className="h-11"
                            placeholder="123 Main St"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">City</Label>
                            <Input
                              value={billingAddress.city}
                              onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                              className="h-11"
                              placeholder="New York"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">State</Label>
                            <Input
                              value={billingAddress.state}
                              onChange={(e) => setBillingAddress(prev => ({ ...prev, state: e.target.value }))}
                              className="h-11"
                              placeholder="NY"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">ZIP Code</Label>
                            <Input
                              value={billingAddress.zipCode}
                              onChange={(e) => setBillingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                              className="h-11"
                              placeholder="10001"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Country</Label>
                            <Input
                              value={billingAddress.country}
                              onChange={(e) => setBillingAddress(prev => ({ ...prev, country: e.target.value }))}
                              className="h-11"
                              placeholder="United States"
                            />
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              )}

            </CardContent>
          </Card>
        </div>

        {/* RIGHT CARD */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-0 h-fit">
            <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-white">Order Summary</CardTitle>
                  <p className="text-slate-200 text-sm mt-1">Review your purchase details</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm">Healthcare Platform Access</span>
                  <span className="font-semibold text-gray-900">$99.99</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm">Athena Integration</span>
                  <span className="font-semibold text-gray-900">$19.99</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm">Processing Fee</span>
                  <span className="font-semibold text-gray-900">$6.01</span>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-gray-900">Total</span>
                    <span className="font-bold text-xl text-gray-900">$125.99</span>
                  </div>
                </div>
              </div>

              {/* PAYMENT METHOD SHOWN ON SUMMARY */}
              <div className="flex items-center gap-2 text-sm text-gray-600 py-2">
                <span>Payment Method:</span>
                {selectedPaymentMethod === 'credit-card' && (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span className="font-medium">
                      {useSavedCard ? "Saved Card" : "Credit Card"}
                    </span>
                  </>
                )}
                {selectedPaymentMethod === 'venmo' && (
                  <>
                    <span className="text-lg">📱</span>
                    <span className="font-medium">Venmo</span>
                  </>
                )}
                {selectedPaymentMethod === 'paypal' && (
                  <>
                    <span className="font-bold">PP</span>
                    <span className="font-medium">PayPal</span>
                  </>
                )}
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold shadow-md">
                <Lock className="w-4 h-4 mr-2" />
                Complete Payment $125.99
              </Button>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-800 text-sm">256-bit SSL Encryption</span>
                </div>
                <p className="text-xs text-gray-600">Your payment information is secure and encrypted</p>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Your payment is protected by bank-level security
              </p>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
