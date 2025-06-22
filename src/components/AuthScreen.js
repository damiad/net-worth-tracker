import React from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Button } from "./ui/Button";
import { AlertCircle } from "lucide-react";

export default function AuthScreen({ auth, setError, error }) {
  const handleLogin = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Google sign-in error", err);
      setError("Failed to sign in with Google.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-black">
      <div className="text-center p-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-white">
          Net Worth Tracker
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          Your personal dashboard to financial clarity.
        </p>
        <div className="mt-8">
          <Button onClick={handleLogin} size="lg" className="gap-2 shadow-lg">
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-72.2 64.5C308.1 98.4 280.7 84 248 84c-84.3 0-152.3 67.8-152.3 151.8s68 151.8 152.3 151.8c99.9 0 127.9-81.5 131-123.3H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"
              ></path>
            </svg>
            Sign In with Google
          </Button>
        </div>
        {error && (
          <p className="mt-4 text-red-500 flex items-center justify-center gap-2">
            <AlertCircle size={16} /> {error}
          </p>
        )}
      </div>
    </div>
  );
}
