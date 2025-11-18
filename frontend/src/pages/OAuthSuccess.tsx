import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function OAuthSuccess() {
  const { login, token } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (token) {
      // Token already exists, redirect immediately
      setRedirecting(true);
      setTimeout(() => window.location.href = "/dashboard", 500);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const newToken = params.get("token");

    if (newToken) {
      // Save token and redirect
      sessionStorage.setItem("accessToken", newToken);
      login(newToken, {});
      setRedirecting(true);
      setTimeout(() => window.location.href = "/dashboard", 1500); // show animation
    } else {
      // No token at all, go to login
      window.location.href = "/login";
    }
  }, [login, token]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white text-center p-6">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-600/20 border border-green-500 mb-6 animate-bounce">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold mb-2">Authentication Successful</h1>
      <p className="text-gray-300 max-w-md mb-6">
        Your account has been securely connected. Redirecting to your dashboard...
      </p>
    </div>
  );
}
