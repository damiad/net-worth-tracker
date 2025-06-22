import React, { useState, useEffect } from "react";
import { Dialog } from "./ui/Dialog";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Button } from "./ui/Button";
import { Trash2 } from "lucide-react";

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
  const [sourceAccounts, setSourceAccounts] = useState([
    { name: "", currency: "PLN", balance: 0 },
  ]);
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
    setSourceAccounts(sourceAccounts.filter((_, i) => i !== index));
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

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit ${source.name}` : "Add New Source"}
    >
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
