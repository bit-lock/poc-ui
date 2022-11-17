import { Signatories } from "./models/Signatories";
import { Vault } from "./models/Vault";

export const calculateSignCount = (vault: Vault, signatories: Signatories) => {
  const threshold = Number(vault.threshold);
  const signatoryThresholds = signatories[1].map((data) => Number(data));

  const orderedSignatoryThresholds = signatoryThresholds.sort((a, b) => a - b);

  let currentThresholdCount = 0;
  let calculatedThreshold = 0;
  let i = 0;

  while (i < signatoryThresholds.length) {
    calculatedThreshold += orderedSignatoryThresholds[i];

    if (calculatedThreshold >= threshold) {
      currentThresholdCount = i + 1;
      break;
    } else {
      i++;
    }
  }

  return currentThresholdCount;
};
