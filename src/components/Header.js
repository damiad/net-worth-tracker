import React, { useState } from "react";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { LogOut, DollarSign, Globe } from "lucide-react";
import { signOut } from "firebase/auth";

export default function Header({
  user,
  auth,
  displayCurrency,
  setDisplayCurrency,
}) {
  const [selectedLang, setSelectedLang] = useState("en");

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const handleLanguageChange = (e) => {
    const langCode = e.target.value;
    setSelectedLang(langCode);

    // If English (the default) is selected, call the revert function.
    if (langCode === "en") {
      if (window.revertGoogleTranslate) {
        window.revertGoogleTranslate();
      }
    } else {
      // For any other language, call the normal translate function.
      if (window.changeGoogleTranslateLanguage) {
        window.changeGoogleTranslateLanguage(langCode);
      }
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800/50 backdrop-blur-sm shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-800 dark:text-white">
              NetWorth
            </span>
          </div>
          <div className="flex items-center gap-4">
            {/* Currency Selector */}
            <div className="w-28">
              <Select
                value={displayCurrency}
                onChange={(e) => setDisplayCurrency(e.target.value)}
                className="text-xs"
              >
                <option>PLN</option>
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
              </Select>
            </div>

            {/* Custom Language Selector */}
            <div className="flex items-center gap-1">
              <Globe size={16} className="text-gray-500 dark:text-gray-400" />
              <Select
                value={selectedLang}
                onChange={handleLanguageChange}
                className="text-xs w-28"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="pl">Polish</option>
                <option value="de">German</option>
              </Select>
            </div>

            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              {user.email || "Welcome!"}
            </span>
            <Button onClick={handleLogout} variant="ghost" className="gap-2">
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
