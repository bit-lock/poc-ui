export const secondsForUnits = [
  {
    value: 86400,
    unit: "DAYS",
  },
  {
    value: 604800,
    unit: "WEEKS",
  },
  {
    value: 2592000,
    unit: "MONTS",
  },
  {
    value: 31557600,
    unit: "YEARS",
  },
];

export const dateToEpochTimestamp = (date: number) => {
  return Math.floor(date / 1000);
};
