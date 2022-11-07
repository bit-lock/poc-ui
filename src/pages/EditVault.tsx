import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader } from "rsuite";
import toastr from "toastr";
import { ROUTE_PATH } from "../routes/ROUTE_PATH";
import { Web3Lib } from "../lib/Web3Lib";
import { SignatoryState } from "../lib/models/SignatoryState";
import { Vault } from "../lib/models/Vault";
import { VaultForm } from "../components/VaultForm";
import { DegradingPeriod } from "../lib/models/DegradingPeriod";
import { secondsForUnits } from "../helper";

type Props = {
  account: string;
};

export const EditVault: React.FC<Props> = ({ account }) => {
  const params = useParams();
  const id = Number(params.id);

  const navigate = useNavigate();

  const [vaultName, setVaultName] = useState<string>("");
  const [signatories, setSignatories] = useState<SignatoryState[]>([]);
  const [threshold, setThreshold] = useState<number>(25);
  const [loading, setLoading] = useState<boolean>(true);
  const [degradingPeriods, setDegradingPeriods] = useState<DegradingPeriod[]>([]);
  const [vault, setVault] = useState<Vault>();

  const [selectedValues, setSelectedValues] = useState<{ index: number; value: number }>();

  //   useEffect(() => {
  //     const web3Instance = new Web3Lib();
  //     const getVault = async () => {
  //       const currentVault = await web3Instance.getVaults(id);
  //       setVault(currentVault);

  //       const currentSignatories = await web3Instance.getSignatories(id);

  //       let signatoriesPreviousState: any = [];
  //       const address = currentSignatories[0];
  //       const share = currentSignatories[1];

  //       address.map((item: any, index: number) => {
  //         return signatoriesPreviousState.push({ index: index, address: item, percent: share[index] / 100 });
  //       });
  //       setSignatories(signatoriesPreviousState);

  //       setLoading(false);
  //     };

  //     getVault();
  //   }, [id]);

  useEffect(() => {
    const web3Instance = new Web3Lib();

    web3Instance
      .getVaults(id)
      .then((res) => {
        setVault(res);
        setVaultName(res.name);

        web3Instance
          .getSignatories(id)
          .then((res) => {
            let signatoriesPreviousState: SignatoryState[] = [];
            const address = res[0];
            const share = res[1];

            address.map((item: string, index: number) => {
              return signatoriesPreviousState.push({ index: index, address: item, percent: Number(share[index]) / 100 });
            });
            setSignatories(signatoriesPreviousState);
            setLoading(false);
          })
          .catch(() => {
            toastr.error("Something went wrong.");
            navigate(ROUTE_PATH.VAULTS);
          });
      })
      .catch(() => {
        toastr.error("Vault not found.");
        navigate(ROUTE_PATH.VAULTS);
      });
  }, [id, navigate]);

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

  const editVaultClick = async () => {
    setLoading(true);
    const web3Instance = new Web3Lib();
    const signatoriesAddress = signatories.map((signatory: SignatoryState) => signatory.address);
    const signatoriesShares = signatories.map((signatory: SignatoryState) => Math.floor(signatory.percent * 100));

    await web3Instance.editSignatories(id, signatoriesAddress, signatoriesShares, account);
    setLoading(false);

    navigate(ROUTE_PATH.VAULTS);
  };

  const onChangeSharedInput = (index: number, inputValue: string) => {
    const value = Number(inputValue);

    if (value > 99.99) {
      setSelectedValues({ index: index, value: 99.99 });
    } else if (value < 0) setSelectedValues({ index: index, value: 0.01 });
    else setSelectedValues({ index, value });
  };

  const editButtonClick = (index: number, value: number) => {
    setSelectedValues({ index, value });
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
      formOnClick={editVaultClick}
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
