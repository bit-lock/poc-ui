import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader } from "rsuite";
import { ROUTE_PATH } from "../routes/ROUTE_PATH";
import { Web3Lib } from "../lib/Web3Lib";
import { SignatoryState } from "../lib/models/SignatoryState";
import { secondsForUnits } from "../helper";
import { DegradingPeriod } from "../lib/models/DegradingPeriod";
import { VaultForm } from "../components/VaultForm";

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
    currentData.shared = value;

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

  const initializeVaultClick = async () => {
    setLoading(true);
    const web3Instance = new Web3Lib();
    const signatoriesAddress = signatories.map((signatory: SignatoryState) => signatory.address);
    const signatoriesShares = signatories.map((signatory: SignatoryState) => Math.floor(signatory.percent * 100));
    await web3Instance.initialVault(account, vaultName, threshold, signatoriesAddress, signatoriesShares);
    setLoading(false);

    navigate(ROUTE_PATH.VAULTS);
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
      selectedValues={selectedValues}
      addNewSignatoryOnClick={addButtonClick}
      formOnClick={initializeVaultClick}
      addDegradingButtonClick={addDegradingButtonClick}
      removeButtonOnClick={removeButtonClick}
      vaultNameChangeCallback={(vaultName: string) => {
        setVaultName(vaultName);
      }}
      signatoriesChangeCallback={(signatories: SignatoryState[]) => {
        setSignatories(signatories);
      }}
      thresholdChangeCallback={(threshold: number) => {
        setThreshold(threshold);
      }}
      degradingPeriodsChangeCallback={(index: number, e: any) => {
        changeDegradingPeriod(index, e);
      }}
      degradingPeriodValueChangeCallback={(index: number, e: any) => {
        changeDegradingPeriodValue(index, e);
      }}
      degradingPeriodSharedChangeCallback={(index: number, e: any) => {
        changeDegradingPeriodShared(index, e);
      }}
      onChangeSharedInputCallback={(index: number, e: string) => {
        onChangeSharedInput(index, e);
      }}
      selectedValuesChangeCallback={(value: any) => {
        setSelectedValues(value);
      }}
      editButtonClick={(index: number, value: number) => {
        editButtonClick(index, value);
      }}
      saveInputValue={(index: number, value: number) => {
        saveInputValue(index, value);
      }}
    />
  );
};
