import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader } from "rsuite";
import toastr from "toastr";
import { ROUTE_PATH } from "../routes/ROUTE_PATH";
import { Web3Lib } from "../lib/Web3Lib";
import { SignatoryState } from "../lib/models/SignatoryState";
import { dateToEpochTimestamp, secondsForUnits } from "../helper";
import { DegradingPeriod } from "../lib/models/DegradingPeriod";
import { VaultForm } from "../components/VaultForm";
import { TimelockThreshold } from "../lib/models/TimelockThreshold";
import { DATE_UNIT } from "../lib/enum/DATE_UNIT";

type Props = {
  account: string;
};

export const CreateNewVault: React.FC<Props> = ({ account }) => {
  // main states for component
  const [vaultName, setVaultName] = useState<string>("");
  const [signatories, setSignatories] = useState<SignatoryState[]>([{ index: 0, address: account, percent: 100 }]);
  const [threshold, setThreshold] = useState<number>(25);
  const [degradingPeriods, setDegradingPeriods] = useState<DegradingPeriod[]>([]);
  const [selectedValues, setSelectedValues] = useState<{ index: number; value: number }>();
  const [authorizedAddresses, setAuthorizedAddresses] = useState<string[]>([]);

  // page loading state
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const addButtonClick = () => {
    const newSignatory = [...signatories];
    const previousState = newSignatory.map((s: SignatoryState) => {
      return { ...s, percent: (s.percent * (100 - threshold)) / 100 };
    });

    previousState.push({ index: signatories.length + 1, address: "", percent: threshold });

    setSignatories(previousState);
  };

  const removeButtonClick = (willRemoveIndex: number, percent: number) => {
    const clonedSignatories = [...signatories];

    const previousState = clonedSignatories.map((s) => {
      return { ...s, percent: (s.percent * 100) / (100 - percent) };
    });

    previousState.splice(willRemoveIndex, 1);
    setSignatories(previousState);
  };

  const addDegradingButtonClick = () => {
    const newDegradingPeriod = [...degradingPeriods];

    if (newDegradingPeriod.length === 0) {
      newDegradingPeriod.push({ date: { value: 10, unit: secondsForUnits[0].unit }, shared: threshold });
    } else {
      newDegradingPeriod.push({ date: { value: 10, unit: secondsForUnits[0].unit }, shared: newDegradingPeriod[newDegradingPeriod.length - 1].shared });
    }

    setDegradingPeriods(newDegradingPeriod);
  };

  const changeDegradingPeriod = (index: number, value: string) => {
    const clonedDegradingPeriods = [...degradingPeriods];

    const degradingPeriod = clonedDegradingPeriods[index];
    degradingPeriod.date.unit = value;

    setDegradingPeriods(clonedDegradingPeriods);
  };

  const changeDegradingPeriodValue = (index: number, value: number) => {
    const clonedDegradingPeriods = [...degradingPeriods];

    const degradingPeriod = clonedDegradingPeriods[index];
    degradingPeriod.date.value = value;

    setDegradingPeriods(clonedDegradingPeriods);
  };

  const changeDegradingPeriodShared = (index: number, value: number) => {
    const clonedDegradingPeriods = [...degradingPeriods];

    const currentData = clonedDegradingPeriods[index];

    if (index === 0 && value > threshold) {
      currentData.shared = threshold;
    } else if (index === 1 && value > clonedDegradingPeriods[0].shared) {
      currentData.shared = clonedDegradingPeriods[0].shared;
    } else if (index === 2 && value > clonedDegradingPeriods[1].shared) {
      currentData.shared = clonedDegradingPeriods[1].shared;
    } else {
      currentData.shared = value;
    }

    setDegradingPeriods(clonedDegradingPeriods);
  };

  const editButtonClick = (index: number, value: number) => {
    setSelectedValues({ index, value });
  };

  const onChangeSharedInput = (index: number, inputValue: string) => {
    const value = Number(inputValue);

    if (value > 99.99) {
      setSelectedValues({ index: index, value: 99.99 });
    } else if (value < 0) setSelectedValues({ index: index, value: 0.01 });
    else setSelectedValues({ index, value });
  };

  const saveInputValue = (index: number, currentValue: number) => {
    const clonedSignatories = [...signatories];

    const previousState = clonedSignatories.map((s, i: number) => {
      if (i === index) {
        return { ...s, percent: selectedValues?.value || 0 };
      } else {
        return { ...s, percent: Number((s.percent * ((currentValue - (selectedValues?.value || 0)) / (100 - currentValue)) + s.percent).toFixed(2)) };
      }
    });

    setSignatories(previousState);
    setSelectedValues(undefined);
  };

  const addAuthorizedAddressButtonClick = () => {
    const clonedAuthorizedAddressList = [...authorizedAddresses];
    clonedAuthorizedAddressList.push("");
    setAuthorizedAddresses(clonedAuthorizedAddressList);
  };

  const removeAuthorizedAddessButtonOnClick = (willRemovedIndex: number) => {
    const clonedAuthorizedAddressList = [...authorizedAddresses];
    clonedAuthorizedAddressList.splice(willRemovedIndex, 1);
    setAuthorizedAddresses(clonedAuthorizedAddressList);
  };

  const initializeVaultClick = async () => {
    setLoading(true);

    if (!authorizedAddresses.every((e, i, a) => a.indexOf(e) === i)) {
      toastr.error("Authorized Addresses must be unique.");
      setLoading(false);
      return;
    }

    const web3Instance = new Web3Lib();
    const signatoriesAddress = signatories.map((signatory: SignatoryState) => signatory.address);
    const signatoriesShares = signatories.map((signatory: SignatoryState) => Math.floor(signatory.percent * 100));

    const editedThreshold = threshold * 100;

    const date = new Date();

    const editedPeriods: TimelockThreshold[] = degradingPeriods.map((dp) => {
      let timelock = 0;

      switch (dp.date.unit) {
        case DATE_UNIT.DAYS:
          timelock = dateToEpochTimestamp(date.setDate(date.getDate() + dp.date.value));
          break;

        case DATE_UNIT.WEEKS:
          timelock = dateToEpochTimestamp(date.setDate(date.getDate() + dp.date.value * 7));
          break;

        case DATE_UNIT.MONTS:
          timelock = dateToEpochTimestamp(date.setMonth(date.getMonth() + dp.date.value));
          break;

        case DATE_UNIT.YEARS:
          timelock = dateToEpochTimestamp(date.setFullYear(date.getFullYear() + dp.date.value));
          break;

        default:
          break;
      }

      // Math.floor is temp for decimal bugs.
      return {
        timelock: timelock,
        threshold: dp.shared * 100,
      };
    });

    try {
      await web3Instance.initialVault(account, vaultName, editedThreshold, signatoriesAddress, signatoriesShares, authorizedAddresses, editedPeriods);
      navigate(ROUTE_PATH.VAULTS);
    } catch (err: any) {
      toastr.error(err.message);
    }

    setLoading(false);
  };

  if (loading) {
    return <Loader backdrop content="Initializing vault..." vertical />;
  }

  return (
    <VaultForm
      vaultName={vaultName}
      signatories={signatories}
      threshold={threshold}
      degradingPeriods={degradingPeriods}
      authorizedAddresses={authorizedAddresses}
      selectedValues={selectedValues}
      addNewSignatoryOnClick={addButtonClick}
      formOnClick={initializeVaultClick}
      addDegradingButtonClick={addDegradingButtonClick}
      addAuthorizedAddressButtonClick={addAuthorizedAddressButtonClick}
      removeButtonOnClick={removeButtonClick}
      vaultNameChangeCallback={setVaultName}
      signatoriesChangeCallback={setSignatories}
      thresholdChangeCallback={setThreshold}
      degradingPeriodsChangeCallback={changeDegradingPeriod}
      degradingPeriodValueChangeCallback={changeDegradingPeriodValue}
      degradingPeriodSharedChangeCallback={changeDegradingPeriodShared}
      authorizedAddressesChangeCallback={setAuthorizedAddresses}
      removeAuthorizedAddessButtonOnClick={removeAuthorizedAddessButtonOnClick}
      onChangeSharedInputCallback={onChangeSharedInput}
      selectedValuesChangeCallback={setSelectedValues}
      editButtonClick={editButtonClick}
      saveInputValue={saveInputValue}
    />
  );
};
