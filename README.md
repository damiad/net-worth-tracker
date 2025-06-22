# Net Worth Tracker

A personal finance dashboard to track assets and liabilities from various sources and visualize your net worth over time.

**Live Demo:** [https://damiad.github.io/net-worth-tracker/](https://damiad.github.io/net-worth-tracker/)

---

## Features

-   **Secure Google Authentication:** Sign in with your Google account. All data is stored securely and is private to your user account.
-   **Dynamic Source Management:** Add, edit, and update various types of financial sources, including:
    -   Bank & Investment Accounts (in multiple currencies).
    -   Properties (with value and debt tracking).
-   **Real-time Currency Conversion:** Automatically fetches the latest exchange rates to provide an accurate total in PLN.
-   **Persistent Cloud Storage:** All data is saved in a secure Firestore database.
-   **Data Visualization:**
    -   Historical line chart to track net worth over time.
    -   Asset allocation pie chart to see how your investments are distributed.

---

## Tech Stack

-   **Frontend:** React.js
-   **Styling:** Tailwind CSS
-   **Database & Auth:** Google Firebase (Firestore & Authentication)
-   **Charts:** Recharts

---

## Setup & Deployment

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Firebase:**
    -   Create a Firebase project at [firebase.google.com](https://firebase.google.com).
    -   Create a web app and get your `firebaseConfig` object.
    -   Create a file `src/firebaseConfig.js` and export your config object from it.
      ```javascript
      // src/firebaseConfig.js
      const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_AUTH_DOMAIN",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_STORAGE_BUCKET",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
      };

      export default firebaseConfig;
      ```

4.  **Run locally:**
    ```bash
    npm start
    ```

5.  **Deploy to GitHub Pages:**
    ```bash
    npm run deploy
    ```

---

## License

This project is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. See the `LICENSE` file for the full terms.