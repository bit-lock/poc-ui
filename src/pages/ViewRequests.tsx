import React, { useEffect, useState } from "react";
import { Button, Container, Content, FlexboxGrid, Loader, Panel } from "rsuite";
import styled from "styled-components";
import { VaultState } from "../lib/models/VaultState";
import { Web3Lib } from "../lib/Web3Lib";

type Props = {
  account: string;
  publicKey: string;
};

export const ViewRequests: React.FC<Props> = ({ account, publicKey }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [approveRequestList, setApproveRequestList] = useState<VaultState[]>([]);
  const [finalizeRequestList, setFinalizeRequestList] = useState<VaultState[]>([]);

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
          accountVaultList.push({ id: z, vault: vaults[z], signatories: signatories[z], isMyOwner: true, minimumSignatoryCount: 0 });
        } else if (currentSignatories.includes(myCurrentAdress)) {
          accountVaultList.push({ id: z, vault: vaults[z], signatories: signatories[z], isMyOwner: false, minimumSignatoryCount: 0 });
        }
      }

      const notFinalizedVaults = accountVaultList.filter((data) => data.vault.status === "0x00");

      const approveList: VaultState[] = notFinalizedVaults.filter((currentData) => {
        const signatoryAddressList = currentData.signatories[0];
        const myCurrentIndex = signatoryAddressList.findIndex((address: string) => address.toLowerCase() === myCurrentAdress);
        const signatoryPubKeyList = currentData.signatories[2];

        if (signatoryPubKeyList[myCurrentIndex] !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
          return false;
        } else {
          return true;
        }
      });

      setApproveRequestList(approveList);

      const waitingFinalizeList = notFinalizedVaults.filter((data) => {
        if (data.isMyOwner) {
          const signatories = data.signatories[2];
          return !signatories.some((element: string) => {
            return element === "0x0000000000000000000000000000000000000000000000000000000000000000";
          });
        } else {
          return false;
        }
      });

      setFinalizeRequestList(waitingFinalizeList);
      setLoading(false);
    };

    init();
  }, [account]);

  const approveSignatory = async (id: number) => {
    setLoading(true);
    const web3Instance = new Web3Lib();
    await web3Instance.approveSignatory(id, "0x" + publicKey, account);
    setLoading(false);
  };

  const finalizeVault = async (id: number) => {
    setLoading(true);
    const web3Instance = new Web3Lib();
    await web3Instance.finalizeVault(id, account);
    setLoading(false);
  };

  if (loading) {
    return <Loader backdrop content="Fetching requests..." vertical />;
  }

  return (
    <Container>
      <Content>
        <StyledBox justify="center">
          <StyledBoxItem colspan={12}>
            <Panel>
              {approveRequestList.length !== 0 && (
                <>
                  <Text>Vault Approve Requests</Text>
                  <RequestList>
                    {approveRequestList.map((data) => {
                      return (
                        <RequestItem key={data.id}>
                          <Text>{data.vault.name}</Text>
                          <ButtonGroup>
                            <StyledButton appearance="link" active color="blue" onClick={() => approveSignatory(data.id)}>
                              Accept
                            </StyledButton>
                            <StyledButton appearance="link" active color="red">
                              Decline
                            </StyledButton>
                          </ButtonGroup>
                        </RequestItem>
                      );
                    })}
                  </RequestList>
                </>
              )}

              {finalizeRequestList.length !== 0 && (
                <>
                  <Text>Vault Finalize Requests</Text>
                  <RequestList>
                    {finalizeRequestList.map((data) => {
                      return (
                        <RequestItem key={data.id}>
                          <Text>{data.vault.name}</Text>
                          <ButtonGroup>
                            <StyledButton appearance="link" active text_color="blue" onClick={() => finalizeVault(data.id)}>
                              Finalize
                            </StyledButton>
                          </ButtonGroup>
                        </RequestItem>
                      );
                    })}
                  </RequestList>
                </>
              )}
              {approveRequestList.length === 0 && finalizeRequestList.length === 0 && <Text fontSize="18px">No Data</Text>}
            </Panel>
          </StyledBoxItem>
        </StyledBox>
      </Content>
    </Container>
  );
};

interface StyleProps {
  fontSize?: string;
  alignSelf?: string;
  color?: string;
}

const StyledBox = styled(FlexboxGrid)`
  position: absolute;
  top: 50px;
  bottom: 0;
  width: 100%;
`;

const Text = styled.span<StyleProps>`
  font-size: ${(props) => (props.fontSize ? props.fontSize : "16px")};
  font-weight: 600;
  color: #6c6b6b;
  align-self: center;
`;

const RequestItem = styled.div`
  border: none;
  width: 100%;
  background: #d0cece;
  height: 50px;
  display: flex;
  align-items: center;
  padding: 1rem;
  margin: 0.5rem 0;
  justify-content: space-between;
`;

const StyledBoxItem = styled(FlexboxGrid.Item)`
  margin: auto;
  background: white;
  border-radius: 8px;
  min-height: 65vh;
  max-height: 65vh;
  width: 60%;
  overflow-y: scroll;
`;

const ButtonGroup = styled.div``;

const RequestList = styled.div`
  overflow-y: scroll;
  margin: 4px 0;
  max-height: max-content;
`;

const StyledButton = styled(Button)<StyleProps>`
  color: ${(props) => (props.color ? props.color : "gray")} !important;
`;
