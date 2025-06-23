import React, { useState, useEffect } from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Trash2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

export default function SourceModal({ isOpen, onClose, onSave, source, accounts }) {
  const isEditing = !!source;
  const [name, setName] = useState("");
  const [type, setType] = useState("bank");

  // State for financial accounts
  const [sourceAccounts, setSourceAccounts] = useState([]);
  const [sourceDebts, setSourceDebts] = useState([]);

  // State for property details
  const [m2, setM2] = useState(0);
  const [pricePerM2, setPricePerM2] = useState(0);
  const [bankDebt, setBankDebt] = useState(0);
  const [otherDebts, setOtherDebts] = useState([]);

  useEffect(() => {
    if (isEditing && source) {
        setName(source.name);
        setType(source.type);
        if (source.type === 'property') {
            setM2(source.m2 || 0);
            setPricePerM2(source.pricePerM2 || 0);
            setBankDebt(source.bankDebt || 0);
            setOtherDebts(source.otherDebts || [{ name: '', baseAmount: 0, accumulatedInterest: 0, interestRate: 0, lastUpdated: Timestamp.now() }]);
        } else {
            const relatedAccounts = accounts.filter(acc => acc.sourceId === source.id);
            setSourceAccounts(relatedAccounts.filter(acc => acc.type === 'account'));
            setSourceDebts(relatedAccounts.filter(acc => acc.type === 'debt'));
        }
    } else {
        // Reset form for a new source
        setName('');
        setType('bank');
        setSourceAccounts([{ balance: 0, currency: 'PLN', type: 'account' }]);
        setSourceDebts([]);
        setM2(0);
        setPricePerM2(0);
        setBankDebt(0);
        setOtherDebts([]);
    }
  }, [source, isOpen, accounts, isEditing]);
  
  const handleItemChange = (list, setList, index, field, value) => {
    const updatedList = [...list];
    const numberFields = ['balance', 'baseAmount', 'accumulatedInterest', 'interestRate', 'm2', 'pricePerM2', 'bankDebt'];
    updatedList[index][field] = numberFields.includes(field) ? parseFloat(value) || 0 : value;
    setList(updatedList);
  };

  const addItem = (list, setList, newItem) => {
    setList([...list, newItem]);
  };

  const removeItem = (list, setList, index) => {
    const updatedList = list.filter((_, i) => i !== index);
    setList(updatedList);
  };
  
  const handleUpdateInterest = (list, setList, index) => {
    const updatedList = [...list];
    const debt = updatedList[index];
    const lastUpdatedDate = debt.lastUpdated && debt.lastUpdated.toDate ? debt.lastUpdated.toDate() : new Date();
    const now = new Date();
    
    const timeDiff = now.getTime() - lastUpdatedDate.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    if (daysDiff > 0 && debt.interestRate > 0) {
        const dailyRate = debt.interestRate / 100 / 365;
        const interestToAdd = debt.baseAmount * dailyRate * daysDiff;
        debt.accumulatedInterest = (debt.accumulatedInterest || 0) + interestToAdd;
        debt.lastUpdated = Timestamp.now();
    }
    
    setList(updatedList);
  };

  const handleSaveClick = () => {
    let payload = {
      id: source ? source.id : null,
      name,
      type,
    };

    if (type === 'property') {
      payload.m2 = m2;
      payload.pricePerM2 = pricePerM2;
      payload.bankDebt = bankDebt;
      payload.otherDebts = otherDebts;
    } else {
      payload.accounts = sourceAccounts;
      payload.debts = sourceDebts;
    }
    
    onSave(payload);
  };

  const title = isEditing ? `Edit ${source.name}` : "Add New Source";

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-1 pr-4 max-h-[70vh] overflow-y-auto">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Source Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., ING Bank, My Apartment"/>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Source Type</label>
            <Select value={type} onChange={(e) => setType(e.target.value)} disabled={isEditing}>
              <option value="bank">Bank / Brokerage</option>
              <option value="property">Property</option>
            </Select>
          </div>

          {type === 'property' ? (
             <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
               <h4 className="font-semibold text-gray-800 dark:text-gray-100">Property Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="text-xs">Area (m²)</label><Input type="number" value={m2} onChange={(e) => setM2(parseFloat(e.target.value) || 0)}/></div>
                  <div><label className="text-xs">Price per m² (PLN)</label><Input type="number" value={pricePerM2} onChange={(e) => setPricePerM2(parseFloat(e.target.value) || 0)}/></div>
                  <div><label className="text-xs">Bank Debt (PLN)</label><Input type="number" value={bankDebt} onChange={(e) => setBankDebt(parseFloat(e.target.value) || 0)}/></div>
                </div>
                 <h4 className="font-semibold text-gray-800 dark:text-gray-100 mt-4">Other Debts</h4>
                 {otherDebts.map((debt, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end border-b dark:border-gray-600 pb-2">
                        <div className="col-span-3"><label className="text-xs">Debt Name</label><Input value={debt.name} onChange={(e) => handleItemChange(otherDebts, setOtherDebts, index, 'name', e.target.value)} /></div>
                        <div className="col-span-3"><label className="text-xs">Base Amount</label><Input type="number" value={debt.baseAmount} onChange={(e) => handleItemChange(otherDebts, setOtherDebts, index, 'baseAmount', e.target.value)} /></div>
                        <div className="col-span-2"><label className="text-xs">Int. Rate %</label><Input type="number" value={debt.interestRate} onChange={(e) => handleItemChange(otherDebts, setOtherDebts, index, 'interestRate', e.target.value)} /></div>
                        <div className="col-span-2"><label className="text-xs">Accum. Int.</label><Input type="number" value={debt.accumulatedInterest} onChange={(e) => handleItemChange(otherDebts, setOtherDebts, index, 'accumulatedInterest', e.target.value)} /></div>
                        <div className="col-span-2 flex items-center gap-1">
                            <Button onClick={() => handleUpdateInterest(otherDebts, setOtherDebts, index)} variant="outline" size="sm" className="w-8 h-8 p-0">🔄</Button>
                            <Button onClick={() => removeItem(otherDebts, setOtherDebts, index)} variant="destructive" size="sm" className="w-8 h-8 p-0"><Trash2 size={14}/></Button>
                        </div>
                    </div>
                 ))}
                 <Button onClick={() => addItem(otherDebts, setOtherDebts, {name: '', baseAmount: 0, accumulatedInterest: 0, interestRate: 0, lastUpdated: Timestamp.now()})} variant="outline" size="sm">Add Debt</Button>
             </div>
          ) : (
            <>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100">Positive Assets (Accounts)</h4>
                {sourceAccounts.map((acc, index) => (
                  <div key={acc.id || index} className="grid grid-cols-12 gap-2 items-end border-b dark:border-gray-600 pb-2">
                    <div className="col-span-4"><label className="text-xs">Account Name</label><Input value={acc.name || ''} onChange={(e) => handleItemChange(sourceAccounts, setSourceAccounts, index, 'name', e.target.value)} /></div>
                    <div className="col-span-3"><label className="text-xs">Balance</label><Input type="number" value={acc.balance} onChange={(e) => handleItemChange(sourceAccounts, setSourceAccounts, index, 'balance', e.target.value)} /></div>
                    {/* --- START: UPDATED CODE --- */}
                    <div className="col-span-4"><label className="text-xs">Currency</label>
                      <Select value={acc.currency} onChange={(e) => handleItemChange(sourceAccounts, setSourceAccounts, index, 'currency', e.target.value)}>
                        <option>PLN</option><option>USD</option><option>EUR</option>
                      </Select>
                    </div>
                    <div className="col-span-1">
                      <Button onClick={() => removeItem(sourceAccounts, setSourceAccounts, index)} variant="destructive" size="sm" className="w-8 h-8 p-0"><Trash2 size={14}/></Button>
                    </div>
                    {/* --- END: UPDATED CODE --- */}
                  </div>
                ))}
                <Button onClick={() => addItem(sourceAccounts, setSourceAccounts, { balance: 0, currency: 'PLN', type: 'account' })} variant="outline" size="sm">Add Account</Button>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100">Liabilities (Debts)</h4>
                {sourceDebts.map((debt, index) => (
                    <div key={debt.id || index} className="grid grid-cols-12 gap-2 items-end border-b dark:border-gray-600 pb-2">
                        <div className="col-span-3"><label className="text-xs">Debt Name</label><Input value={debt.name} onChange={(e) => handleItemChange(sourceDebts, setSourceDebts, index, 'name', e.target.value)} /></div>
                        <div className="col-span-3"><label className="text-xs">Base Amount</label><Input type="number" value={debt.baseAmount} onChange={(e) => handleItemChange(sourceDebts, setSourceDebts, index, 'baseAmount', e.target.value)} /></div>
                        <div className="col-span-2"><label className="text-xs">Int. Rate %</label><Input type="number" value={debt.interestRate} onChange={(e) => handleItemChange(sourceDebts, setSourceDebts, index, 'interestRate', e.target.value)} /></div>
                        <div className="col-span-2"><label className="text-xs">Accum. Int.</label><Input type="number" value={debt.accumulatedInterest} onChange={(e) => handleItemChange(sourceDebts, setSourceDebts, index, 'accumulatedInterest', e.target.value)} /></div>
                        <div className="col-span-2 flex items-center gap-1">
                            <Button onClick={() => handleUpdateInterest(sourceDebts, setSourceDebts, index)} variant="outline" size="sm" className="w-8 h-8 p-0">🔄</Button>
                            <Button onClick={() => removeItem(sourceDebts, setSourceDebts, index)} variant="destructive" size="sm" className="w-8 h-8 p-0"><Trash2 size={14}/></Button>
                        </div>
                    </div>
                ))}
                <Button onClick={() => addItem(sourceDebts, setSourceDebts, {name: '', baseAmount: 0, accumulatedInterest: 0, interestRate: 0, lastUpdated: Timestamp.now(), type: 'debt'})} variant="outline" size="sm">Add Debt</Button>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2 p-4 border-t dark:border-gray-700">
        <Button onClick={onClose} variant="outline">Cancel</Button>
        <Button onClick={handleSaveClick}>Save Changes</Button>
      </div>
    </Dialog>
  );
}
