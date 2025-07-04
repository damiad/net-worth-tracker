import { useEffect } from "react";

const GoogleTranslateScript = () => {
  useEffect(() => {
    const scriptId = "google-translate-script";

    // This function will be called by the Google Translate script once it's loaded.
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false },
        "google_translate_element"
      );
    };

    // This is the global "trigger" function for translating to a specific language.
    window.changeGoogleTranslateLanguage = (langCode) => {
      const googleContainer = document.getElementById("google_translate_element");
      const selectBox = googleContainer?.querySelector("select.goog-te-combo");
      if (selectBox) {
        selectBox.value = langCode;
        selectBox.dispatchEvent(new Event("change"));
      }
    };

    // UPDATED FUNCTION: This now reverts the translation without reloading the page.
    window.revertGoogleTranslate = () => {
      const googleContainer = document.getElementById("google_translate_element");
      const selectBox = googleContainer?.querySelector("select.goog-te-combo");
      
      // Check if the select box exists and a translation is active.
      if (selectBox && selectBox.value !== "en") {
        selectBox.value = "en";
        // Dispatch the "change" event to trigger Google's revert action.
        selectBox.dispatchEvent(new Event("change"));
      }
    };


    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit`;
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // This div is required by Google's script but will be permanently hidden by our CSS.
  return <div id="google_translate_element" />;
};

export default GoogleTranslateScript;
