import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { firebaseConfig } from "./firebaseConfig";

import Dashboard from "./components/Dashboard";
import AuthScreen from "./components/AuthScreen";
import { Spinner } from "./components/ui/Spinner";

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [auth, setAuth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      if (!firebaseConfig || !firebaseConfig.apiKey) {
        console.warn("Firebase config is missing or incomplete.");
        setIsLoading(false);
        return;
      }

      const app = initializeApp(firebaseConfig);
      const authInstance = getAuth(app);
      setAuth(authInstance);

      const unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
        setUser(currentUser);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Firebase initialization failed:", e);
      setError(
        "Could not initialize the application. Please check your Firebase configuration."
      );
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return <Spinner />;
  }

  if (!user) {
    return <AuthScreen auth={auth} setError={setError} error={error} />;
  }

  return <Dashboard user={user} auth={auth} />;
}

export default App;
