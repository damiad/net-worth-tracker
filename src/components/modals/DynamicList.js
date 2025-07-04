import React from "react";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { Trash2, TrendingUp, PlusCircle } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { handleUpdateInterest } from "../../utils/interestCalculator";

export default function DynamicList({
  title,
  list,
  setList,
  fieldsConfig,
  isInterestBearing = false,
}) {
  const isTwoRow = !!fieldsConfig.row1;
  const allFields = isTwoRow
    ? [...fieldsConfig.row1, ...fieldsConfig.row2]
    : fieldsConfig;

  const handleListChange = (index, field, value) => {
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

  const addListItem = () => {
    const newItem = allFields.reduce(
      (acc, f) => ({ ...acc, [f.name]: f.defaultValue }),
      { lastUpdated: Timestamp.now() }
    );
    setList([...(list || []), newItem]);
  };

  const removeListItem = (index) => {
    setList(list.filter((_, i) => i !== index));
  };

  const onInterestUpdate = (index) => {
    handleUpdateInterest(list, setList, index); // Using the extracted utility
  };

  const renderFields = (fields, item, index) => {
    return fields.map(
      (field) =>
        field.type !== "hidden" && (
          <div key={field.name} className={field.className}>
            <label className="text-xs">{field.label}</label>
            {field.type === "select" ? (
              <Select
                value={item[field.name] || field.defaultValue}
                onChange={(e) =>
                  handleListChange(index, field.name, e.target.value)
                }
              >
                {field.options.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </Select>
            ) : (
              <Input
                type={field.type}
                value={item[field.name] || ""}
                onChange={(e) =>
                  handleListChange(index, field.name, e.target.value)
                }
                placeholder={field.placeholder}
                step={field.name === "interestRate" ? "0.01" : undefined}
              />
            )}
          </div>
        )
    );
  };

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg space-y-4">
      <h4 className="font-semibold text-gray-800 dark:text-gray-100">
        {title}
      </h4>
      {(list || []).map((item, index) => (
        <div
          key={item.id || index}
          className="border-b dark:border-gray-600 pb-3 last:border-b-0"
        >
          {isTwoRow ? (
            <>
              <div className="grid grid-cols-12 gap-x-2 gap-y-2 items-end">
                {renderFields(fieldsConfig.row1, item, index)}
              </div>
              <div className="grid grid-cols-12 gap-x-2 gap-y-2 items-end mt-2">
                {renderFields(fieldsConfig.row2, item, index)}
                <div className="col-span-12 sm:col-span-3 flex justify-end gap-1 self-end">
                  {isInterestBearing && (
                    <Button
                      onClick={() => onInterestUpdate(index)}
                      variant="default"
                      size="sm"
                      className="w-8 h-8 p-0"
                      title="Calculate & Add Compounded Interest"
                    >
                      <TrendingUp size={14} />
                    </Button>
                  )}
                  <Button
                    onClick={() => removeListItem(index)}
                    variant="destructive"
                    size="sm"
                    className="w-8 h-8 p-0"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-12 gap-x-2 gap-y-1 items-end">
              {renderFields(fieldsConfig, item, index)}
              <div className="col-span-12 sm:col-span-1 flex justify-end">
                <Button
                  onClick={() => removeListItem(index)}
                  variant="destructive"
                  size="sm"
                  className="w-8 h-8 p-0"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
      <Button
        onClick={addListItem}
        variant="outline"
        size="sm"
        className="gap-1"
      >
        <PlusCircle size={14} /> Add
      </Button>
    </div>
  );
}
