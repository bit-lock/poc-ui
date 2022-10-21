import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Slider, InputGroup, Tooltip, Whisper } from "rsuite";
import styled from "styled-components";
import { ROUTE_PATH } from "../routes/ROUTE_PATH";
import CopyIcon from "../Svg/Icons/Copy";
import TrashIcon from "@rsuite/icons/Trash";
import { crypto } from "@script-wiz/lib-core";
import WizData from "@script-wiz/wiz-data";
import toastr from "toastr";

declare var window: any;

type Signatory = {
  index: number;
  value: string;
  percent: number;
};

export const CreateNewVault = () => {
  const { ethereum } = window;

  const navigate = useNavigate();

  const [vaultName, setVaultName] = useState<string>("");
  const [signatories, setSignatories] = useState<Signatory[]>([{ index: 1, value: "", percent: 100 }]);
  const [newSignatoryValue, setNewSignatoryValue] = useState<number>(25);
  const [account, setAccount] = useState<string>("");

  const [signature, setSignature] = useState<string>("");
  const [privateKey, setPrivateKey] = useState<string>();
  const [publicKey, setPublicKey] = useState<string>();

  const message = "Sign this message to access MultiBit interface.";

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      ethereum
        .request({ method: "eth_requestAccounts" })
        .then((accounts: Array<string>) => {
          signatories[0].value = accounts[0];
          setAccount(accounts[0]);
          const clonedScripts = [...signatories];
          setSignatories(clonedScripts);
        })
        .catch((error: any) => {
          if (error.code === 4001) {
            toastr.error("Please connect to MetaMask.");
          } else {
            toastr.error(error.response.data);
          }
        });
    } else {
      window.open("https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ethereum]);

  useEffect(() => {
    if (account !== "") {
      ethereum
        .request({ method: "personal_sign", params: [message, account] })
        .then((sgntr: string) => {
          createKeys(sgntr);
        })
        .catch((err: any) => toastr.error(err.message));
    }
  }, [account, ethereum]);

  const createKeys = (signature: string) => {
    try {
      const withoutPrefixSignature = signature.slice(2);
      const prvKey = crypto.sha256(WizData.fromHex(withoutPrefixSignature)).toString();

      const keys = crypto.schnorrCreatePublicKey(WizData.fromHex(prvKey));

      setSignature(withoutPrefixSignature);
      setPrivateKey(prvKey);
      setPublicKey(keys.publicKey.hex);
    } catch (err: any) {
      toastr.error(err);
    }
  };

  const addButtonClick = () => {
    const newSignatory = [...signatories];
    const previousState = newSignatory.map((s: Signatory) => {
      return { ...s, percent: (s.percent * (100 - newSignatoryValue)) / 100 };
    });

    previousState.push({ index: signatories.length + 1, value: "", percent: newSignatoryValue });

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

  return (
    <Wrapper>
      <StyledBackButton onClick={() => navigate(ROUTE_PATH.VAULT)}> Back </StyledBackButton>

      <InputContainer>
        <StyledText>Vault Name</StyledText>
        <StyledInput value={vaultName} onChange={(value: string) => setVaultName(value)} />
      </InputContainer>

      <div>
        {signatories.map((signatory: any, index) => {
          return (
            <InputContainer key={index}>
              <StyledText>Signatory {index + 1}</StyledText>
              <StyledInputGroup>
                <Input
                  placeholder={"0x ETH Address"}
                  value={signatory.value}
                  onChange={(value: string) => {
                    const clonedSignatories = [...signatories];
                    clonedSignatories[index].value = value.replace(/\s/g, "");
                    setSignatories(clonedSignatories);
                  }}
                />
                <Whisper placement="top" trigger="click" speaker={<Tooltip>ETH Address</Tooltip>}>
                  <InputGroup.Button onClick={() => navigator.clipboard.writeText(signatory.value || "")}>
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
            setNewSignatoryValue(value);
          }}
        />
      </InputContainer>

      <AddSignatoryButton appearance="primary" onClick={() => console.log(vaultName, signatories)}>
        Initiaize Vault
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
