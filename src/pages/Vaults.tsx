import React, { useEffect, useState } from "react";
import { Col, Grid, Loader, Panel, Placeholder, Row } from "rsuite";
import styled from "styled-components";
import { Web3Lib } from "../lib/Web3Lib";

export const Vaults = () => {
  const [vaultList, setVaultList] = useState<Array<any>>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

      const myAddresses: string[] = await window.ethereum.request({ method: "eth_requestAccounts" });
      const myCurrentAdress = myAddresses[0].toLowerCase();

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
  }, []);

  const calculateWaitingConfirmCount = (signatories: any[]) => {
    const currentData = signatories[2];
    const waitingConfirmationCount = currentData.length;
    let confimationCount = 0;

    currentData.forEach((signatory: any) => {
      if (signatory !== "0x0000000000000000000000000000000000000000000000000000000000000000") confimationCount++;
    });

    return "Confirmation Count : " + waitingConfirmationCount + " / " + confimationCount;
  };

  if (loading) {
    return <Loader backdrop content="Fetching vaults..." vertical />;
  }

  if (vaultList.length === 0) {
    return (
      <Container>
        <Text fontSize="16px">You don't have any vaults.</Text>
      </Container>
    );
  }
  return (
    <Container fluid>
      <VaultList xs={12} xsPush={12}>
        <Text fontSize="17px" alignSelf="center">
          My Vault List
        </Text>
        {vaultList.map((list) => {
          if (list.isMyOwner) {
            return (
              <VaultItem>
                <StyledPanel bordered header={list.vault.name}>
                  <Text>Id: {list.id}</Text>
                  <br />
                  <Text>Initiator: {list.vault.initiator}</Text>
                  <br />
                  <Text>Threshold: {list.vault.threshold}</Text>
                  <br />
                  <Text>Status: {list.vault.status === "0x00" ? "Waiting Confirmations" : "Finalized"}</Text>
                  <br />
                  <Text>{calculateWaitingConfirmCount(list.signatories)}</Text>
                </StyledPanel>
              </VaultItem>
            );
          } else {
            return <></>;
          }
        })}
      </VaultList>
      <VaultList xs={12} xsPush={12}>
        <Text fontSize="17px" alignSelf="center">
          The vaults I'm in.
        </Text>

        {vaultList.map((list) => {
          if (!list.isMyOwner) {
            return (
              <VaultItem>
                <StyledPanel bordered header={list.vault.name}>
                  <Text>Id: {list.id}</Text>
                  <br />
                  <Text>Initiator: {list.vault.initiator}</Text>
                  <br />
                  <Text>Threshold: {list.vault.threshold}</Text>
                  <br />
                  <Text>Status: {list.vault.status === "0x00" ? "Waiting Confirmations" : "Finalized"}</Text>
                  <br />
                  <Text>{calculateWaitingConfirmCount(list.signatories)}</Text>
                </StyledPanel>
              </VaultItem>
            );
          } else {
            return <></>;
          }
        })}
      </VaultList>
    </Container>
  );
};

const Container = styled(Grid)`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  padding: 2rem;
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
`;

interface Props {
  fontSize?: string;
  alignSelf?: string;
}

const Text = styled.span<Props>`
  font-size: ${(props) => (props.fontSize ? props.fontSize : "13px")};
  margin-bottom: 4px;
  align-self: ${(props) => props.alignSelf};
`;

const StyledPanel = styled(Panel)`
  display: flex;
  flex-direction: column;
  box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
`;
