import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  query,
  getDocs,
  writeBatch,
  Timestamp,
  where,
} from "firebase/firestore";

import DashboardMetrics from "./DashboardMetrics";
import SourcesList from "./SourcesList";
import SourceModal from "./modals/SourceModal";
import { Button } from "./ui/Button";
import { PlusCircle } from "lucide-react";
import Header from "./Header";
import GoogleTranslateScript from "./GoogleTranslateScript"; // Import the new component

const appId = "net-worth-tracker";

export default function Dashboard({ user, auth }) {
  const [db, setDb] = useState(null);
  const [sources, setSources] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({
    USD: 4.0,
    EUR: 4.3,
    GBP: 5.0,
  });
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [isSnapshotPending, setIsSnapshotPending] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState("PLN");

  // ... (all existing useEffect and other logic remains the same) ...
  useEffect(() => {
    if (auth.app) {
      const firestore = getFirestore(auth.app);
      setDb(firestore);
    }
  }, [auth.app]);

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
      }
    );
    const unsubAccounts = onSnapshot(
      query(collection(db, `${baseCollectionsPath}/accounts`)),
      (snapshot) => {
        setAccounts(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
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
      }
    );

    return () => {
      unsubSources();
      unsubAccounts();
      unsubSnapshots();
    };
  }, [db, user]);

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
        const gbpRate = ratesData.find((r) => r.code === "GBP")?.mid;

        if (usdRate && eurRate && gbpRate) {
          setExchangeRates({ USD: usdRate, EUR: eurRate, GBP: gbpRate });
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

  const processedData = useMemo(() => {
    const plnRates = { ...exchangeRates, PLN: 1 };

    const sourceValues = sources
      .map((source) => {
        let totalValuePLN = 0;
        let lastUpdated = source.lastUpdated || null;

        if (source.type === "property") {
          const priceRate = plnRates[source.pricePerM2Currency || "PLN"] || 1;
          const bankDebtRate = plnRates[source.bankDebtCurrency || "PLN"] || 1;

          const propertyValuePLN =
            (source.m2 || 0) * (source.pricePerM2 || 0) * priceRate;
          const bankDebtPLN = (source.bankDebt || 0) * bankDebtRate;

          const otherDebtsTotalPLN = (source.otherDebts || []).reduce(
            (sum, debt) => {
              const debtRate = plnRates[debt.currency || "PLN"] || 1;
              const debtValue =
                (debt.baseAmount || 0) + (debt.accumulatedInterest || 0);
              return sum + debtValue * debtRate;
            },
            0
          );

          totalValuePLN = propertyValuePLN - bankDebtPLN - otherDebtsTotalPLN;
        } else {
          const relatedAccounts = accounts.filter(
            (acc) => acc.sourceId === source.id
          );

          totalValuePLN = relatedAccounts.reduce((sum, acc) => {
            const rate = plnRates[acc.currency || "PLN"] || 1;
            if (acc.type === "account") {
              return sum + (acc.balance || 0) * rate;
            }
            if (acc.type === "loan") {
              const loanValue =
                (acc.baseAmount || 0) + (acc.accumulatedInterest || 0);
              return sum + loanValue * rate;
            }
            if (acc.type === "debt") {
              const debtValue =
                (acc.baseAmount || 0) + (acc.accumulatedInterest || 0);
              return sum - debtValue * rate;
            }
            return sum;
          }, 0);

          if (relatedAccounts.length > 0) {
            lastUpdated = relatedAccounts.reduce(
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
    const liquidAssets = sourceValues
      .filter((source) => source.type !== "property")
      .reduce((sum, source) => sum + source.totalValuePLN, 0);

    const assetAllocation = (() => {
      if (netWorth <= 0) return [];
      const positiveSources = sourceValues.filter((s) => s.totalValuePLN > 0);
      const threshold = netWorth * 0.02;
      const majorAssets = [];
      let otherAssetsValue = 0;
      positiveSources.forEach((source) => {
        if (source.totalValuePLN < threshold) {
          otherAssetsValue += source.totalValuePLN;
        } else {
          majorAssets.push({ name: source.name, value: source.totalValuePLN });
        }
      });
      if (otherAssetsValue > 0) {
        majorAssets.push({ name: "Other", value: otherAssetsValue });
      }
      return majorAssets;
    })();

    return { sourceValues, netWorth, liquidAssets, assetAllocation, plnRates };
  }, [sources, accounts, exchangeRates]);

  const takeSnapshot = useCallback(async () => {
    if (!db || !user || processedData.netWorth === null) return;
    const userId = user.uid;
    const snapshotCollectionRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/netWorthSnapshots`
    );
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const q = query(
      snapshotCollectionRef,
      where("timestamp", ">=", startOfDay)
    );
    const snapshotsToDelete = await getDocs(q);

    const batch = writeBatch(db);
    snapshotsToDelete.forEach((doc) => batch.delete(doc.ref));

    const newSnapshotRef = doc(snapshotCollectionRef);
    batch.set(newSnapshotRef, {
      netWorth: processedData.netWorth,
      liquidAssets: processedData.liquidAssets,
      timestamp: Timestamp.now(),
      assetAllocation: processedData.assetAllocation,
    });

    await batch.commit();
  }, [db, user, processedData]);

  useEffect(() => {
    if (isSnapshotPending && processedData.netWorth !== null) {
      takeSnapshot();
      setIsSnapshotPending(false);
    }
  }, [isSnapshotPending, processedData, takeSnapshot]);

  const handleOpenModal = (source = null) => {
    setError(null);
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

    try {
      const sourceRef = sourceData.id
        ? doc(db, `${baseDocPath}/sources`, sourceData.id)
        : doc(collection(db, `${baseDocPath}/sources`));

      const sourcePayload = {
        name: sourceData.name,
        type: sourceData.type,
        lastUpdated: Timestamp.now(),
      };

      if (sourceData.type === "property") {
        Object.assign(sourcePayload, {
          m2: sourceData.m2,
          pricePerM2: sourceData.pricePerM2,
          pricePerM2Currency: sourceData.pricePerM2Currency,
          bankDebt: sourceData.bankDebt,
          bankDebtCurrency: sourceData.bankDebtCurrency,
          otherDebts: (sourceData.otherDebts || []).map((debt) => ({
            ...debt,
            lastUpdated: debt.lastUpdated?.toDate
              ? debt.lastUpdated
              : Timestamp.now(),
          })),
        });
      }
      batch.set(sourceRef, sourcePayload, { merge: true });

      if (sourceData.type !== "property") {
        const allSubAccounts = sourceData.accounts || [];

        const existingSubAccounts = accounts.filter(
          (acc) => acc.sourceId === (sourceData.id || sourceRef.id)
        );
        const submittedSubAccountIds = allSubAccounts
          .map((a) => a.id)
          .filter(Boolean);

        existingSubAccounts.forEach((existing) => {
          if (!submittedSubAccountIds.includes(existing.id)) {
            const refToDelete = doc(db, `${baseDocPath}/accounts`, existing.id);
            batch.delete(refToDelete);
          }
        });

        allSubAccounts.forEach((subAcc) => {
          const finalSourceId = sourceData.id || sourceRef.id;
          const accountRef = subAcc.id
            ? doc(db, `${baseDocPath}/accounts`, subAcc.id)
            : doc(collection(db, `${baseDocPath}/accounts`));

          const payload = {
            ...subAcc,
            sourceId: finalSourceId,
            lastUpdated: subAcc.lastUpdated?.toDate
              ? subAcc.lastUpdated
              : Timestamp.now(),
          };
          batch.set(accountRef, payload, { merge: true });
        });
      }

      await batch.commit();
      handleCloseModal();
      setIsSnapshotPending(true);
    } catch (e) {
      console.error("Error saving source:", e);
      const errorMessage =
        e.code === "permission-denied"
          ? "Permission denied. Check Firestore security rules."
          : e.message || "An unknown error occurred.";
      setError(`Failed to save: ${errorMessage}`);
    }
  };

  const handleDeleteSource = async (sourceId) => {
    if (!db || !user) return;
    if (
      !window.confirm(
        "Are you sure? This will delete the source and all its associated accounts. This cannot be undone."
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
      setIsSnapshotPending(true);
    } catch (e) {
      console.error("Error deleting source:", e);
      const errorMessage =
        e.code === "permission-denied"
          ? "Permission denied. Check Firestore security rules."
          : e.message || "An unknown error occurred.";
      setError(`Failed to delete: ${errorMessage}`);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans">
      <GoogleTranslateScript /> {/* Add the hidden script component here */}
      <Header
        user={user}
        auth={auth}
        displayCurrency={displayCurrency}
        setDisplayCurrency={setDisplayCurrency}
      />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {error && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded relative"
            role="alert"
          >
            <p className="font-bold">An Error Occurred</p>
            <p>{error}</p>
            <span
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError(null)}
            >
              <svg
                className="fill-current h-6 w-6 text-red-500"
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </span>
          </div>
        )}
        <DashboardMetrics
          data={processedData}
          snapshots={snapshots}
          displayCurrency={displayCurrency}
        />
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
          displayCurrency={displayCurrency}
          plnRates={processedData.plnRates}
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
