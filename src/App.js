import React, { useState, useEffect, useMemo, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  onSnapshot,
  query,
  serverTimestamp,
  getDocs,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  PlusCircle,
  TrendingUp,
  DollarSign,
  Home,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  Loader,
  BarChart2,
  AlertCircle,
} from "lucide-react";
import { firebaseConfig } from './firebaseConfig';

// --- SHADCN-LIKE UI COMPONENTS (self-contained for portability) ---
const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm p-6 ${className}`}
  >
    {children}
  </div>
);
const CardHeader = ({ children, className = "" }) => (
  <div className={`pb-4 border-b dark:border-gray-700 mb-4 ${className}`}>
    {children}
  </div>
);
const CardTitle = ({ children, className = "" }) => (
  <h3
    className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}
  >
    {children}
  </h3>
);
const CardContent = ({ children, className = "" }) => (
  <div className={`text-sm text-gray-600 dark:text-gray-300 ${className}`}>
    {children}
  </div>
);
const Button = ({
  children,
  onClick,
  className = "",
  variant = "default",
  size = "md",
}) => {
  const baseStyle =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    outline:
      "border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-gray-500",
    ghost:
      "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-gray-500",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};
const Input = (props) => (
  <input
    {...props}
    className={`block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${props.className}`}
  />
);
const Select = (props) => (
  <select
    {...props}
    className={`block w-full pl-3 pr-10 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${props.className}`}
  >
    {props.children}
  </select>
);
const Dialog = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-4 border-b dark:border-gray-700 rounded-t">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
};
const Spinner = () => (
  <div className="flex justify-center items-center h-full min-h-screen">
    <Loader className="w-8 h-8 animate-spin text-blue-600" />
  </div>
);

// --- MAIN APP COMPONENT ---
export default function App() {
  // --- STATE MANAGEMENT ---
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [sources, setSources] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [snapshots, setSnapshots] = useState([]);

  const [exchangeRates, setExchangeRates] = useState({ USD: 4.0, EUR: 4.3 });
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState(null);

  // This can be any unique string for your app's data collections in Firestore.
  const appId = "net-worth-tracker";

  // --- FIREBASE INITIALIZATION & AUTH ---
  useEffect(() => {
    try {
      if (!firebaseConfig || !firebaseConfig.apiKey) {
        console.warn(
          "Firebase config is missing or incomplete. App will not connect to the database. Please paste your config object in `src/App.js`."
        );
        setIsLoading(false); // Stop loading as there's no auth to wait for.
        return;
      }

      const app = initializeApp(firebaseConfig);
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);
      setAuth(authInstance);
      setDb(dbInstance);

      const unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
        setUser(currentUser); // Will be null if not logged in.
        setIsLoading(false); // Auth check is complete, stop loading.
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Firebase initialization failed:", e);
      setError(
        "Could not initialize the application. Please check your Firebase configuration in `src/App.js`."
      );
      setIsLoading(false);
    }
  }, []);

  // --- DATA FETCHING (Sources, Accounts, Snapshots) ---
  useEffect(() => {
    if (!db || !user) {
      // Clear data when user logs out or is not available
      setSources([]);
      setAccounts([]);
      setSnapshots([]);
      return;
    }

    const userId = user.uid;
    const baseCollectionsPath = `artifacts/${appId}/users/${userId}`;

    const unsubSources = onSnapshot(
      query(collection(db, `${baseCollectionsPath}/sources`)),
      (snapshot) => {
        const sourcesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSources(sourcesData);
      },
      (err) => {
        console.error("Error fetching sources:", err);
        setError("Could not load financial sources.");
      }
    );

    const unsubAccounts = onSnapshot(
      query(collection(db, `${baseCollectionsPath}/accounts`)),
      (snapshot) => {
        const accountsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAccounts(accountsData);
      },
      (err) => {
        console.error("Error fetching accounts:", err);
        setError("Could not load account details.");
      }
    );

    const unsubSnapshots = onSnapshot(
      query(collection(db, `${baseCollectionsPath}/netWorthSnapshots`)),
      (snapshot) => {
        const snapshotData = snapshot.docs
          .map((doc) => ({ ...doc.data(), id: doc.id }))
          .filter((s) => s.timestamp) // Ensure timestamp exists
          .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
        setSnapshots(snapshotData);
      },
      (err) => {
        console.error("Error fetching snapshots:", err);
        setError("Could not load historical data.");
      }
    );

    return () => {
      unsubSources();
      unsubAccounts();
      unsubSnapshots();
    };
  }, [db, user, appId]);

  // --- CURRENCY CONVERSION API FETCH ---
  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Using a reliable, free API. NBP (Polish National Bank) is a good source.
        const response = await fetch(
          "https://api.nbp.pl/api/exchangerates/tables/A/?format=json"
        );
        if (!response.ok) throw new Error("Failed to fetch from NBP API");
        const data = await response.json();
        const ratesData = data[0].rates;
        const usdRate = ratesData.find((r) => r.code === "USD")?.mid;
        const eurRate = ratesData.find((r) => r.code === "EUR")?.mid;
        if (usdRate && eurRate) {
          setExchangeRates({ USD: usdRate, EUR: eurRate });
        }
      } catch (e) {
        console.error(
          "Could not fetch exchange rates, using default values.",
          e
        );
        // Keep default values if API fails
      }
    };
    fetchRates();
  }, []);

  // --- DATA CALCULATION & MEMOIZATION ---
  const processedData = useMemo(() => {
    const plnRates = { ...exchangeRates, PLN: 1 };

    const sourceValues = sources.map((source) => {
      let totalValuePLN = 0;
      let lastUpdated = null;

      if (source.type === "property") {
        const propertyValue = (source.m2 || 0) * (source.pricePerM2 || 0);
        const totalDebt = (source.bankDebt || 0) + (source.otherDebt || 0);
        totalValuePLN = propertyValue - totalDebt;
        lastUpdated = source.lastUpdated;
      } else {
        const sourceAccounts = accounts.filter(
          (acc) => acc.sourceId === source.id
        );
        if (sourceAccounts.length > 0) {
          totalValuePLN = sourceAccounts.reduce((sum, acc) => {
            const rate = plnRates[acc.currency] || 1;
            return sum + acc.balance * rate;
          }, 0);
          lastUpdated = sourceAccounts.reduce(
            (latest, acc) =>
              !latest ||
              (acc.lastUpdated &&
                acc.lastUpdated.toMillis() > latest.toMillis())
                ? acc.lastUpdated
                : latest,
            null
          );
        }
      }

      return { ...source, totalValuePLN, lastUpdated };
    });

    const netWorth = sourceValues.reduce(
      (sum, source) => sum + source.totalValuePLN,
      0
    );

    // Assets for pie chart (exclude negative values like pure debt properties)
    const assetAllocation = sourceValues
      .filter((s) => s.totalValuePLN > 0)
      .map((s) => ({ name: s.name, value: s.totalValuePLN }));

    return { sourceValues, netWorth, assetAllocation };
  }, [sources, accounts, exchangeRates]);

  // --- EVENT HANDLERS & DB ACTIONS ---
  const handleLogin = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google sign-in error", error);
      setError("Failed to sign in with Google.");
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const handleOpenModal = (source = null) => {
    setEditingSource(source);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingSource(null);
    setIsModalOpen(false);
  };

  const handleSaveSource = async (sourceData) => {
    if (!db || !user) return;
    const userId = user.uid;
    const baseDocPath = `artifacts/${appId}/users/${userId}`;

    const batch = writeBatch(db);
    const timestamp = serverTimestamp();

    try {
      // --- Save Source Configuration ---
      const sourceRef = sourceData.id
        ? doc(db, `${baseDocPath}/sources`, sourceData.id)
        : doc(collection(db, `${baseDocPath}/sources`));

      const sourcePayload = {
        name: sourceData.name,
        type: sourceData.type,
      };

      if (sourceData.type === "property") {
        sourcePayload.m2 = sourceData.m2;
        sourcePayload.pricePerM2 = sourceData.pricePerM2;
        sourcePayload.bankDebt = sourceData.bankDebt;
        sourcePayload.otherDebt = sourceData.otherDebt;
        sourcePayload.lastUpdated = timestamp;
      }
      batch.set(sourceRef, sourcePayload, { merge: true });

      // --- Save Accounts (for non-property types) ---
      if (sourceData.type !== "property" && sourceData.accounts) {
        sourceData.accounts.forEach((acc) => {
          const accountRef = acc.id
            ? doc(db, `${baseDocPath}/accounts`, acc.id)
            : doc(collection(db, `${baseDocPath}/accounts`));
          batch.set(
            accountRef,
            {
              ...acc,
              sourceId: sourceRef.id,
              lastUpdated: timestamp,
            },
            { merge: true }
          );
        });
      }

      // --- Commit all changes ---
      await batch.commit();

      // --- Take a new Net Worth Snapshot ---
      await takeSnapshot();

      handleCloseModal();
    } catch (e) {
      console.error("Error saving source:", e);
      setError("An error occurred while saving your data.");
    }
  };

  const handleDeleteSource = async (sourceId) => {
    if (!db || !user) return;
    // A simple confirm is fine for web, but for robust UI, a custom dialog is better.
    // This avoids issues in environments where window.confirm is blocked.
    if (
      !window.confirm(
        "Are you sure you want to delete this source and all its accounts? This cannot be undone."
      )
    )
      return;

    const userId = user.uid;
    const baseDocPath = `artifacts/${appId}/users/${userId}`;
    const batch = writeBatch(db);

    try {
      // Delete the source itself
      const sourceRef = doc(db, `${baseDocPath}/sources`, sourceId);
      batch.delete(sourceRef);

      // Find and delete associated accounts
      const associatedAccounts = accounts.filter(
        (acc) => acc.sourceId === sourceId
      );
      associatedAccounts.forEach((acc) => {
        const accountRef = doc(db, `${baseDocPath}/accounts`, acc.id);
        batch.delete(accountRef);
      });

      await batch.commit();
      await takeSnapshot(); // Update snapshot after deletion
    } catch (e) {
      console.error("Error deleting source:", e);
      setError("Failed to delete source.");
    }
  };

  const takeSnapshot = useCallback(async () => {
    if (!db || !user || processedData.netWorth === null) return;

    const userId = user.uid;
    const snapshotCollectionRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/netWorthSnapshots`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    // Check if a snapshot for today already exists
    const q = query(snapshotCollectionRef);
    const existingSnapshots = await getDocs(q);
    const todaySnapshotExists = existingSnapshots.docs.some((doc) => {
      const data = doc.data();
      if (data.timestamp && data.timestamp.toDate) {
        const snapshotDate = data.timestamp.toDate();
        snapshotDate.setHours(0, 0, 0, 0);
        return snapshotDate.getTime() === today.getTime();
      }
      return false;
    });

    if (!todaySnapshotExists) {
      await addDoc(snapshotCollectionRef, {
        netWorth: processedData.netWorth,
        timestamp: Timestamp.fromDate(today),
        assetAllocation: processedData.assetAllocation,
      });
    }
  }, [db, user, processedData.netWorth, processedData.assetAllocation, appId]);

  // --- RENDER LOGIC ---
  if (isLoading) {
    return <Spinner />;
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} error={error} />;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans">
      <Header user={user} onLogout={handleLogout} />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {error && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded"
            role="alert"
          >
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <DashboardMetrics data={processedData} snapshots={snapshots} />
        <div className="flex justify-between items-center my-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Financial Sources
          </h2>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <PlusCircle size={16} /> Add Source
          </Button>
        </div>
        <SourcesList
          sources={processedData.sourceValues}
          onEdit={handleOpenModal}
          onDelete={handleDeleteSource}
          accounts={accounts}
        />
      </main>
      <SourceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveSource}
        source={editingSource}
        accounts={accounts}
        key={editingSource ? editingSource.id : "new"}
      />
    </div>
  );
}

