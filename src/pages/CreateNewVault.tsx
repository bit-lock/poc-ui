import React, { useState } from "react";
import TrashIcon from "@rsuite/icons/Trash";
import { useNavigate } from "react-router-dom";
import { Button, Input, Slider, InputGroup, Tooltip, Whisper } from "rsuite";
import styled from "styled-components";
import { ROUTE_PATH } from "../routes/ROUTE_PATH";
import CopyIcon from "../Svg/Icons/Copy";
import { Web3Lib } from "../lib/Web3Lib";
import { Signatory } from "../lib/models/Signatory";

type Props = {
  account: string;
};

export const CreateNewVault: React.FC<Props> = ({ account }) => {
  const [vaultName, setVaultName] = useState<string>("");
  const [signatories, setSignatories] = useState<Signatory[]>([{ index: 0, address: account, percent: 100 }]);
  const [threshold, setThreshold] = useState<number>(25);
  const navigate = useNavigate();

  const addButtonClick = () => {
    const newSignatory = [...signatories];
    const previousState = newSignatory.map((s: Signatory) => {
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

  const initializeVaultClick = async () => {
    const web3Instance = new Web3Lib();
    const signatoriesAddress = signatories.map((signatory: Signatory) => signatory.address);
    const signatoriesShares = signatories.map((signatory: Signatory) => signatory.percent * 100);
    await web3Instance.initialVault(account, vaultName, threshold, signatoriesAddress, signatoriesShares);

    navigate(ROUTE_PATH.VAULTS);
  };

  const initButonDisabled: boolean = vaultName === "" || threshold === 0;

  return (
    <Wrapper>
      <StyledBackButton onClick={() => navigate(ROUTE_PATH.HOME)}> Back </StyledBackButton>

      <InputContainer>
        <StyledText>Vault Name</StyledText>
        <StyledInput value={vaultName} onChange={(value: string) => setVaultName(value)} />
      </InputContainer>

      <div>
        {signatories.map((signatory: Signatory, index) => {
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
      <AddSignatoryButton onClick={addButtonClick}>Add New Signatory</AddSignatoryButton>

      <InputContainer>
        <StyledText>Threshold</StyledText>
        <StyledSlider
          progress
          step={0.01}
          defaultValue={25.0}
          onChange={(value) => {
            setThreshold(value);
          }}
        />
      </InputContainer>

      <AddSignatoryButton appearance="primary" onClick={initializeVaultClick} disabled={initButonDisabled}>
        Initialize Vault
      </AddSignatoryButton>
    </Wrapper>
  );
};

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

const StyledBackButton = styled(Button)`
  width: 20%;
  align-self: start;
  margin-bottom: 30px;
`;

const AddSignatoryButton = styled(Button)`
  width: 65%;
  height: 40px;
  align-self: end;
  margin: auto 16% 10px auto;
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

const StyledSlider = styled(Slider)`
  width: 65%;
  margin: auto 3% auto 95px;
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
