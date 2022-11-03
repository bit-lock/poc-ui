import React, { useEffect, useState } from "react";
import TrashIcon from "@rsuite/icons/Trash";
import EditIcon from "@rsuite/icons/Edit";
import CheckIcon from "@rsuite/icons/Check";
import CloseIcon from "@rsuite/icons/Close";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Input, Slider, InputGroup, Tooltip, Whisper, Loader } from "rsuite";
import styled from "styled-components";
import toastr from "toastr";
import { ROUTE_PATH } from "../routes/ROUTE_PATH";
import CopyIcon from "../Svg/Icons/Copy";
import { Web3Lib } from "../lib/Web3Lib";
import { SignatoryState } from "../lib/models/SignatoryState";
import { Vault } from "../lib/models/Vault";

type Props = {
  account: string;
};

export const EditVault: React.FC<Props> = ({ account }) => {
  const params = useParams();
  const id = Number(params.id);

  const navigate = useNavigate();

  const [signatories, setSignatories] = useState<SignatoryState[]>([]);
  const [threshold, setThreshold] = useState<number>(25);
  const [loading, setLoading] = useState<boolean>(true);
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

  if (loading) {
    return <Loader backdrop content="Initializing vault..." vertical />;
  }

  return (
    <Wrapper>
      <InputContainer>
        <StyledText>Vault Name</StyledText>
        <StyledInput value={vault?.name || ""} disabled />
      </InputContainer>

      <div>
        {signatories.map((signatory: SignatoryState, index: number) => {
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
              <IconContainer>
                <Input
                  type="number"
                  disabled={index !== selectedValues?.index}
                  style={{ width: "100px" }}
                  value={index !== selectedValues?.index ? Number(signatory.percent) : selectedValues?.value || ""}
                  onChange={(e: string) => {
                    onChangeSharedInput(index, e);
                  }}
                />
                {index !== 0 && index !== selectedValues?.index && (
                  <Delete
                    onClick={() => {
                      removeButtonClick(index, signatory.percent);
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
                        setSelectedValues(undefined);
                      }}
                    />
                  </EditContainer>
                )}
              </IconContainer>
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

      <AddSignatoryButton appearance="primary" onClick={editVaultClick}>
        Edit Vault
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
