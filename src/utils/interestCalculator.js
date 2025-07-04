import { Timestamp } from "firebase/firestore";

export const handleUpdateInterest = (list, setList, index) => {
  const updatedList = [...list];
  const item = { ...updatedList[index] };

  const now = new Date();
  const lastUpdate = item.lastUpdated?.toDate
    ? item.lastUpdated.toDate()
    : new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfLastUpdateDay = new Date(lastUpdate);
  startOfLastUpdateDay.setHours(0, 0, 0, 0);

  if (startOfToday <= startOfLastUpdateDay) {
    alert("Interest has already been updated today for this item.");
    return;
  }

  const yearlyRate = (item.interestRate || 0) / 100;
  if (yearlyRate <= 0) return;

  let currentPrincipal =
    (item.baseAmount || 0) + (item.accumulatedInterest || 0);
  let currentDate = new Date(startOfLastUpdateDay);
  const isLeapYear = (year) =>
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

  while (currentDate < startOfToday) {
    const currentYear = currentDate.getFullYear();
    const daysInCurrentYear = isLeapYear(currentYear) ? 366 : 365;
    const endOfYear = new Date(currentYear + 1, 0, 1);
    const endOfPeriod = startOfToday < endOfYear ? startOfToday : endOfYear;
    const daysInChunk =
      (endOfPeriod.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysInChunk > 0) {
      const interestForChunk =
        currentPrincipal *
        (Math.pow(1 + yearlyRate, daysInChunk / daysInCurrentYear) - 1);
      currentPrincipal += interestForChunk;
    }
    currentDate = endOfPeriod;
  }

  item.accumulatedInterest = currentPrincipal - (item.baseAmount || 0);
  item.lastUpdated = Timestamp.now();
  updatedList[index] = item;
  setList(updatedList);
};
