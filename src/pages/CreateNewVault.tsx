import React, { useState } from "react";
import TrashIcon from "@rsuite/icons/Trash";
import { useNavigate } from "react-router-dom";
import { Button, Input, Slider, InputGroup, Tooltip, Whisper, Loader, Dropdown } from "rsuite";
import styled from "styled-components";
import { ROUTE_PATH } from "../routes/ROUTE_PATH";
import CopyIcon from "../Svg/Icons/Copy";
import { Web3Lib } from "../lib/Web3Lib";
import { SignatoryState } from "../lib/models/SignatoryState";
import { secondsForUnits } from "../helper";
import { DegradingPeriod } from "../lib/models/DegradingPeriod";

type Props = {
  account: string;
};

export const CreateNewVault: React.FC<Props> = ({ account }) => {
  const navigate = useNavigate();

  const [vaultName, setVaultName] = useState<string>("");
  const [signatories, setSignatories] = useState<SignatoryState[]>([{ index: 0, address: account, percent: 100 }]);
  const [threshold, setThreshold] = useState<number>(25);
  const [degradingPeriods, setDegradingPeriods] = useState<DegradingPeriod[]>([{ date: { value: 10, unit: secondsForUnits[0].unit }, shared: 100 }]);
  const [loading, setLoading] = useState<boolean>(false);

  const numbers: number[] = [...Array(30).keys()];

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
    newDegradingPeriod.push({ date: { value: 10, unit: secondsForUnits[0].unit }, shared: 100 });

    setDegradingPeriods(newDegradingPeriod);
  };

  const changeDegradingPeriod = (index: number, value: string) => {
    const clonedDegradingPeriods = [...degradingPeriods];

    const kacincidegisicek = clonedDegradingPeriods[index];
    kacincidegisicek.date.unit = value;

    setDegradingPeriods(clonedDegradingPeriods);
  };

  const changeDegradingPeriodValue = (index: number, value: number) => {
    const clonedDegradingPeriods = [...degradingPeriods];

    const kacincidegisicek = clonedDegradingPeriods[index];
    kacincidegisicek.date.value = value;

    setDegradingPeriods(clonedDegradingPeriods);
  };

  const changeDegradingPeriodShared = (index: number, value: number) => {
    const clonedDegradingPeriods = [...degradingPeriods];

    const kacincidegisicek = clonedDegradingPeriods[index];
    kacincidegisicek.shared = value;

    setDegradingPeriods(clonedDegradingPeriods);
  };

  const calculateMaxValue = (index: number) => {
    switch (index) {
      case 0: {
        return threshold;
      }
      case 1: {
        return degradingPeriods[0].shared;
      }
      case 2: {
        return degradingPeriods[1].shared;
      }
      default: {
        return 100;
      }
    }
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

  const initButonDisabled: boolean = vaultName === "" || threshold === 0;

  if (loading) {
    return <Loader backdrop content="Initializing vault..." vertical />;
  }

  return (
    <Wrapper>
      <InputContainer>
        <StyledText>Vault Name</StyledText>
        <StyledInput value={vaultName} onChange={(value: string) => setVaultName(value)} />
      </InputContainer>

      <div>
        {signatories.map((signatory: SignatoryState, index) => {
          return (
            <InputContainer key={index}>
              <StyledText>Signatory {index + 1}</StyledText>
              <StyledInputGroup>
                <Input
                  placeholder={"0x ETH Address"}
                  value={signatory.address}
                  onChange={(value: string) => {
                    const clonedSignatories = [...signatories];
                    clonedSignatories[index].address = value.replace(/\s/g, "");
                    setSignatories(clonedSignatories);
                  }}
                />
                <Whisper placement="top" trigger="click" speaker={<Tooltip>ETH Address</Tooltip>}>
                  <InputGroup.Button onClick={() => navigator.clipboard.writeText(signatory.address || "")}>
                    <CopyIcon width="1rem" height="1rem" />
                  </InputGroup.Button>
                </Whisper>
              </StyledInputGroup>

              <PercentContainer>%{signatory.percent.toFixed(2)}</PercentContainer>
              {index !== 0 && (
                <Delete
                  onClick={() => {
                    removeButtonClick(index, signatory.percent);
                  }}
                />
              )}
            </InputContainer>
          );
        })}
      </div>
      <CustomAddButton onClick={addButtonClick}>Add New Signatory</CustomAddButton>

      <InputContainer>
        <StyledText>Threshold</StyledText>
        <StyledSlider
          progress
          step={0.01}
          defaultValue={25.0}
          margin="auto auto 1rem 5.4rem"
          onChange={(value) => {
            setThreshold(value);
          }}
        />
      </InputContainer>

      {degradingPeriods.map((data, index) => {
        return (
          <div key={index}>
            <InputContainer>
              <StyledText>Degrading Period {index + 1} </StyledText>
              <DropdownGroup>
                <SDropdown title={data.date.value} activeKey={data.date.value}>
                  {numbers.map((time, i: number) => {
                    return (
                      <Dropdown.Item key={i} eventKey={time + 1} onSelect={(e) => changeDegradingPeriodValue(index, e)}>
                        {time + 1}
                      </Dropdown.Item>
                    );
                  })}
                </SDropdown>

                <Dropdown title={data.date.unit} activeKey={data.date.unit}>
                  {secondsForUnits.map((time, i: number) => {
                    return (
                      <Dropdown.Item key={i} eventKey={time.unit} onSelect={(e) => changeDegradingPeriod(index, e)}>
                        {time.unit}
                      </Dropdown.Item>
                    );
                  })}
                </Dropdown>
              </DropdownGroup>
            </InputContainer>
            <StyledSlider
              progress
              max={calculateMaxValue(index)}
              step={0.01}
              defaultValue={25.0}
              onChange={(value) => {
                changeDegradingPeriodShared(index, value);
              }}
            />
          </div>
        );
      })}
      <CustomAddButton onClick={addDegradingButtonClick} disabled={degradingPeriods.length === 3}>
        Add Degrading Period
      </CustomAddButton>

      <CustomAddButton appearance="primary" onClick={initializeVaultClick} disabled={initButonDisabled}>
        Initialize Vault
      </CustomAddButton>
    </Wrapper>
  );
};

