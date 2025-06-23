import React, { useState, useEffect } from "react";
import { Dialog } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Trash2, RefreshCw } from "lucide-react";
import { Timestamp } from "firebase/firestore";

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
    { id: `new_${Date.now()}`, name: "", currency: "PLN", balance: 0 },
  ]);

  const [m2, setM2] = useState(0);
  const [pricePerM2, setPricePerM2] = useState(0);
  const [bankDebt, setBankDebt] = useState(0);
  const [otherDebts, setOtherDebts] = useState([
    {
      id: `new_${Date.now()}`,
      name: "",
      baseAmount: 0,
      accumulatedInterest: 0,
      rate: 0,
      lastInterestUpdate: null,
    },
  ]);

  useEffect(() => {
    if (isEditing) {
      setName(source.name);
      setType(source.type);
      if (source.type === "property") {
        setM2(source.m2 || 0);
        setPricePerM2(source.pricePerM2 || 0);
        setBankDebt(source.bankDebt || 0);
        setOtherDebts(
          source.otherDebts && source.otherDebts.length > 0
            ? source.otherDebts
            : [
                {
                  id: `new_${Date.now()}`,
                  name: "",
                  baseAmount: 0,
                  accumulatedInterest: 0,
                  rate: 0,
                  lastInterestUpdate: null,
                },
              ]
        );
      } else {
        const existingAccounts = accounts.filter(
          (acc) => acc.sourceId === source.id
        );
        setSourceAccounts(
          existingAccounts.length
            ? existingAccounts
            : [
                {
                  id: `new_${Date.now()}`,
                  name: "",
                  currency: "PLN",
                  balance: 0,
                },
              ]
        );
      }
    } else {
      setName("");
      setType("bank");
      setSourceAccounts([
        { id: `new_${Date.now()}`, name: "", currency: "PLN", balance: 0 },
      ]);
      setM2(0);
      setPricePerM2(0);
      setBankDebt(0);
      setOtherDebts([
        {
          id: `new_${Date.now()}`,
          name: "",
          baseAmount: 0,
          accumulatedInterest: 0,
          rate: 0,
          lastInterestUpdate: null,
        },
      ]);
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
      { id: `new_${Date.now()}`, name: "", currency: "PLN", balance: 0 },
    ]);
  };

  const removeAccount = (id) => {
    setSourceAccounts(sourceAccounts.filter((acc) => acc.id !== id));
  };

  const handleDebtChange = (index, field, value) => {
    const updatedDebts = [...otherDebts];
    const numValue = parseFloat(value) || 0;
    updatedDebts[index][field] =
      field === "baseAmount" ||
      field === "accumulatedInterest" ||
      field === "rate"
        ? numValue
        : value;
    setOtherDebts(updatedDebts);
  };

  const handleInterestUpdate = (index) => {
    const updatedDebts = [...otherDebts];
    const debt = updatedDebts[index];

    if (
      !debt.rate ||
      debt.rate <= 0 ||
      !debt.baseAmount ||
      debt.baseAmount <= 0
    )
      return;

    const lastUpdate = debt.lastInterestUpdate?.toDate() || new Date();
    const now = new Date();
    const daysPassed =
      (now.getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24);
    const dailyRate = debt.rate / 100 / 365;

    const newInterest = debt.baseAmount * dailyRate * daysPassed;
    const totalAccumulated = (debt.accumulatedInterest || 0) + newInterest;

    updatedDebts[index].accumulatedInterest = parseFloat(
      totalAccumulated.toFixed(2)
    );
    setOtherDebts(updatedDebts);
  };

  const addDebt = () => {
    setOtherDebts([
      ...otherDebts,
      {
        id: `new_${Date.now()}`,
        name: "",
        baseAmount: 0,
        accumulatedInterest: 0,
        rate: 0,
        lastInterestUpdate: null,
      },
    ]);
  };

  const removeDebt = (id) => {
    setOtherDebts(otherDebts.filter((debt) => debt.id !== id));
  };

  const handleSaveClick = () => {
    let payload = { id: source ? source.id : null, name, type };

    if (type === "property") {
      const finalDebts = otherDebts
        .map((debt) => {
          return {
            ...debt,
            lastInterestUpdate: debt.lastInterestUpdate || Timestamp.now(),
          };
        })
        .filter((d) => d.baseAmount > 0);

      payload = {
        ...payload,
        m2,
        pricePerM2,
        bankDebt,
        otherDebts: finalDebts,
      };
    } else {
      payload = { ...payload, accounts: sourceAccounts };
    }

    onSave(payload);
  };

  const title = isEditing ? `Edit ${source.name}` : "Add New Source";

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title}>
      {/* THIS WRAPPER IS NOW SCROLLABLE */}
      <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {" "}
            Source Name{" "}
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., ING Bank, My Apartment"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {" "}
            Source Type{" "}
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
              {" "}
              Property Details{" "}
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
            </div>

            <h4 className="font-semibold text-gray-800 dark:text-gray-100 pt-4 border-t dark:border-gray-600">
              {" "}
              Other Debts{" "}
            </h4>
            <div className="space-y-3">
              {otherDebts.map((debt, index) => (
                <div
                  key={debt.id}
                  className="p-3 bg-white dark:bg-gray-800 rounded-md border dark:border-gray-600 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <Input
                      className="text-sm font-semibold !border-0 !p-0"
                      value={debt.name}
                      onChange={(e) =>
                        handleDebtChange(index, "name", e.target.value)
                      }
                      placeholder="Debt Name (e.g., From Parents)"
                    />
                    <Button
                      onClick={() => removeDebt(debt.id)}
                      variant="ghost"
                      size="sm"
                      className="w-7 h-7 p-0 text-red-500"
                    >
                      {" "}
                      <Trash2 size={14} />{" "}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
                    <div className="md:col-span-1">
                      {" "}
                      <label className="text-xs">Base Loan</label>{" "}
                      <Input
                        type="number"
                        value={debt.baseAmount}
                        onChange={(e) =>
                          handleDebtChange(index, "baseAmount", e.target.value)
                        }
                      />{" "}
                    </div>
                    <div className="md:col-span-1">
                      {" "}
                      <label className="text-xs">Interest Rate (%)</label>{" "}
                      <Input
                        type="number"
                        value={debt.rate}
                        onChange={(e) =>
                          handleDebtChange(index, "rate", e.target.value)
                        }
                      />{" "}
                    </div>
                    <div className="md:col-span-1">
                      {" "}
                      <label className="text-xs">Accum. Interest</label>{" "}
                      <Input
                        type="number"
                        value={debt.accumulatedInterest}
                        onChange={(e) =>
                          handleDebtChange(
                            index,
                            "accumulatedInterest",
                            e.target.value
                          )
                        }
                      />{" "}
                    </div>
                    <div className="md:col-span-1">
                      {" "}
                      <Button
                        onClick={() => handleInterestUpdate(index)}
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5"
                      >
                        <RefreshCw size={12} /> Update
                      </Button>{" "}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={addDebt} variant="outline" size="sm">
              {" "}
              Add Debt{" "}
            </Button>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100">
              {" "}
              Accounts{" "}
            </h4>
            {sourceAccounts.map((acc, index) => (
              <div
                key={acc.id}
                className="grid grid-cols-12 gap-2 items-end border-b dark:border-gray-600 pb-2"
              >
                <div className="col-span-4">
                  {" "}
                  <label className="text-xs">Account Name</label>{" "}
                  <Input
                    value={acc.name}
                    onChange={(e) =>
                      handleAccountChange(index, "name", e.target.value)
                    }
                    placeholder="e.g., Savings"
                  />{" "}
                </div>
                <div className="col-span-4">
                  {" "}
                  <label className="text-xs">Balance</label>{" "}
                  <Input
                    type="number"
                    value={acc.balance}
                    onChange={(e) =>
                      handleAccountChange(index, "balance", e.target.value)
                    }
                    placeholder="10000"
                  />{" "}
                </div>
                <div className="col-span-3">
                  {" "}
                  <label className="text-xs">Currency</label>{" "}
                  <Select
                    value={acc.currency}
                    onChange={(e) =>
                      handleAccountChange(index, "currency", e.target.value)
                    }
                  >
                    {" "}
                    <option>PLN</option> <option>USD</option>{" "}
                    <option>EUR</option>{" "}
                  </Select>{" "}
                </div>
                <div className="col-span-1">
                  {sourceAccounts.length > 1 && (
                    <Button
                      onClick={() => removeAccount(acc.id)}
                      variant="destructive"
                      size="sm"
                      className="w-8 h-8 p-0"
                    >
                      {" "}
                      <Trash2 size={14} />{" "}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button onClick={addAccount} variant="outline" size="sm">
              {" "}
              Add another account{" "}
            </Button>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-6 border-t dark:border-gray-700 mt-6">
        <Button onClick={onClose} variant="outline">
          {" "}
          Cancel{" "}
        </Button>
        <Button onClick={handleSaveClick}>Save Changes</Button>
      </div>
    </Dialog>
  );
}
