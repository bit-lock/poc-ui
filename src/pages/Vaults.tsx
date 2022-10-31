/* eslint-disable array-callback-return */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Grid, Loader, Modal, Panel, Row } from "rsuite";
import styled from "styled-components";
import { Signatories } from "../lib/models/Signatories";
import { VaultState } from "../lib/models/VaultState";
import { Web3Lib } from "../lib/Web3Lib";

type Props = {
  account: string;
};

export const Vaults: React.FC<Props> = ({ account }) => {
  const navigate = useNavigate();

  const [vaultList, setVaultList] = useState<VaultState[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalState, setModalState] = useState<{ show: boolean; data?: Signatories }>({ show: false });

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

      const accountVaultList = [];

      for (let z = 0; z < vaultCount; z++) {
        const currentVault = vaults[z];
        const currentSignatories = signatories[z][0].map((data: string) => data.toLowerCase());

        if (currentVault.initiator.toLowerCase() === myCurrentAdress) {
          accountVaultList.push({ id: z, vault: vaults[z], signatories: signatories[z], isMyOwner: true });
        } else if (currentSignatories.includes(myCurrentAdress)) {
          accountVaultList.push({ id: z, vault: vaults[z], signatories: signatories[z], isMyOwner: false });
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

  const handleClose = () => setModalState({ show: false });

  const handleOpen = (signatories: Signatories) => {
    setModalState({ show: true, data: signatories });
  };

  const renderModal = () => {
    if (modalState.data) {
      const signatoriesAddress = modalState.data[0];
      const percent = modalState.data[1];
      const confirmation = modalState.data[2];

      return (
        <Modal size="sm" open={modalState.show} onClose={handleClose}>
          <Modal.Header>
            <Modal.Title style={{ fontWeight: 700 }}>Signatories</Modal.Title>
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
                  </Header>
                  <Text>Id: {item.id}</Text>
                  <br />
                  <Text>Initiator: {item.vault.initiator}</Text>
                  <br />
                  <Text>Threshold: {item.vault.threshold}</Text>
                  <br />
                  <Text>Status: {item.vault.status === "0x00" ? "Waiting Confirmations" : "Finalized"}</Text>
                  <br />
                  <Text>{calculateWaitingConfirmCount(item.signatories)}</Text>
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
                  <Text>Id: {item.id}</Text>
                  <br />
                  <Text>Initiator: {item.vault.initiator}</Text>
                  <br />
                  <Text>Threshold: {item.vault.threshold}</Text>
                  <br />
                  <Text>Status: {item.vault.status === "0x00" ? "Waiting Confirmations" : "Finalized"}</Text>
                  <br />
                  <Text>{calculateWaitingConfirmCount(item.signatories)}</Text>
                </StyledPanel>
              </VaultItem>
            );
          }
        })}

        {modalState.show && renderModal()}
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
