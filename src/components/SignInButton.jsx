import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";
import { useState } from "react";
import { callMsGraph } from "../graph";

/**
 * Renders a drop down button with child buttons for logging in with a popup or redirect
 */
export const SignInButton = () => {
    const { instance, accounts } = useMsal();
    const setGraphData = useState(null)[1];

    function requestProfileData() {
        // Silently acquires an access token which is then attached to a request for MS Graph data
        instance
            .acquireTokenSilent({
                ...loginRequest,
                account: accounts[0],
            })
            .then((response) => {
                callMsGraph(response.accessToken).then((response) => {
                    setGraphData(response);
                });
            });
    }

    const handleLogin = (loginType) => {
        if (loginType === "popup") {
            instance.loginPopup(loginRequest)
                .then(res => {
                    requestProfileData()
                })
                .catch(e => {
                    console.log(e);
                });
        } else if (loginType === "redirect") {
            instance.loginRedirect(loginRequest).catch(e => {
                console.log(e);
            });
        }
    }
    return (
        <div className="relative ml-auto">
            <button
                onClick={() => {
                    handleLogin("redirect");
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
                Sign In
            </button>
        </div>
    )
}