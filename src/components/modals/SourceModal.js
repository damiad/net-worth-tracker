import React, { useState, useEffect } from "react";
import { Dialog } from "../ui/Dialog";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { Timestamp } from "firebase/firestore";
import PropertyFields from "./PropertyFields";
import FinancialSourceFields from "./FinancialSourceFields";

export default function SourceModal({
  isOpen,
  onClose,
  onSave,
  source,
  accounts,
}) {
  const isEditing = !!source;

  const [name, setName] = useState("");
  const [type, setType] = useState("bank");

  // State for different source types will be managed in child components
  const [propertyData, setPropertyData] = useState({});
  const [financialData, setFinancialData] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (isEditing && source) {
        setName(source.name);
        setType(source.type);
        if (source.type === "property") {
          setPropertyData({
            m2: source.m2 || 0,
            pricePerM2: source.pricePerM2 || 0,
            pricePerM2Currency: source.pricePerM2Currency || "PLN",
            bankDebt: source.bankDebt || 0,
            bankDebtCurrency: source.bankDebtCurrency || "PLN",
            otherDebts: source.otherDebts || [],
          });
          setFinancialData({}); // Clear other data
        } else {
          const associatedAccounts = accounts.filter(
            (acc) => acc.sourceId === source.id
          );
          setFinancialData({
            positiveAccounts: associatedAccounts.filter(
              (acc) => acc.type === "account"
            ),
            loans: associatedAccounts.filter((acc) => acc.type === "loan"),
            debts: associatedAccounts.filter((acc) => acc.type === "debt"),
          });
          setPropertyData({}); // Clear other data
        }
      } else {
        // Reset for new source
        setName("");
        setType("bank");
        setPropertyData({});
        setFinancialData({ positiveAccounts: [], loans: [], debts: [] });
      }
    }
  }, [source, isOpen, isEditing, accounts]);

  const handleSaveClick = () => {
    let payload = {
      id: source ? source.id : null,
      name,
      type,
      lastUpdated: Timestamp.now(),
    };

    if (type === "property") {
      payload = { ...payload, ...propertyData };
    } else {
      const { positiveAccounts, loans, debts } = financialData;
      const allAccounts = [...positiveAccounts, ...loans, ...debts];
      payload = { ...payload, accounts: allAccounts };
    }
    onSave(payload);
  };

  const title = isEditing ? `Edit ${source.name}` : "Add New Source";

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title}>
      <div className="max-h-[75vh] overflow-y-auto pr-2">
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
            <PropertyFields data={propertyData} setData={setPropertyData} />
          ) : (
            <FinancialSourceFields
              data={financialData}
              setData={setFinancialData}
            />
          )}
        </div>
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
