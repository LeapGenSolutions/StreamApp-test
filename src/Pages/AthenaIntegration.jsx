import { useState } from "react";
import { ArrowLeft, Activity, Eye, EyeOff, Shield, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";

// Athena Logo Component
function AthenaLogo({ size = 64, className = "", animated = true }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={`${animated ? 'transition-all duration-300' : ''} ${isHovered ? 'scale-105' : ''}`}
      >
        <defs>
          <linearGradient id="athenaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0891b2" stopOpacity="1" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
            <stop offset="100%" stopColor="#67e8f9" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#cffafe" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        
        {/* Main circle background */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="url(#athenaGradient)"
          className={`${animated ? 'transition-all duration-300' : ''}`}
          style={{
            filter: isHovered ? 'drop-shadow(0 6px 20px rgba(8, 145, 178, 0.4))' : 'drop-shadow(0 2px 10px rgba(8, 145, 178, 0.2))'
          }}
        />
        
        {/* Inner ring */}
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.4"
        />
        
        {/* Medical heartbeat line */}
        <g transform="translate(50, 50)">
          <path
            d="M -20 0 L -15 0 L -12 -8 L -8 12 L -4 -15 L 0 8 L 4 -6 L 8 0 L 20 0"
            stroke="white"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${animated ? 'transition-all duration-300' : ''}`}
            style={{
              filter: isHovered ? 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.6))' : 'none',
              opacity: isHovered ? 1 : 0.95
            }}
          />
        </g>
        
        {/* Medical cross - small and subtle */}
        <g transform="translate(50, 28)">
          <rect
            x="-1.5"
            y="-6"
            width="3"
            height="12"
            fill="white"
            rx="1.5"
            opacity="0.8"
          />
          <rect
            x="-6"
            y="-1.5"
            width="12"
            height="3"
            fill="white"
            rx="1.5"
            opacity="0.8"
          />
        </g>
        
        {/* Data dots around the circle */}
        <g className={`${animated ? 'transition-all duration-300' : ''}`}>
          <circle cx="75" cy="35" r="2" fill="white" opacity={isHovered ? "0.9" : "0.6"} />
          <circle cx="75" cy="65" r="2" fill="white" opacity={isHovered ? "0.9" : "0.6"} />
          <circle cx="25" cy="35" r="2" fill="white" opacity={isHovered ? "0.9" : "0.6"} />
          <circle cx="25" cy="65" r="2" fill="white" opacity={isHovered ? "0.9" : "0.6"} />
        </g>
        
        {/* Pulse rings on hover */}
        {animated && isHovered && (
          <>
            <circle
              cx="50"
              cy="50"
              r="20"
              fill="none"
              stroke="white"
              strokeWidth="1"
              opacity="0.4"
              className="animate-ping"
            />
            <circle
              cx="50"
              cy="50"
              r="30"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
              opacity="0.3"
              className="animate-ping"
              style={{ animationDelay: '0.3s' }}
            />
          </>
        )}
      </svg>
    </div>
  );
}

export default function AthenaIntegration() {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Mock data for demonstration
  const [athenaSettings, setAthenaSettings] = useState({
    connectionStatus: 'pending',
    isEnabled: false,
    hasApiKey: false,
    syncSettings: {
      appointments: false,
      patients: false,
      reports: false,
    },
    lastConnectionTest: null
  });

  const handleConnectToAthena = () => {
    setIsConnecting(true);
    
    // Open Athena portal in a new window
    const athenaWindow = window.open(
      'https://pxppapp.px.athena.io/',
      'athena-portal',
      'width=800,height=600,scrollbars=yes,resizable=yes'
    );
    
    // Listen for window close or successful authentication
    const checkConnection = setInterval(() => {
      if (athenaWindow.closed) {
        clearInterval(checkConnection);
        setIsConnecting(false);
        
        // Simulate successful connection status update
        setTimeout(() => {
          setAthenaSettings(prev => ({
            ...prev,
            connectionStatus: 'connected',
            isEnabled: true,
          }));
        }, 1000);
      }
    }, 1000);
    
    // Timeout after 5 minutes
    setTimeout(() => {
      if (!athenaWindow.closed) {
        athenaWindow.close();
        clearInterval(checkConnection);
        setIsConnecting(false);
      }
    }, 300000);
  };

  const handleSaveSettings = () => {
    // Simulate saving settings
    console.log('Saving settings:', { apiKey, athenaSettings });
    
    // Update status to configured
    setAthenaSettings(prev => ({
      ...prev,
      connectionStatus: 'configured',
    }));
    
    // Navigate back to settings page with configured status
    setTimeout(() => {
      window.location.href = '/settings?fromAthena=configured';
    }, 1500);
  };

  const handleTestConnection = () => {
    if (!apiKey) {
      alert("Please enter your Athena API key to test the connection");
      return;
    }
    // Simulate connection test
    console.log('Testing connection with API key:', apiKey);
  };

  const getStatusBadge = () => {
    switch (athenaSettings.connectionStatus) {
      case 'connected':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case 'configured':
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Configured
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Connection Error
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Not Connected
          </Badge>
        );
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={handleGoBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Athena Health Integration</h1>
          <p className="text-gray-600 mt-1">Connect your healthcare systems with Athena's platform</p>
        </div>
      </div>

      {/* Main Integration Card */}
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <AthenaLogo size={32} />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Athena Health Integration</CardTitle>
                <CardDescription className="text-blue-100">
                  Seamlessly connect with Athena's healthcare platform
                </CardDescription>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-8 p-6">
          {/* Connection Status & Action */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-100">
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center">
                <AthenaLogo size={80} animated={true} />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {athenaSettings?.connectionStatus === 'connected' || athenaSettings?.connectionStatus === 'configured' 
                    ? 'Connected to Athena' 
                    : 'Connect to Athena Portal'
                  }
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {athenaSettings?.connectionStatus === 'connected' || athenaSettings?.connectionStatus === 'configured'
                    ? 'Your integration is active and ready for data synchronization'
                    : 'Authenticate with Athena Health to enable seamless data integration'
                  }
                </p>
              </div>

              {athenaSettings?.connectionStatus !== 'connected' && athenaSettings?.connectionStatus !== 'configured' ? (
                <Button
                  onClick={handleConnectToAthena}
                  disabled={isConnecting}
                  className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 hover:from-blue-700 hover:via-blue-800 hover:to-purple-800 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isConnecting ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <AthenaLogo size={16} className="mr-2" />
                      Connect to Athena Portal
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex items-center justify-center gap-2 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">
                    {athenaSettings?.connectionStatus === 'configured' ? 'Successfully Configured' : 'Successfully Connected'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Integration Settings - Only show when connected */}
          {(athenaSettings?.connectionStatus === 'connected' || athenaSettings?.connectionStatus === 'configured') && (
            <>
              <Separator className="bg-blue-100" />
              
              {/* Enable Integration Toggle */}
              <div className="bg-white/50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="athena-enabled" className="text-sm font-semibold text-gray-900">
                      Enable Data Synchronization
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Allow automatic data sync between systems
                    </p>
                  </div>
                  <Switch
                    id="athena-enabled"
                    checked={athenaSettings?.isEnabled || false}
                    onCheckedChange={(checked) => {
                      setAthenaSettings(prev => ({
                        ...prev,
                        isEnabled: checked,
                      }));
                    }}
                  />
                </div>
              </div>

              {/* API Key Configuration */}
              <div className="bg-white/50 rounded-xl p-4 border border-blue-100 space-y-4">
                <Label htmlFor="api-key" className="text-sm font-semibold text-gray-900">
                  API Authentication Key
                </Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    placeholder={athenaSettings?.hasApiKey ? "••••••••••••••••" : "Enter your Athena API key"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-10 bg-white/80 border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Your API key is encrypted and stored securely
                </p>
              </div>

              {/* Action Buttons - Only show when connected */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleTestConnection}
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Test API Connection
                </Button>
                <Button
                  onClick={handleSaveSettings}
                  className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 hover:from-blue-700 hover:via-blue-800 hover:to-purple-800 text-white shadow-md hover:shadow-lg transition-all"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
              </div>

              {/* Last Connection Test */}
              {athenaSettings?.lastConnectionTest && (
                <div className="text-xs text-gray-500 pt-2 border-t border-blue-100">
                  Last tested: {new Date(athenaSettings.lastConnectionTest).toLocaleString()}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 