interface StyleProps {
  margin?: string;
  width?: string;
}

const Wrapper = styled.section`
  padding: 2em;
  position: absolute;
  display: flex;
  justify-content: center;
  width: 65%;
  border: 1px solid gray;
  border-radius: 10px;
  flex-direction: column;
  overflow: auto;
  left: 50%;
  top: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
`;

const CustomAddButton = styled(Button)`
  width: 65%;
  height: 40px;
  align-self: center;
  margin: auto auto 1rem auto;
`;

const StyledInput = styled(Input)`
  width: 65%;
  margin: auto 1rem auto 4.4rem;
  align-self: end;
`;
const StyledInputGroup = styled(InputGroup)`
  width: 65%;
  margin: auto auto 1rem 4.4rem;
  align-self: end;
`;

const StyledSlider = styled(Slider)<StyleProps>`
  width: ${(props) => (props.width ? props.width : "65%")};
  margin: ${(props) => (props.margin ? props.margin : "auto auto 1rem auto")};
  align-self: end;
`;

const StyledText = styled.p`
  font-size: 1rem;
  color: #f7931a;
  align-self: center;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: row;
  margin-bottom: 1rem;
  justify-content: start;
`;

const PercentContainer = styled.div`
  display: flex;
  font-size: 16px;
  align-items: center;
  background: gray;
  padding: 9px;
  color: wheat;
  border-radius: 2px;
  font-weight: 600;
  min-width: 75px;
`;

const Delete = styled(TrashIcon)`
  width: 1.25rem;
  height: 1.25rem;
  align-self: center;
  margin-left: 5px;
  cursor: pointer;
`;

const DropdownGroup = styled.div`
  width: 10rem;
  display: flex;
  justify-content: space-between;
  margin-left: 1rem;
`;

const SDropdown = styled(Dropdown)`
  .rs-dropdown-menu {
    height: 10.25rem;
    width: 4rem;
    z-index: 500;
    overflow-y: auto;
  }
`;
