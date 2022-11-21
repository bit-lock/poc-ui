/* eslint-disable array-callback-return */
import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { useNavigate } from "react-router-dom";
import { Button, Grid, Input, InputGroup, Loader, Modal, Panel, Row, Tooltip, Whisper } from "rsuite";
import styled from "styled-components";
import toastr from "toastr";
import { bitcoinTemplateMaker } from "../lib/bitcoin/headerTemplate";
import { bitcoinBalanceCalculation, BITCOIN_PER_SATOSHI, calculateTxFees, convertTo35Byte, createDestinationPubkey, fetchUtxos } from "../lib/bitcoin/utils";
import { Signatories } from "../lib/models/Signatories";
import { UTXO } from "../lib/models/UTXO";
import { VaultState } from "../lib/models/VaultState";
import { Web3Lib } from "../lib/Web3Lib";
import CopyIcon from "../Svg/Icons/Copy";
import { utils } from "@script-wiz/lib-core";
import { calculateSignCount } from "../lib/utils";

type Props = {
  account: string;
  privateKey: string;
};

export const Vaults: React.FC<Props> = ({ account, privateKey }) => {
  const navigate = useNavigate();

  const [time, setTime] = useState(Date.now());

  const [vaultList, setVaultList] = useState<VaultState[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalState, setModalState] = useState<{ show: boolean; data?: Signatories }>({ show: false });
  const [depositModalState, setDepositModalState] = useState<{ show: boolean; data?: string }>({ show: false });
  const [withdrawModalState, setWithdrawModalState] = useState<{
    show: boolean;
    vaultId?: number;
    address?: string;
    scriptPubkey?: string;
    errorMessage?: string;
    amount?: number;
    bitcoin?: {
      address: string;
      balance: number;
      fee: number;
      utxos?: UTXO[];
    };
  }>({
    show: false,
  });

  // const [selectedUserUtxoSets, setSelectedUserUtxoSets] = useState<UTXO[]>([]);

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 6000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      const web3Instance = new Web3Lib();

      const vaultCount = await web3Instance.getVaultLength();
      const fetchVaultPromises = [];
      const fetchSignatoriesPromises = [];

      for (let i = 0; i < vaultCount; i++) {
        fetchVaultPromises.push(web3Instance.getVaults(i));
        fetchSignatoriesPromises.push(web3Instance.getSignatories(i));
      }

      const vaults = await Promise.all(fetchVaultPromises);
      const signatories = await Promise.all(fetchSignatoriesPromises);

      const myCurrentAdress = account.toLowerCase();

      const accountVaultList: VaultState[] = [];

      for (let z = 0; z < vaultCount; z++) {
        const currentVault = vaults[z];
        const currentSignatories = signatories[z][0].map((data: string) => data.toLowerCase());

        if (currentVault.initiator.toLowerCase() === myCurrentAdress) {
          const minimumSignatoryCount = calculateSignCount(currentVault, signatories[z]);

          if (currentVault.status === "0x01") {
            const { address, script } = bitcoinTemplateMaker(Number(currentVault.threshold), signatories[z]);

            const utxos = await fetchUtxos(address);
            const balance = bitcoinBalanceCalculation(utxos);

            const fee = await calculateTxFees(utxos, minimumSignatoryCount, script.substring(2));

            accountVaultList.push({ id: z, vault: currentVault, signatories: signatories[z], isMyOwner: true, minimumSignatoryCount, bitcoin: { address, balance, fee, utxos } });
          } else {
            accountVaultList.push({ id: z, vault: currentVault, signatories: signatories[z], isMyOwner: true, minimumSignatoryCount });
          }
        } else if (currentSignatories.includes(myCurrentAdress)) {
          const minimumSignatoryCount = calculateSignCount(currentVault, signatories[z]);

          if (currentVault.status === "0x01") {
            const { address, script } = bitcoinTemplateMaker(Number(currentVault.threshold), signatories[z]);

            const utxos = await fetchUtxos(address);
            const balance = bitcoinBalanceCalculation(utxos);
            const fee = await calculateTxFees(utxos, minimumSignatoryCount, script.substring(2));

            accountVaultList.push({ id: z, vault: currentVault, signatories: signatories[z], isMyOwner: false, minimumSignatoryCount, bitcoin: { address, balance, fee, utxos } });
          } else {
            accountVaultList.push({ id: z, vault: currentVault, signatories: signatories[z], isMyOwner: false, minimumSignatoryCount });
          }
        }
      }

      setVaultList(accountVaultList);
      setLoading(false);
    };

    init();
  }, [account, time]);

  const calculateWaitingConfirmCount = (signatories: Signatories) => {
    const currentData: string[] = signatories[2];
    const waitingConfirmationCount: number = currentData.length;
    let confimationCount = 0;

    currentData.forEach((signatory: string) => {
      if (signatory !== "0x0000000000000000000000000000000000000000000000000000000000000000") confimationCount++;
    });

    return "Confirmation Count : " + waitingConfirmationCount + " / " + confimationCount;
  };

  const handleOpen = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, signatories: Signatories) => {
    event.stopPropagation();
    setModalState({ show: true, data: signatories });
  };

  const renderSignatoryDetailModal = () => {
    if (modalState.data) {
      const signatoriesAddress = modalState.data[0];
      const percent = modalState.data[1];
      const confirmation = modalState.data[2];

      return (
        <Modal size="sm" open={modalState.show} onClose={() => setModalState({ show: false })}>
          <Modal.Header>
            <ModalTitle>Signatories</ModalTitle>
            {signatoriesAddress.map((item: string, index: number) => {
              return (
                <div key={index}>
                  <br />
                  <Text fontWeight={700}>Signatory {index + 1}</Text>
                  <br />
                  <Text>Address: {item}</Text>
                  <br />
                  <Text>Shared: {Number(percent[index]) / 100}%</Text>
                  <br />
                  {confirmation[index] === "0x0000000000000000000000000000000000000000000000000000000000000000" ? "Waiting Confirmation" : "Approved"}
                  <br />
                </div>
              );
            })}
          </Modal.Header>
          <Modal.Body></Modal.Body>
        </Modal>
      );
    }
  };

  const destinationAddressOnChange = (address: string) => {
    const { scriptPubkey, errorMessage } = createDestinationPubkey(address);

    setWithdrawModalState({ ...withdrawModalState, address, scriptPubkey, errorMessage });
  };

  const withdrawClick = async () => {
    setLoading(true);

    const web3Instance = new Web3Lib();

    const amountSats = Math.ceil((withdrawModalState.amount || 0) * BITCOIN_PER_SATOSHI);

    console.log("2", amountSats);

    const scriptPubkey = convertTo35Byte(utils.compactSizeVarIntData(withdrawModalState.scriptPubkey || ""));

    try {
      await web3Instance.initiateWithdrawal(withdrawModalState.vaultId || 0, "0x" + scriptPubkey, amountSats, withdrawModalState.bitcoin?.fee || 0, account);
    } catch (err: any) {
      toastr.error(err.message);
    }

    setLoading(false);
  };

  const allButtonClick = () => {
    const vaultBalance = withdrawModalState.bitcoin?.balance || 0;
    const currentFee = (withdrawModalState.bitcoin?.fee || 0) / BITCOIN_PER_SATOSHI;

    let allAmount = vaultBalance - currentFee;
    if (allAmount < 0) allAmount = 0;
    setWithdrawModalState({ ...withdrawModalState, amount: allAmount });
  };

  // const selectUtxo = (utxo: UTXO) => {
  //   const currentList = [...selectedUserUtxoSets];
  //   const findedIndex = currentList.findIndex((i: UTXO) => i.txId === utxo.txId);

  //   if (findedIndex !== -1) {
  //     currentList.splice(findedIndex, 1);
  //   } else {
  //     currentList.push(utxo);
  //   }

  //   setSelectedUserUtxoSets(currentList);
  // };

  const renderDepositModal = () => {
    if (depositModalState.data) {
      return (
        <Modal
          size="sm"
          open={depositModalState.show}
          onClose={() => {
            setDepositModalState({ show: false });
          }}
        >
          <Modal.Header>
            <ModalTitle>Deposit Bitcoin</ModalTitle>
          </Modal.Header>
          <Modal.Body>
            <QRContainer>
              <QRCode size={256} style={{ height: "auto", maxWidth: "100%", width: "100%" }} value={depositModalState.data} viewBox={`0 0 256 256`} />
            </QRContainer>
            <StyledInputGroup>
              <Input value={depositModalState.data} />
              <Whisper placement="top" trigger="click" speaker={<Tooltip>BTC Address</Tooltip>}>
                <InputGroup.Button onClick={() => navigator.clipboard.writeText(depositModalState.data || "")}>
                  <CopyIcon width="1rem" height="1rem" />
                </InputGroup.Button>
              </Whisper>
            </StyledInputGroup>
          </Modal.Body>
        </Modal>
      );
    }
  };

  const renderWithdrawModal = () => {
    if (withdrawModalState.show) {
      return (
        <Modal
          size="sm"
          open={withdrawModalState.show}
          onClose={() => {
            setWithdrawModalState({ show: false });
          }}
        >
          <Modal.Header>
            <ModalTitle>Withdraw Bitcoin</ModalTitle>
          </Modal.Header>
          <Modal.Body>
            <Text padding="0.3rem" display="block">
              Bitcoin Balance : {withdrawModalState.bitcoin?.balance}₿{" "}
            </Text>
            <StyledInputGroup>
              <Input
                placeholder={"Bitcoin Address"}
                value={withdrawModalState.address || ""}
                onChange={(value) => {
                  destinationAddressOnChange(value);
                }}
              />

              <Whisper placement="top" trigger="click" speaker={<Tooltip>BTC Address</Tooltip>}>
                <InputGroup.Button onClick={() => navigator.clipboard.writeText(withdrawModalState.address || "")}>
                  <CopyIcon width="1rem" height="1rem" />
                </InputGroup.Button>
              </Whisper>
            </StyledInputGroup>
            {withdrawModalState.errorMessage && <Text color="red">{withdrawModalState.errorMessage}</Text>}
            <AmountInputContainer>
              <Input
                type="number"
                placeholder="Amount (decimal)"
                value={withdrawModalState.amount || ""}
                onChange={(e: string) => {
                  setWithdrawModalState({ ...withdrawModalState, amount: Number(e) });
                }}
              />
            </AmountInputContainer>

            <StyledButton onClick={allButtonClick} padding="0.5rem" margin="1rem 1rem 0 0rem">
              All ₿
            </StyledButton>

            <StyledButton
              onClick={withdrawClick}
              padding="0.5rem"
              margin="1rem 0 0 0"
              disabled={!withdrawModalState.amount || !withdrawModalState.address || withdrawModalState.errorMessage}
            >
              Withdraw ₿
            </StyledButton>
          </Modal.Body>
          {/* {withdrawModalState.bitcoin?.utxos !== undefined && withdrawModalState.bitcoin?.utxos?.length > 0 && (
            <List bordered>
              {withdrawModalState.bitcoin?.utxos.map((utxo: UTXO, index: number) => {
                return (
                  <ListItem
                    key={index}
                    onClick={() => selectUtxo(utxo)}
                    background={selectedUserUtxoSets.findIndex((i: UTXO) => i.txId === utxo.txId) !== -1 ? "#1a1d24" : "#3c3f43"}
                  >
                    Tx: {utxo.txId} <br /> Vout: {utxo.vout} <br /> Balance: {utxo.value.toFixed(8)}₿
                  </ListItem>
                );
              })}
            </List>
          )} */}
        </Modal>
      );
    }
  };

  if (loading) {
    return <Loader backdrop content="Fetching vaults..." vertical />;
  }

  if (vaultList.length === 0) {
    return (
      <Container>
        <Text fontSize="1rem">You don't have any vaults.</Text>
      </Container>
    );
  }

  return (
    <Container fluid>
      <VaultList xs={12}>
        <Text fontSize="1.2rem" alignSelf="center">
          My Vault List
        </Text>
        {vaultList.map((item) => {
          if (item.isMyOwner) {
            return (
              <VaultItem key={item.id} onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => handleOpen(e, item.signatories)}>
                <StyledPanel bordered>
                  <Header>
                    <Text fontSize="0.9rem" fontWeight={700}>
                      {item.vault.name}
                    </Text>
                    {item.vault.status === "0x00" && <Button onClick={() => navigate("/edit-signatories/" + item.id)}>Edit</Button>}
                    {item.vault.status === "0x01" && (
                      <div>
                        <Button
                          onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                            e.stopPropagation();
                            setDepositModalState({ show: true, data: item.bitcoin?.address });
                          }}
                        >
                          Deposit ₿
                        </Button>
                        <StyledButton
                          onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                            e.stopPropagation();
                            setWithdrawModalState({ show: true, bitcoin: item.bitcoin, vaultId: item.id });
                          }}
                          margin="0 0 0 0.5rem"
                        >
                          Withdraw ₿
                        </StyledButton>
                      </div>
                    )}
                  </Header>
                  <Text>Id: {item.id}</Text>
                  <br />
                  <Text>Initiator: {item.vault.initiator}</Text>
                  <br />
                  <Text>Threshold: {Number(item.vault.threshold) / 100}</Text>
                  <br />
                  <Text>Status: {item.vault.status === "0x00" ? "Waiting Confirmations" : "Finalized"}</Text>
                  <br />
                  <Text>{calculateWaitingConfirmCount(item.signatories)}</Text>
                  <br />
                  <Text>Minimum Sign Count: {item.minimumSignatoryCount}</Text>

                  {item.bitcoin && (
                    <>
                      <br />
                      <Text>Address : {item.bitcoin?.address}</Text>
                      <br />
                      <>
                        <Text>Balance : {item.bitcoin?.balance} ₿</Text>
                      </>
                    </>
                  )}
                </StyledPanel>
              </VaultItem>
            );
          }
        })}
      </VaultList>
      <VaultList xs={12}>
        <Text fontSize="1.2rem" alignSelf="center">
          The vaults I'm in
        </Text>

        {vaultList.map((item) => {
          if (!item.isMyOwner) {
            return (
              <VaultItem key={item.id} onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => handleOpen(e, item.signatories)}>
                <StyledPanel bordered>
                  <Header>
                    <Text fontSize="0.9rem" fontWeight={700}>
                      {item.vault.name}
                    </Text>
                    {item.vault.status === "0x01" && (
                      <div>
                        <Button
                          onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                            e.stopPropagation();
                            setDepositModalState({ show: true, data: item.bitcoin?.address });
                          }}
                        >
                          Deposit ₿
                        </Button>
                        <StyledButton
                          onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                            e.stopPropagation();
                            setWithdrawModalState({ show: true, bitcoin: item.bitcoin });
                          }}
                          margin="0 0 0 0.5rem"
                        >
                          Withdraw ₿
                        </StyledButton>
                      </div>
                    )}
                  </Header>
                  <Text>Id: {item.id}</Text>
                  <br />
                  <Text>Initiator: {item.vault.initiator}</Text>
                  <br />
                  <Text>Threshold: {Number(item.vault.threshold) / 100}</Text>
                  <br />
                  <Text>Status: {item.vault.status === "0x00" ? "Waiting Confirmations" : "Finalized"}</Text>
                  <br />
                  <Text>{calculateWaitingConfirmCount(item.signatories)}</Text>
                  <br />
                  <Text>Minimum Sign Count: {item.minimumSignatoryCount}</Text>
                  {item.bitcoin && (
                    <>
                      <br />
                      <Text>Address : {item.bitcoin?.address}</Text>
                      <br />
                      <Text>Balance : {item.bitcoin?.balance} ₿</Text>
                    </>
                  )}
                </StyledPanel>
              </VaultItem>
            );
          }
        })}

        {modalState.show && renderSignatoryDetailModal()}
        {depositModalState.show && renderDepositModal()}
        {withdrawModalState.show && renderWithdrawModal()}
      </VaultList>
    </Container>
  );
};

