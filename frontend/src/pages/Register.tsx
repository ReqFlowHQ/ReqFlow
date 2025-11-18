// FILE: frontend/src/pages/Register.tsx
import { useState } from "react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-brand-teal mb-4 text-center">Create Account</h1>
        <form>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 mb-3 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 mb-4 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          />
          <button
            type="submit"
            className="w-full bg-brand-teal hover:bg-brand-purple text-white py-2 rounded-md transition"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
