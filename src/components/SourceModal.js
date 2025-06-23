import React, { useState, useEffect } from "react";
import { Dialog } from "./ui/Dialog";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Button } from "./ui/Button";
import { Trash2, TrendingUp, PlusCircle } from "lucide-react";
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

  // Property State
  const [m2, setM2] = useState(0);
  const [pricePerM2, setPricePerM2] = useState(0);
  const [bankDebt, setBankDebt] = useState(0);
  const [otherDebts, setOtherDebts] = useState([]);
  // --- CHANGE: Added granular currency state for properties ---
  const [pricePerM2Currency, setPricePerM2Currency] = useState("PLN");
  const [bankDebtCurrency, setBankDebtCurrency] = useState("PLN");

  // Financial Account State
  const [positiveAccounts, setPositiveAccounts] = useState([]);
  const [loans, setLoans] = useState([]);
  const [debts, setDebts] = useState([]);

  useEffect(() => {
    if (isEditing && source) {
      setName(source.name);
      setType(source.type);
      if (source.type === "property") {
        setM2(source.m2 || 0);
        setPricePerM2(source.pricePerM2 || 0);
        setBankDebt(source.bankDebt || 0);
        setOtherDebts(source.otherDebts || []);
        // --- CHANGE: Set granular property currencies when editing ---
        setPricePerM2Currency(source.pricePerM2Currency || "PLN");
        setBankDebtCurrency(source.bankDebtCurrency || "PLN");
      } else {
        const associatedAccounts = accounts.filter(
          (acc) => acc.sourceId === source.id
        );
        setPositiveAccounts(
          associatedAccounts.filter((acc) => acc.type === "account")
        );
        setLoans(associatedAccounts.filter((acc) => acc.type === "loan"));
        setDebts(associatedAccounts.filter((acc) => acc.type === "debt"));
      }
    } else {
      setName("");
      setType("bank");
      setM2(0);
      setPricePerM2(0);
      setBankDebt(0);
      setOtherDebts([]);
      setPositiveAccounts([]);
      setLoans([]);
      setDebts([]);
      setPricePerM2Currency("PLN");
      setBankDebtCurrency("PLN");
    }
  }, [source, isOpen, isEditing, accounts]);

  const handleListChange = (list, setList, index, field, value) => {
    const updatedList = [...list];
    const item = { ...updatedList[index] };

    if (
      ["baseAmount", "accumulatedInterest", "interestRate", "balance"].includes(
        field
      )
    ) {
      item[field] = parseFloat(value) || 0;
    } else {
      item[field] = value;
    }

    item.lastUpdated = Timestamp.now();
    updatedList[index] = item;
    setList(updatedList);
  };

  const addListItem = (setList, newItem) => {
    setList((prev) => [...(prev || []), newItem]);
  };

  const removeListItem = (list, setList, index) => {
    setList(list.filter((_, i) => i !== index));
  };

  const handleUpdateInterest = (list, setList, index) => {
    const updatedList = [...list];
    const item = { ...updatedList[index] };
    const lastUpdateDate = item.lastUpdated?.toDate
      ? item.lastUpdated.toDate()
      : new Date();
    const now = new Date();

    const daysDiff =
      (now.getTime() - lastUpdateDate.getTime()) / (1000 * 3600 * 24);
    const yearlyRate = (item.interestRate || 0) / 100;
    const interest = (item.baseAmount || 0) * yearlyRate * (daysDiff / 365);

    item.accumulatedInterest = (item.accumulatedInterest || 0) + interest;
    item.lastUpdated = Timestamp.now();

    updatedList[index] = item;
    setList(updatedList);
  };

  const handleSaveClick = () => {
    let payload = {
      id: source ? source.id : null,
      name,
      type,
    };

    if (type === "property") {
      payload = {
        ...payload,
        m2,
        pricePerM2,
        bankDebt,
        otherDebts,
        // --- CHANGE: Pass granular property currencies on save ---
        pricePerM2Currency,
        bankDebtCurrency,
      };
    } else {
      payload = {
        ...payload,
        accounts: positiveAccounts,
        loans,
        debts,
      };
    }
    onSave(payload);
  };

  const title = isEditing ? `Edit ${source.name}` : "Add New Source";

  const renderDynamicList = (
    title,
    list,
    setList,
    fields,
    isInterestBearing = false
  ) => (
    <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg space-y-4">
      <h4 className="font-semibold text-gray-800 dark:text-gray-100">
        {title}
      </h4>
      {(list || []).map((item, index) => (
        <div
          key={item.id || index}
          className="grid grid-cols-12 gap-x-2 gap-y-1 items-end border-b dark:border-gray-600 pb-2"
        >
          {fields.map((field) => (
            <div key={field.name} className={field.className}>
              <label className="text-xs">{field.label}</label>
              {field.type === "select" ? (
                <Select
                  value={item[field.name]}
                  onChange={(e) =>
                    handleListChange(
                      list,
                      setList,
                      index,
                      field.name,
                      e.target.value
                    )
                  }
                >
                  {field.options.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </Select>
              ) : (
                <Input
                  type={field.type}
                  value={item[field.name]}
                  onChange={(e) =>
                    handleListChange(
                      list,
                      setList,
                      index,
                      field.name,
                      e.target.value
                    )
                  }
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}
          <div className="col-span-12 sm:col-span-1 flex justify-end gap-1">
            {isInterestBearing && (
              <Button
                onClick={() => handleUpdateInterest(list, setList, index)}
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0"
              >
                <TrendingUp size={14} />
              </Button>
            )}
            <Button
              onClick={() => removeListItem(list, setList, index)}
              variant="destructive"
              size="sm"
              className="w-8 h-8 p-0"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      ))}
      <Button
        onClick={() =>
          addListItem(
            setList,
            fields.reduce(
              (acc, f) => ({ ...acc, [f.name]: f.defaultValue }),
              {}
            )
          )
        }
        variant="outline"
        size="sm"
        className="gap-1"
      >
        <PlusCircle size={14} /> Add
      </Button>
    </div>
  );

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
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg space-y-4">
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
                    <label className="text-xs">Price per m²</label>
                    <Input
                      type="number"
                      value={pricePerM2}
                      onChange={(e) =>
                        setPricePerM2(parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  {/* --- CHANGE: Added currency selector for price --- */}
                  <div>
                    <label className="text-xs">Price Currency</label>
                    <Select
                      value={pricePerM2Currency}
                      onChange={(e) => setPricePerM2Currency(e.target.value)}
                    >
                      <option>PLN</option>
                      <option>USD</option>
                      <option>EUR</option>
                      <option>GBP</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs">Bank Debt</label>
                    <Input
                      type="number"
                      value={bankDebt}
                      onChange={(e) =>
                        setBankDebt(parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  {/* --- CHANGE: Added currency selector for bank debt --- */}
                  <div>
                    <label className="text-xs">Bank Debt Currency</label>
                    <Select
                      value={bankDebtCurrency}
                      onChange={(e) => setBankDebtCurrency(e.target.value)}
                    >
                      <option>PLN</option>
                      <option>USD</option>
                      <option>EUR</option>
                      <option>GBP</option>
                    </Select>
                  </div>
                </div>
              </div>
              {/* --- CHANGE: Added currency selector for other debts --- */}
              {renderDynamicList(
                "Other Debts",
                otherDebts,
                setOtherDebts,
                [
                  {
                    name: "name",
                    label: "Name",
                    type: "text",
                    defaultValue: "Unnamed Debt",
                    className: "col-span-12 sm:col-span-3",
                  },
                  {
                    name: "baseAmount",
                    label: "Base Amt",
                    type: "number",
                    defaultValue: 0,
                    className: "col-span-6 sm:col-span-2",
                  },
                  {
                    name: "accumulatedInterest",
                    label: "Acc. Int",
                    type: "number",
                    defaultValue: 0,
                    className: "col-span-6 sm:col-span-2",
                  },
                  {
                    name: "interestRate",
                    label: "Rate %",
                    type: "number",
                    defaultValue: 0,
                    className: "col-span-6 sm:col-span-2",
                  },
                  {
                    name: "currency",
                    label: "Curr",
                    type: "select",
                    defaultValue: "PLN",
                    options: ["PLN", "USD", "EUR", "GBP"],
                    className: "col-span-6 sm:col-span-2",
                  },
                ],
                true
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {renderDynamicList(
                "Positive Accounts",
                positiveAccounts,
                setPositiveAccounts,
                [
                  {
                    name: "name",
                    label: "Account Name",
                    type: "text",
                    defaultValue: "New Account",
                    className: "col-span-12 sm:col-span-4",
                  },
                  {
                    name: "balance",
                    label: "Balance",
                    type: "number",
                    defaultValue: 0,
                    className: "col-span-6 sm:col-span-4",
                  },
                  {
                    name: "currency",
                    label: "Currency",
                    type: "select",
                    defaultValue: "PLN",
                    options: ["PLN", "USD", "EUR", "GBP"],
                    className: "col-span-6 sm:col-span-3",
                  },
                  { name: "type", type: "hidden", defaultValue: "account" },
                ]
              )}
              {renderDynamicList(
                "Associated Loans (Money you loaned out)",
                loans,
                setLoans,
                [
                  {
                    name: "name",
                    label: "Name",
                    type: "text",
                    defaultValue: "Unnamed Loan",
                    className: "col-span-12 sm:col-span-3",
                  },
                  {
                    name: "baseAmount",
                    label: "Base Amt",
                    type: "number",
                    defaultValue: 0,
                    className: "col-span-6 sm:col-span-2",
                  },
                  {
                    name: "accumulatedInterest",
                    label: "Acc. Int",
                    type: "number",
                    defaultValue: 0,
                    className: "col-span-6 sm:col-span-2",
                  },
                  {
                    name: "interestRate",
                    label: "Rate %",
                    type: "number",
                    defaultValue: 0,
                    className: "col-span-6 sm:col-span-2",
                  },
                  {
                    name: "currency",
                    label: "Curr",
                    type: "select",
                    defaultValue: "PLN",
                    options: ["PLN", "USD", "EUR", "GBP"],
                    className: "col-span-6 sm:col-span-2",
                  },
                  { name: "type", type: "hidden", defaultValue: "loan" },
                ],
                true
              )}
              {renderDynamicList(
                "Associated Debts",
                debts,
                setDebts,
                [
                  {
                    name: "name",
                    label: "Name",
                    type: "text",
                    defaultValue: "Unnamed Debt",
                    className: "col-span-12 sm:col-span-3",
                  },
                  {
                    name: "baseAmount",
                    label: "Base Amt",
                    type: "number",
                    defaultValue: 0,
                    className: "col-span-6 sm:col-span-2",
                  },
                  {
                    name: "accumulatedInterest",
                    label: "Acc. Int",
                    type: "number",
                    defaultValue: 0,
                    className: "col-span-6 sm:col-span-2",
                  },
                  {
                    name: "interestRate",
                    label: "Rate %",
                    type: "number",
                    defaultValue: 0,
                    className: "col-span-6 sm:col-span-2",
                  },
                  {
                    name: "currency",
                    label: "Curr",
                    type: "select",
                    defaultValue: "PLN",
                    options: ["PLN", "USD", "EUR", "GBP"],
                    className: "col-span-6 sm:col-span-2",
                  },
                  { name: "type", type: "hidden", defaultValue: "debt" },
                ],
                true
              )}
            </div>
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