interface TextProps {
  fontSize?: string;
  alignSelf?: string;
  fontWeight?: number;
  padding?: string;
  display?: string;
  background?: string;
}

const Container = styled(Grid)`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const VaultList = styled(Row)`
  display: flex;
  flex-direction: column;
  border: 1px solid gray;
  padding: 1rem;
  border-radius: 4px;
  width: 48%;
`;

const VaultItem = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: 12px;
  cursor: pointer;
`;

const Text = styled.span<TextProps>`
  font-size: ${(props) => (props.fontSize ? props.fontSize : "0.813rem")};
  font-weight: ${(props) => (props.fontWeight ? props.fontWeight : 500)};
  margin-bottom: 4px;
  align-self: ${(props) => props.alignSelf};
  color: ${(props) => props.color};
  padding: ${(props) => props.padding};
  display: ${(props) => props.display};
`;

const StyledPanel = styled(Panel)`
  display: flex;
  flex-direction: column;
  box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
`;

const ModalTitle = styled(Modal.Title)`
  font-weight: 700;
`;

const StyledInputGroup = styled(InputGroup)`
  width: 100%;
  margin: auto auto 1rem auto;
  align-self: center;
`;

const QRContainer = styled.div`
  height: auto;
  margin: 0 auto;
  max-width: 200px;
  width: 100%;
  margin-bottom: 1rem;
`;

const StyledButton = styled(Button)`
  margin: ${(props) => props.margin};
  padding: ${(props) => props.padding};
`;

const AmountInputContainer = styled.div`
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

// const ListItem = styled(List.Item)<TextProps>`
//   background: ${(props) => props.background};
//   color: white;
//   cursor: pointer;
// `;

// const AllButton = styled(Button)`
//   font-size: 0.87rem;
//   color: #a6d7ff;
//   margin-left: 0.5rem;
// `;
