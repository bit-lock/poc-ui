import React, { useCallback, useEffect, useState } from "react";
import { Button, Container, Content, FlexboxGrid, Loader, Panel } from "rsuite";
import styled from "styled-components";
import { bitcoinTemplateMaker } from "../lib/bitcoin/headerTemplate";
import { calculateSighashPreimage, signPreimages } from "../lib/bitcoin/preimagecalc";
import { bitcoinBalanceCalculation, BITCOIN_PER_SATOSHI, calculateTxFees, fetchUtxos } from "../lib/bitcoin/utils";
import { VaultState } from "../lib/models/VaultState";
import { calculateSignCount } from "../lib/utils";
import { Web3Lib } from "../lib/Web3Lib";

type Props = {
  account: string;
  publicKey: string;
  privateKey: string;
};

export const ViewRequests: React.FC<Props> = ({ account, publicKey, privateKey }) => {
  const [time, setTime] = useState(Date.now());
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [approveRequestList, setApproveRequestList] = useState<VaultState[]>([]);
  const [finalizeRequestList, setFinalizeRequestList] = useState<VaultState[]>([]);
  const [withdrawRequestList, setWithdrawRequestList] = useState<any>([]);

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 60000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const init = useCallback(async () => {
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
    const finalizedVaults = accountVaultList.filter((data) => data.vault.status === "0x01");

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

    const finalizedVaultPromises = finalizedVaults.map((fv) => web3Instance.nextProposalId(fv.id));

    const nextProposalIds = await Promise.all(finalizedVaultPromises);

    let preWithdrawRequestList: VaultState[] = [];

    finalizedVaults.forEach((fv, index) => {
      if (Number(nextProposalIds[index]) > 0) {
        let proposalIds: number[] = [];
        for (let i = 1; i <= nextProposalIds[index]; i++) {
          proposalIds.push(Number(i));
        }

        preWithdrawRequestList.push({ ...fv, proposalIds });
      }
    });

    let getWithdrawRequests: any = [];

    preWithdrawRequestList.forEach((pwr: VaultState) => {
      if (pwr.proposalIds) {
        for (let i = 1; i <= pwr.proposalIds?.length; i++) {
          getWithdrawRequests.push({
            proposalId: i - 1,
            data: pwr,
            promise: web3Instance.getWithdrawRequest(pwr.id, i),
            detailPromise: web3Instance.getWithdrawRequestSigs(pwr.id, i, account),
          });
        }
      }
    });

    const withdrawDetails = await Promise.all(getWithdrawRequests.map((gwp: any) => gwp.promise));
    const withdrawSigDetails = await Promise.all(getWithdrawRequests.map((gwp: any) => gwp.detailPromise));

    let finalWithdrawRequest: any = [];

    getWithdrawRequests.forEach((gwr: any, index: number) => {
      if (withdrawSigDetails[index].length === 0) {
        finalWithdrawRequest.push({ data: gwr.data, proposal: withdrawDetails[index], proposalId: gwr.proposalId });
      }
    });

    setWithdrawRequestList(finalWithdrawRequest);
    setLoading(false);
  }, [account]);

  useEffect(() => {
    init();
  }, [init, time]);

  const approveSignatory = async (id: number) => {
    setActionLoading(true);
    const web3Instance = new Web3Lib();
    await web3Instance.approveSignatory(id, "0x" + publicKey, account);
    await init();
    setActionLoading(false);
  };

  const finalizeVault = async (id: number) => {
    setActionLoading(true);
    const web3Instance = new Web3Lib();
    await web3Instance.finalizeVault(id, account);
    await init();
    setActionLoading(false);
  };

  const approveWithdrawal = async (data: any, proposalId: number) => {
    setActionLoading(true);
    const web3Instance = new Web3Lib();

    const { address, script } = bitcoinTemplateMaker(Number(data.data.vault.threshold), data.data.signatories);
    const utxos = await fetchUtxos(address);
    const balances = bitcoinBalanceCalculation(utxos);
    const vaultBalanceSats = balances * BITCOIN_PER_SATOSHI;

    const minimumSignatoryCount = calculateSignCount(data.data.vault, data.data.signatories);

    const fee = await calculateTxFees(utxos, minimumSignatoryCount, script.substring(2));

    const amountSats = Math.ceil(Number(data.proposal.amount));

    const feeGap = vaultBalanceSats - amountSats - fee;

    const preimages: string[] = calculateSighashPreimage(utxos, feeGap, address, data.proposal.scriptPubkey.substring(2), amountSats, script.substring(2));

    const signs = signPreimages(privateKey, preimages).map((res) => "0x" + res);

    await web3Instance.approveWithdrawal(data.data.id, proposalId, signs, account);
    await init();
    setActionLoading(false);
  };

  if (loading) {
    return <Loader backdrop content="Fetching requests..." vertical />;
  }

  if (actionLoading) {
    return <Loader backdrop content="Approve progressing..." vertical />;
  }

  console.log(withdrawRequestList);

  return (
    <Container>
      <Content>
        <StyledBox justify="center">
          <StyledBoxItem colspan={12}>
            <Panel>
              {approveRequestList.length !== 0 && (
                <>
                  <Text fontWeight="600">Vault Approve Requests</Text>
                  <RequestList>
                    {approveRequestList.map((data) => {
                      return (
                        <RequestItem key={data.id}>
                          <Text>{data.vault.name}</Text>
                          <ButtonGroup>
                            <StyledButton appearance="link" active color="#169de0" onClick={() => approveSignatory(data.id)}>
                              Accept
                            </StyledButton>
                            <StyledButton appearance="link" active color="#f44336">
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

              {withdrawRequestList.length !== 0 && (
                <>
                  <Text>Withdraw Requests</Text>
                  <RequestList>
                    {withdrawRequestList.map((withdraw: any, index: number) => {
                      return (
                        <RequestItem key={"withdraw" + index}>
                          <Text>
                            Vault Name: {withdraw.data.vault.name} , Amount : {withdraw.proposal.amount / BITCOIN_PER_SATOSHI}
                          </Text>
                          <ButtonGroup>
                            <StyledButton
                              appearance="link"
                              active
                              text_color="blue"
                              onClick={() => {
                                approveWithdrawal(withdraw, withdraw.proposalId);
                              }}
                            >
                              Approve Withdraw
                            </StyledButton>
                          </ButtonGroup>
                        </RequestItem>
                      );
                    })}
                  </RequestList>
                </>
              )}

              {approveRequestList.length === 0 && finalizeRequestList.length === 0 && withdrawRequestList.length === 0 && <Text fontSize="18px">You don't have any request</Text>}
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
  fontWeight?: string;
}

const StyledBox = styled(FlexboxGrid)`
  position: absolute;
  top: 50px;
  bottom: 0;
  width: 100%;
`;

const Text = styled.span<StyleProps>`
  font-size: ${(props) => (props.fontSize ? props.fontSize : "16px")};
  font-weight: ${(props) => (props.fontWeight ? props.fontWeight : "500")};
  color: #a4a9b3;
  align-self: center;
`;

const RequestItem = styled.div`
  border: none;
  width: 100%;
  background: #292d33;
  height: 50px;
  display: flex;
  align-items: center;
  padding: 1rem;
  margin: 0.5rem 0;
  justify-content: space-between;
`;

const StyledBoxItem = styled(FlexboxGrid.Item)`
  margin: auto;
  border-radius: 8px;
  min-height: 65vh;
  max-height: 65vh;
  width: 60%;
  overflow-y: scroll;
  border: 1px solid #292d33;
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
