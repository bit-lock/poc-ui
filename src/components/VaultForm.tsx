import React from "react";
import { Button, Dropdown, Input, InputGroup, Slider, Tooltip, Whisper } from "rsuite";
import styled from "styled-components";
import { secondsForUnits } from "../helper";
import { DegradingPeriod } from "../lib/models/DegradingPeriod";
import { SignatoryState } from "../lib/models/SignatoryState";
import CopyIcon from "../Svg/Icons/Copy";
import TrashIcon from "@rsuite/icons/Trash";
import EditIcon from "@rsuite/icons/Edit";
import CheckIcon from "@rsuite/icons/Check";
import CloseIcon from "@rsuite/icons/Close";

const timeRange: number[] = [...Array(30).keys()];

type Props = {
  vaultName: string;
  signatories: SignatoryState[];
  threshold: number;
  degradingPeriods: DegradingPeriod[];
  selectedValues?: { index: number; value: number };
  addNewSignatoryOnClick: () => void;
  formOnClick: () => void;
  selectedValuesChangeCallback: (value: any) => void;
  addDegradingButtonClick: () => void;
  editButtonClick: (index: number, value: number) => void;
  saveInputValue: (index: number, value: number) => void;
  removeButtonOnClick: (index: number, percent: number) => void;
  vaultNameChangeCallback: (vaultName: string) => void;
  signatoriesChangeCallback: (signatories: SignatoryState[]) => void;
  thresholdChangeCallback: (threshold: number) => void;
  degradingPeriodsChangeCallback: (index: number, e: any) => void;
  degradingPeriodValueChangeCallback: (index: number, e: any) => void;
  degradingPeriodSharedChangeCallback: (index: number, e: any) => void;
  onChangeSharedInputCallback: (index: number, e: string) => void;
};

export const VaultForm: React.FC<Props> = ({
  vaultName,
  signatories,
  threshold,
  degradingPeriods,
  selectedValues,
  addNewSignatoryOnClick,
  formOnClick,
  editButtonClick,
  saveInputValue,
  selectedValuesChangeCallback,
  addDegradingButtonClick,
  removeButtonOnClick,
  vaultNameChangeCallback,
  signatoriesChangeCallback,
  thresholdChangeCallback,
  degradingPeriodsChangeCallback,
  degradingPeriodValueChangeCallback,
  degradingPeriodSharedChangeCallback,
  onChangeSharedInputCallback,
}) => {
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

  return (
    <Wrapper>
      <InputContainer>
        <StyledText>Vault Name</StyledText>
        <StyledInput value={vaultName} onChange={(value: string) => vaultNameChangeCallback(value)} />
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
                    signatoriesChangeCallback(clonedSignatories);
                  }}
                />
                <Whisper placement="top" trigger="click" speaker={<Tooltip>ETH Address</Tooltip>}>
                  <InputGroup.Button onClick={() => navigator.clipboard.writeText(signatory.address || "")}>
                    <CopyIcon width="1rem" height="1rem" />
                  </InputGroup.Button>
                </Whisper>
              </StyledInputGroup>
              <IconContainer>
                <Input
                  type="number"
                  disabled={index !== selectedValues?.index}
                  style={{ width: "100px" }}
                  value={index !== selectedValues?.index ? Number(signatory.percent) : selectedValues?.value || ""}
                  onChange={(e: string) => {
                    onChangeSharedInputCallback(index, e);
                  }}
                />
                {index !== 0 && index !== selectedValues?.index && (
                  <Delete
                    onClick={() => {
                      removeButtonOnClick(index, signatory.percent);
                    }}
                  />
                )}

                {index !== selectedValues?.index && (
                  <Edit
                    onClick={() => {
                      editButtonClick(index, signatory.percent);
                    }}
                  />
                )}
                {index === selectedValues?.index && (
                  <EditContainer>
                    <Check
                      onClick={() => {
                        saveInputValue(index, signatory.percent);
                      }}
                    />
                    <Close
                      onClick={() => {
                        selectedValuesChangeCallback(undefined);
                      }}
                    />
                  </EditContainer>
                )}
              </IconContainer>
            </InputContainer>
          );
        })}
      </div>
      <CustomAddButton onClick={addNewSignatoryOnClick}>Add New Signatory</CustomAddButton>

      <InputContainer>
        <StyledText>Threshold</StyledText>
        <StyledSlider
          progress
          step={0.01}
          defaultValue={25.0}
          margin="auto auto 1rem 5.4rem"
          onChange={(value) => {
            thresholdChangeCallback(value);
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
                  {timeRange.map((time, i: number) => {
                    return (
                      <Dropdown.Item key={i} eventKey={time + 1} onSelect={(e) => degradingPeriodValueChangeCallback(index, e)}>
                        {time + 1}
                      </Dropdown.Item>
                    );
                  })}
                </SDropdown>

                <Dropdown title={data.date.unit} activeKey={data.date.unit}>
                  {secondsForUnits.map((time, i: number) => {
                    return (
                      <Dropdown.Item key={i} eventKey={time.unit} onSelect={(e) => degradingPeriodsChangeCallback(index, e)}>
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
              value={data.shared}
              onChange={(value) => {
                degradingPeriodSharedChangeCallback(index, value);
              }}
            />
          </div>
        );
      })}
      <CustomAddButton onClick={addDegradingButtonClick} disabled={degradingPeriods.length === 3}>
        Add Degrading Period
      </CustomAddButton>

      <CustomAddButton appearance="primary" onClick={formOnClick} disabled={vaultName === "" || threshold === 0}>
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

const StyledInput = styled(Input)`
  width: 65%;
  margin: auto 3% auto 85px;
  align-self: end;
`;
const StyledInputGroup = styled(InputGroup)`
  width: 65%;
  margin: auto 3% auto 85px;
  align-self: end;
`;

const StyledSlider = styled(Slider)<StyleProps>`
  width: 65%;
  margin: ${(props) => (props.margin ? props.margin : "auto auto 1rem auto")};
  align-self: end;
`;

const StyledText = styled.p`
  font-size: 1rem;
  color: #f7931a;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: row;
  margin-bottom: 15px;
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const Delete = styled(TrashIcon)`
  width: 1.25rem;
  height: 1.25rem;
  align-self: center;
  margin-left: 5px;
  cursor: pointer;
`;

const Edit = styled(EditIcon)`
  width: 1.25rem;
  height: 1.25rem;
  align-self: center;
  margin: auto 5px;
  cursor: pointer;
`;

const Check = styled(CheckIcon)`
  width: 1.25rem;
  height: 1.25rem;
  align-self: center;
  margin: auto 5px;
  cursor: pointer;
`;

const Close = styled(CloseIcon)`
  width: 1.25rem;
  height: 1.25rem;
  align-self: center;
  margin: auto 5px;
  cursor: pointer;
`;

const IconContainer = styled.div`
  display: flex;
  margin-left: 0;
  min-width: 156px;
`;

const EditContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CustomAddButton = styled(Button)`
  width: 65%;
  height: 40px;
  align-self: center;
  margin: auto auto 1rem auto;
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
