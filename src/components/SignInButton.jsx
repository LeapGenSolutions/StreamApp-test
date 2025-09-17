import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";

/**
 * Renders a drop down button with child buttons for logging in with a popup or redirect
 */
export const SignInButton = () => {
    const { instance } = useMsal();

    const handleLogin = () => {
        instance.loginRedirect(loginRequest).catch(e => {
            console.log(e);
        });
    }
    return (
        <div className="relative ml-auto">
            <button
                onClick={() => {
                    handleLogin();
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
                Sign In
            </button>
        </div>
    )
}