// FILE: frontend/src/pages/VerifyEmail.tsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      return;
    }

    // Simulate verification API call
    fetch(`${import.meta.env.VITE_API_URL}/auth/verify-email?token=${token}`)
      .then((res) => {
        if (res.ok) setStatus("success");
        else throw new Error("Invalid token");
      })
      .catch(() => setStatus("error"));
  }, [searchParams]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md text-center">
        {status === "loading" && (
          <>
            <h1 className="text-xl font-semibold text-brand-teal mb-2">
              Verifying your email...
            </h1>
            <p className="text-gray-500 text-sm">Please wait a moment.</p>
          </>
        )}
        {status === "success" && (
          <>
            <h1 className="text-xl font-semibold text-green-600 mb-2">
              Email Verified Successfully 🎉
            </h1>
            <p className="text-gray-500 text-sm">You can now log in to your account.</p>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-xl font-semibold text-red-500 mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-500 text-sm">
              Invalid or expired link. Please request a new one.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
