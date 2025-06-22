import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  onSnapshot,
  query,
  getDocs,
  writeBatch,
  Timestamp,
} from "firebase/firestore";

import Header from "./Header";
import DashboardMetrics from "./DashboardMetrics";
import SourcesList from "./SourcesList";
import SourceModal from "./SourceModal";
import { Button } from "./ui/Button";
import { PlusCircle } from "lucide-react";

const appId = "net-worth-tracker";

export default function Dashboard({ user, auth }) {
  const [db, setDb] = useState(null);
  const [sources, setSources] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({ USD: 4.0, EUR: 4.3 });
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState(null);

  // Initialize Firestore instance
  useEffect(() => {
    const firestore = getFirestore(auth.app);
    setDb(firestore);
  }, [auth.app]);

  // Set up data listeners
  useEffect(() => {
    if (!db || !user) {
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
        setSources(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (err) => {
        console.error("Error fetching sources:", err);
        setError("Could not load financial sources. Check Firestore rules.");
      }
    );

    const unsubAccounts = onSnapshot(
      query(collection(db, `${baseCollectionsPath}/accounts`)),
      (snapshot) => {
        setAccounts(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      },
      (err) => {
        console.error("Error fetching accounts:", err);
        setError("Could not load account details. Check Firestore rules.");
      }
    );

    const unsubSnapshots = onSnapshot(
      query(collection(db, `${baseCollectionsPath}/netWorthSnapshots`)),
      (snapshot) => {
        const snapshotData = snapshot.docs
          .map((doc) => ({ ...doc.data(), id: doc.id }))
          .filter((s) => s.timestamp)
          .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
        setSnapshots(snapshotData);
      },
      (err) => {
        console.error("Error fetching snapshots:", err);
        setError("Could not load historical data. Check Firestore rules.");
      }
    );

    return () => {
      unsubSources();
      unsubAccounts();
      unsubSnapshots();
    };
  }, [db, user]);

  // Fetch exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
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
      }
    };
    fetchRates();
  }, []);

  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => b.balance - a.balance);
  }, [accounts]);

  // Process data for display
  const processedData = useMemo(() => {
    const plnRates = { ...exchangeRates, PLN: 1 };

    // Calculate values and then sort the sources list
    const sourceValues = sources
      .map((source) => {
        let totalValuePLN = 0;
        let lastUpdated = source.lastUpdated || null;

        if (source.type === "property") {
          const propertyValue = (source.m2 || 0) * (source.pricePerM2 || 0);
          const totalDebt = (source.bankDebt || 0) + (source.otherDebt || 0);
          totalValuePLN = propertyValue - totalDebt;
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
              lastUpdated
            );
          }
        }
        return { ...source, totalValuePLN, lastUpdated };
      })
      .sort((a, b) => b.totalValuePLN - a.totalValuePLN);

    const netWorth = sourceValues.reduce(
      (sum, source) => sum + source.totalValuePLN,
      0
    );

    // Process data for the asset allocation pie chart, grouping small assets
    const assetAllocation = (() => {
      if (netWorth <= 0) return [];

      const majorAssets = [];
      let otherAssetsValue = 0;

      const positiveSources = sourceValues.filter((s) => s.totalValuePLN > 0);

      // Iterate over sources to separate major assets from minor ones
      positiveSources.forEach((source) => {
        // Check if the asset is less than 2% of the total net worth
        if ((source.totalValuePLN / netWorth) * 100 < 2) {
          otherAssetsValue += source.totalValuePLN;
        } else {
          majorAssets.push({
            name: source.name,
            value: source.totalValuePLN,
          });
        }
      });

      // The 'majorAssets' are already sorted because 'sourceValues' is sorted.
      // If there are assets that were summed up, add an "Other" category.
      // This is pushed at the end to maintain the desired order.
      if (otherAssetsValue > 0) {
        majorAssets.push({ name: "Other", value: otherAssetsValue });
      }

      return majorAssets;
    })();

    return { sourceValues, netWorth, assetAllocation };
  }, [sources, accounts, exchangeRates]);

  // Take a daily snapshot of net worth
  const takeSnapshot = useCallback(async () => {
    if (!db || !user || processedData.netWorth === null) return;

    const userId = user.uid;
    const snapshotCollectionRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/netWorthSnapshots`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
  }, [db, user, processedData]);

  // Modal handlers
  const handleOpenModal = (source = null) => {
    setError(null);
    setEditingSource(source);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingSource(null);
    setIsModalOpen(false);
  };

  // Save source data to Firestore
  const handleSaveSource = async (sourceData) => {
    if (!db || !user) return;
    const userId = user.uid;
    const baseDocPath = `artifacts/${appId}/users/${userId}`;
    const batch = writeBatch(db);
    const timestamp = Timestamp.now();

    try {
      const sourceRef = sourceData.id
        ? doc(db, `${baseDocPath}/sources`, sourceData.id)
        : doc(collection(db, `${baseDocPath}/sources`));

      const sourcePayload = {
        name: sourceData.name,
        type: sourceData.type,
        lastUpdated: timestamp,
      };

      if (sourceData.type === "property") {
        sourcePayload.m2 = sourceData.m2;
        sourcePayload.pricePerM2 = sourceData.pricePerM2;
        sourcePayload.bankDebt = sourceData.bankDebt;
        sourcePayload.otherDebt = sourceData.otherDebt;
      }
      batch.set(sourceRef, sourcePayload, { merge: true });

      if (sourceData.type !== "property" && sourceData.accounts) {
        sourceData.accounts.forEach((acc) => {
          const finalSourceId = sourceRef.id;
          const accountRef = acc.id
            ? doc(db, `${baseDocPath}/accounts`, acc.id)
            : doc(collection(db, `${baseDocPath}/accounts`));
          batch.set(
            accountRef,
            {
              ...acc,
              sourceId: finalSourceId,
              lastUpdated: timestamp,
            },
            { merge: true }
          );
        });
      }

      await batch.commit();
      await takeSnapshot();
      handleCloseModal();
    } catch (e) {
      console.error("Error saving source:", e);
      const errorMessage =
        e.code === "permission-denied"
          ? "Permission denied. Please check your Firestore security rules."
          : e.message || "An unknown error occurred while saving your data.";
      setError(`Failed to save: ${errorMessage}`);
    }
  };

  // Delete source data from Firestore
  const handleDeleteSource = async (sourceId) => {
    if (!db || !user) return;
    // It's generally better to use a custom modal for confirmation
    // instead of window.confirm for better UX and to avoid issues in iframes.
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
      const sourceRef = doc(db, `${baseDocPath}/sources`, sourceId);
      batch.delete(sourceRef);

      const associatedAccounts = accounts.filter(
        (acc) => acc.sourceId === sourceId
      );
      associatedAccounts.forEach((acc) => {
        const accountRef = doc(db, `${baseDocPath}/accounts`, acc.id);
        batch.delete(accountRef);
      });

      await batch.commit();
      await takeSnapshot();
    } catch (e) {
      console.error("Error deleting source:", e);
      const errorMessage =
        e.code === "permission-denied"
          ? "Permission denied. Please check your Firestore security rules."
          : e.message || "An unknown error occurred while deleting the source.";
      setError(`Failed to delete: ${errorMessage}`);
    }
  };

  // Main component render
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans">
      <Header user={user} auth={auth} />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {error && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded"
            role="alert"
            onClick={() => setError(null)}
          >
            <p className="font-bold">An Error Occurred</p>
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
          accounts={sortedAccounts}
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
