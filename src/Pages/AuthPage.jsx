import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { navigate } from "wouter/use-browser-location";
import { loginRequest } from "../authConfig";
import Logo from "../assets/Logo";


const AuthPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isGuestLoading, setIsGuestLoading] = useState(false);

    const { instance, accounts } = useMsal();

    useEffect(() => {
        document.title = "SignUp - Seismic Connect";
      }, []);

    function requestProfileData() {
        // Silently acquires an access token which is then attached to a request for MS Graph data
        instance
            .acquireTokenSilent({
                ...loginRequest,
                account: accounts[0],
            })
            .then((response) => {
                console.log(response);

            });
    }

    const handleLogin = () => {
        setIsLoading(true)
        instance.loginRedirect(loginRequest)
            .then((response) => {
                requestProfileData()
                navigate("/")
            })
            .catch(e => {
                console.log(e);
            }).finally(() => { setIsLoading(false) });
    }

    // const handleSignIn = () => {
    //     setIsLoading(true);
    //     setTimeout(() => {
    //         setIsLoading(false);
    //         navigate('/dashboard');
    //     }, 800);
    // };

    const handleGuest = () => {
        setIsGuestLoading(true);
        // Save guest session info
        localStorage.setItem("isGuest", "true");

        setTimeout(() => {
            setIsGuestLoading(false);
            navigate("/dashboard");
        }, 800);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 relative overflow-hidden">
            {/* Logo and Title */}
            <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-lg relative login-card-glow flex flex-col items-center">
                <div className="flex justify-center mb-4">
                    <div className="w-32 h-32 flex items-center justify-center">
                        <Logo size="large" />
                    </div>
                </div>
                <h2 className="text-3xl font-extrabold text-[#1E3A8A] mb-2 text-center">Seismic Connect</h2>
                <p className="mb-8 text-[#1E40AF] font-medium text-center">Healthcare Intelligence Platform</p>

                {/* Sign In Button */}
                <button
                    onClick={handleLogin}
                    disabled={isLoading || isGuestLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:from-[#1E3A8A] hover:to-[#2563EB] text-white font-semibold py-3 rounded-lg transition-colors mb-4"
                >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
                <button
                    onClick={handleGuest}
                    disabled={isLoading || isGuestLoading}
                    className={`w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-semibold py-3 rounded-lg transition-colors ${isGuestLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                    {isGuestLoading ? 'Continuing...' : 'Continue as Guest'}
                </button>
                <div className="mt-8 text-center text-xs text-gray-400">
                    © 2025 Seismic Connect. All rights reserved.
                </div>
            </div>

            {/* Animated medical pulse line */}
            <div className="absolute left-0 right-0 w-full pointer-events-none" style={{ zIndex: 10, bottom: '24px' }}>
                <svg height="80" width="100%" className="heartbeat-line" style={{ display: 'block' }}>
                    <path
                        d="M0,60 L30,60 L40,20 L50,70 L60,20 L70,70 L80,60 L100,60 L110,20 L120,70 L130,20 L140,70 L150,60 L180,60 L200,20 L220,70 L240,20 L260,70 L280,60 L300,60"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="4"
                        strokeDasharray="400"
                        strokeDashoffset="400"
                    />
                </svg>
                <style>{`
          .heartbeat-line path {
            animation: heartbeat 5s ease-in-out infinite;
          }
          @keyframes heartbeat {
            0% { stroke-dashoffset: 400; }
            50% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -400; }
          }
        `}</style>
            </div>
        </div>
    );
}

export default AuthPage