// --- SUB-COMPONENTS ---

function AuthScreen({ onLogin, error }) {
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
          <Button onClick={onLogin} size="lg" className="gap-2 shadow-lg">
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

function Header({ user, onLogout }) {
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
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              {user.email || "Welcome!"}
            </span>
            <Button onClick={onLogout} variant="ghost" className="gap-2">
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function DashboardMetrics({ data, snapshots }) {
  const { netWorth, assetAllocation } = data;
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#AF19FF",
    "#FF1943",
  ];

  const formattedSnapshots = useMemo(() => {
    return snapshots.map((s) => ({
      date: s.timestamp
        .toDate()
        .toLocaleDateString("pl-PL", { month: "short", day: "numeric" }),
      netWorth: s.netWorth,
    }));
  }, [snapshots]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
    }).format(value || 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Total Net Worth</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(netWorth)}
          </p>
          <div className="flex items-center text-green-600 mt-2">
            {/* Placeholder for change calculation */}
            {/* <TrendingUp size={16} className="mr-1" />
                        <span className="text-sm">+5.2% this month</span> */}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Net Worth Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {formattedSnapshots.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formattedSnapshots}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis
                  dataKey="date"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), "Net Worth"]}
                  contentStyle={{
                    backgroundColor: "rgba(31, 41, 55, 0.8)",
                    border: "none",
                    borderRadius: "0.5rem",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#3b82f6" }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <BarChart2 size={32} />
              <p className="mt-2 text-center text-sm">
                Not enough data for a chart. Update your sources to create more
                snapshots over time.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {assetAllocation.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetAllocation}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius="80%"
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {assetAllocation.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "rgba(31, 41, 55, 0.8)",
                    border: "none",
                    borderRadius: "0.5rem",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <PieChart size={32} />
              <p className="mt-2 text-center text-sm">
                No positive assets to display. Add or update your sources.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SourcesList({ sources, onEdit, onDelete, accounts }) {
  if (sources.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <h3 className="text-xl font-medium text-gray-800 dark:text-gray-100">
            No sources yet!
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Click "Add Source" to start tracking your net worth.
          </p>
        </CardContent>
      </Card>
    );
  }
  const formatCurrency = (value) =>
    new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
    }).format(value || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sources.map((source) => (
        <Card key={source.id}>
          <CardHeader className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                {source.type === "property" ? (
                  <Home size={20} className="text-blue-500" />
                ) : (
                  <DollarSign size={20} className="text-green-500" />
                )}
                {source.name}
              </CardTitle>
              <p className="text-xs text-gray-400 mt-1">
                Last updated:{" "}
                {source.lastUpdated
                  ? source.lastUpdated.toDate().toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => onEdit(source)}
                variant="ghost"
                size="sm"
                className="p-2 h-8 w-8"
              >
                <Edit size={16} />
              </Button>
              <Button
                onClick={() => onDelete(source.id)}
                variant="ghost"
                size="sm"
                className="p-2 h-8 w-8 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {formatCurrency(source.totalValuePLN)}
            </p>
            {/* Here we list individual accounts if not a property */}
            {source.type !== "property" && (
              <div className="mt-4 space-y-2">
                {accounts
                  .filter((a) => a.sourceId === source.id)
                  .map((acc) => (
                    <div
                      key={acc.id}
                      className="flex justify-between items-center text-xs p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md"
                    >
                      <span>{acc.name || `Account`}</span>
                      <span className="font-semibold">
                        {new Intl.NumberFormat("en-US", {
                          style: "decimal",
                        }).format(acc.balance)}{" "}
                        {acc.currency}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SourceModal({ isOpen, onClose, onSave, source, accounts }) {
  const isEditing = !!source;
  const [name, setName] = useState("");
  const [type, setType] = useState("bank");

  // Bank/Investment accounts state
  const [sourceAccounts, setSourceAccounts] = useState([
    { name: "", currency: "PLN", balance: 0 },
  ]);

  // Property state
  const [m2, setM2] = useState(0);
  const [pricePerM2, setPricePerM2] = useState(0);
  const [bankDebt, setBankDebt] = useState(0);
  const [otherDebt, setOtherDebt] = useState(0);

  useEffect(() => {
    if (isEditing) {
      setName(source.name);
      setType(source.type);
      if (source.type === "property") {
        setM2(source.m2 || 0);
        setPricePerM2(source.pricePerM2 || 0);
        setBankDebt(source.bankDebt || 0);
        setOtherDebt(source.otherDebt || 0);
      } else {
        const existingAccounts = accounts.filter(
          (acc) => acc.sourceId === source.id
        );
        setSourceAccounts(
          existingAccounts.length
            ? existingAccounts
            : [{ name: "", currency: "PLN", balance: 0 }]
        );
      }
    } else {
      // Reset form for new source
      setName("");
      setType("bank");
      setSourceAccounts([{ name: "", currency: "PLN", balance: 0 }]);
      setM2(0);
      setPricePerM2(0);
      setBankDebt(0);
      setOtherDebt(0);
    }
  }, [source, isOpen, accounts, isEditing]);

  const handleAccountChange = (index, field, value) => {
    const updatedAccounts = [...sourceAccounts];
    updatedAccounts[index][field] =
      field === "balance" ? parseFloat(value) || 0 : value;
    setSourceAccounts(updatedAccounts);
  };

  const addAccount = () => {
    setSourceAccounts([
      ...sourceAccounts,
      { name: "", currency: "PLN", balance: 0 },
    ]);
  };

  const removeAccount = (index) => {
    const updatedAccounts = sourceAccounts.filter((_, i) => i !== index);
    setSourceAccounts(updatedAccounts);
  };

  const handleSaveClick = () => {
    let payload = {
      id: source ? source.id : null,
      name,
      type,
    };

    if (type === "property") {
      payload = { ...payload, m2, pricePerM2, bankDebt, otherDebt };
    } else {
      payload = { ...payload, accounts: sourceAccounts };
    }

    onSave(payload);
  };

  const title = isEditing ? `Edit ${source.name}` : "Add New Source";

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Source Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., ING Bank, My Apartment"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Source Type
          </label>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={isEditing}
          >
            <option value="bank">Bank / Brokerage</option>
            <option value="property">Property</option>
          </Select>
        </div>

        {type === "property" ? (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100">
              Property Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs">Area (m²)</label>
                <Input
                  type="number"
                  value={m2}
                  onChange={(e) => setM2(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-xs">Price per m² (PLN)</label>
                <Input
                  type="number"
                  value={pricePerM2}
                  onChange={(e) =>
                    setPricePerM2(parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <label className="text-xs">Bank Debt (PLN)</label>
                <Input
                  type="number"
                  value={bankDebt}
                  onChange={(e) => setBankDebt(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-xs">Other Debts (PLN)</label>
                <Input
                  type="number"
                  value={otherDebt}
                  onChange={(e) =>
                    setOtherDebt(parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100">
              Accounts
            </h4>
            {sourceAccounts.map((acc, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-end border-b dark:border-gray-600 pb-2"
              >
                <div className="col-span-4">
                  <label className="text-xs">Account Name</label>
                  <Input
                    value={acc.name}
                    onChange={(e) =>
                      handleAccountChange(index, "name", e.target.value)
                    }
                    placeholder="e.g., Savings"
                  />
                </div>
                <div className="col-span-4">
                  <label className="text-xs">Balance</label>
                  <Input
                    type="number"
                    value={acc.balance}
                    onChange={(e) =>
                      handleAccountChange(index, "balance", e.target.value)
                    }
                    placeholder="10000"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-xs">Currency</label>
                  <Select
                    value={acc.currency}
                    onChange={(e) =>
                      handleAccountChange(index, "currency", e.target.value)
                    }
                  >
                    <option>PLN</option>
                    <option>USD</option>
                    <option>EUR</option>
                  </Select>
                </div>
                <div className="col-span-1">
                  {sourceAccounts.length > 1 && (
                    <Button
                      onClick={() => removeAccount(index)}
                      variant="destructive"
                      size="sm"
                      className="w-8 h-8 p-0"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button onClick={addAccount} variant="outline" size="sm">
              Add another account
            </Button>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-6 border-t dark:border-gray-700 mt-6">
        <Button onClick={onClose} variant="outline">
          Cancel
        </Button>
        <Button onClick={handleSaveClick}>Save Changes</Button>
      </div>
    </Dialog>
  );
}
