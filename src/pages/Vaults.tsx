/* eslint-disable array-callback-return */
import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { useNavigate } from "react-router-dom";
import { Button, Grid, Input, InputGroup, Loader, Modal, Panel, Row, Tooltip, Whisper } from "rsuite";
import styled from "styled-components";
import { bitcoinTemplateMaker } from "../lib/bitcoin/headerTemplate";
import { bitcoinBalanceCalculation, calculateTxFees, convertTo35Byte, createDestinationPubkey, fetchUtxos } from "../lib/bitcoin/utils";
import { Signatories } from "../lib/models/Signatories";
import { Vault } from "../lib/models/Vault";
import { VaultState } from "../lib/models/VaultState";
import { Web3Lib } from "../lib/Web3Lib";
import CopyIcon from "../Svg/Icons/Copy";
import { utils } from "@script-wiz/lib-core";
// import { calculateSighashPreimage, signPreimages } from "../lib/bitcoin/preimagecalc";

const BITCOIN_PER_SATOSHI = 100000000;

type Props = {
  account: string;
  privateKey: string;
};

export const Vaults: React.FC<Props> = ({ account, privateKey }) => {
  const navigate = useNavigate();

  const [vaultList, setVaultList] = useState<VaultState[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [modalState, setModalState] = useState<{ show: boolean; data?: Signatories }>({ show: false });
  const [depositModalState, setDepositModalState] = useState<{ show: boolean; data?: string }>({ show: false });
  const [withdrawModalState, setWithdrawModalState] = useState<{
    show: boolean;
    address?: string;
    scriptPubkey?: string;
    errorMessage?: string;
    amount?: number;
    bitcoin?: {
      address: string;
      balance: number;
      fee: number;
    };
  }>({
    show: false,
  });

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

            accountVaultList.push({ id: z, vault: currentVault, signatories: signatories[z], isMyOwner: true, minimumSignatoryCount, bitcoin: { address, balance, fee } });
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

            accountVaultList.push({ id: z, vault: currentVault, signatories: signatories[z], isMyOwner: false, minimumSignatoryCount, bitcoin: { address, balance, fee } });
          } else {
            accountVaultList.push({ id: z, vault: currentVault, signatories: signatories[z], isMyOwner: false, minimumSignatoryCount });
          }
        }
      }

      setVaultList(accountVaultList);
      setLoading(false);
    };

    init();
  }, [account]);

  const calculateWaitingConfirmCount = (signatories: Signatories) => {
    const currentData: string[] = signatories[2];
    const waitingConfirmationCount: number = currentData.length;
    let confimationCount = 0;

    currentData.forEach((signatory: string) => {
      if (signatory !== "0x0000000000000000000000000000000000000000000000000000000000000000") confimationCount++;
    });

    return "Confirmation Count : " + waitingConfirmationCount + " / " + confimationCount;
  };

  // const handleClose = () => setModalState({ show: false });

  const handleOpen = (signatories: Signatories) => {
    setModalState({ show: true, data: signatories });
  };

  const calculateSignCount = (vault: Vault, signatories: Signatories) => {
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

  // const renderModal = () => {
  //   if (modalState.data) {
  //     const signatoriesAddress = modalState.data[0];
  //     const percent = modalState.data[1];
  //     const confirmation = modalState.data[2];

  //     return (
  //       <Modal size="sm" open={modalState.show} onClose={handleClose}>
  //         <Modal.Header>
  //           <ModalTitle>Signatories</ModalTitle>
  //           {signatoriesAddress.map((item: string, index: number) => {
  //             return (
  //               <div key={index}>
  //                 <br />
  //                 <Text fontWeight={700}>Signatory {index + 1}</Text>
  //                 <br />
  //                 <Text>Address: {item}</Text>
  //                 <br />
  //                 <Text>Shared: {Number(percent[index]) / 100}%</Text>
  //                 <br />
  //                 {confirmation[index] === "0x0000000000000000000000000000000000000000000000000000000000000000" ? "Waiting Confirmation" : "Approved"}
  //                 <br />
  //               </div>
  //             );
  //           })}
  //         </Modal.Header>
  //         <Modal.Body></Modal.Body>
  //       </Modal>
  //     );
  //   }
  // };

  const destinationAddressOnChange = (address: string) => {
    const { scriptPubkey, errorMessage } = createDestinationPubkey(address);

    setWithdrawModalState({ ...withdrawModalState, address, scriptPubkey, errorMessage });
  };

  const withdrawClick = async () => {
    // const vaultBalanceSats = (withdrawModalState.bitcoin?.balance || 0) * BITCOIN_PER_SATOSHI;
    const amountSats = (withdrawModalState.amount || 0) * BITCOIN_PER_SATOSHI;
    // const feeGap = vaultBalanceSats - amountSats - (withdrawModalState.bitcoin?.fee || 0);

    // temp
    // const utxos = await fetchUtxos(withdrawModalState.bitcoin?.address || "");

    // const preimages: string[] = calculateSighashPreimage(utxos, feeGap, withdrawModalState.bitcoin?.address || "", withdrawModalState?.scriptPubkey || "", amountSats, "");

    // console.log(signPreimages(privateKey, preimages));

    console.log("Withdraw ScriptPubkey", convertTo35Byte(utils.compactSizeVarIntData(withdrawModalState.scriptPubkey || "")));
    console.log("Withdraw fee", withdrawModalState.bitcoin?.fee);
    console.log("Withdraw input amount", amountSats);
  };

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
            <div style={{ height: "auto", margin: "0 auto", maxWidth: 200, width: "100%", marginBottom: "1rem" }}>
              <QRCode size={256} style={{ height: "auto", maxWidth: "100%", width: "100%" }} value={depositModalState.data} viewBox={`0 0 256 256`} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Input value={depositModalState.data} />
              <Whisper placement="top" trigger="click" speaker={<Tooltip>BTC Address</Tooltip>}>
                <InputGroup.Button onClick={() => navigator.clipboard.writeText(depositModalState.data || "")}>
                  <CopyIcon width="1rem" height="1rem" />
                </InputGroup.Button>
              </Whisper>
            </div>
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
            <Header style={{ padding: "0.3rem", display: "block" }}>Bitcoin Balance : {withdrawModalState.bitcoin?.balance}₿ </Header>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Input
                style={{ marginRight: "0.4rem" }}
                placeholder={"Bitcoin Address"}
                value={withdrawModalState.address}
                onChange={(value) => {
                  destinationAddressOnChange(value);
                }}
              />

              <Whisper placement="top" trigger="click" speaker={<Tooltip>BTC Address</Tooltip>}>
                <InputGroup.Button onClick={() => navigator.clipboard.writeText(withdrawModalState.address || "")}>
                  <CopyIcon width="1rem" height="1rem" />
                </InputGroup.Button>
              </Whisper>
            </div>
            {withdrawModalState.errorMessage && <Text style={{ color: "red" }}>{withdrawModalState.errorMessage}</Text>}
            <Input
              style={{ marginTop: "1rem" }}
              type="number"
              placeholder="Amount (decimal)"
              value={withdrawModalState.amount}
              onChange={(e) => {
                setWithdrawModalState({ ...withdrawModalState, amount: Number(e) });
              }}
            />
            <Button onClick={withdrawClick} style={{ padding: "0.5rem", marginTop: "1rem" }}>
              Withdraw ₿
            </Button>
          </Modal.Body>
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
              <VaultItem key={item.id} onClick={() => handleOpen(item.signatories)}>
                <StyledPanel bordered>
                  <Header>
                    <Text fontSize="0.9rem" fontWeight={700}>
                      {item.vault.name}
                    </Text>
                    {item.vault.status === "0x00" && <Button onClick={() => navigate("/edit-signatories/" + item.id)}>Edit</Button>}
                    {item.vault.status === "0x01" && (
                      <div>
                        <Button
                          onClick={() => {
                            setDepositModalState({ show: true, data: item.bitcoin?.address });
                          }}
                        >
                          Deposit ₿
                        </Button>
                        <Button
                          onClick={() => {
                            setWithdrawModalState({ show: true, bitcoin: item.bitcoin });
                          }}
                          style={{ marginLeft: "0.5rem" }}
                        >
                          Withdraw ₿
                        </Button>
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
      </VaultList>
      <VaultList xs={12}>
        <Text fontSize="1.2rem" alignSelf="center">
          The vaults I'm in
        </Text>

        {vaultList.map((item) => {
          if (!item.isMyOwner) {
            return (
              <VaultItem key={item.id} onClick={() => handleOpen(item.signatories)}>
                <StyledPanel bordered header={item.vault.name}>
                  {item.vault.status === "0x01" && (
                    <div>
                      <Button
                        onClick={() => {
                          setDepositModalState({ show: true, data: item.bitcoin?.address });
                        }}
                      >
                        Deposit ₿
                      </Button>
                      <Button
                        onClick={() => {
                          setWithdrawModalState({ show: true, bitcoin: item.bitcoin });
                        }}
                        style={{ marginLeft: "0.5rem" }}
                      >
                        Withdraw ₿
                      </Button>
                    </div>
                  )}
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

        {/* {modalState.show && renderModal()} */}
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
`;

const StyledPanel = styled(Panel)`
  display: flex;
  flex-direction: column;
  box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
`;

const ModalTitle = styled(Modal.Title)`
  font-weight: 700;
`;
