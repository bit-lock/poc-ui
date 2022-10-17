/* eslint-disable array-callback-return */
import React, { useEffect, useState } from "react";
import { esploraClient, init, TxDetail } from "@bitmatrix/esplora-api-client";
import { Button, Input, List, Loader } from "rsuite";
import styled from "styled-components";
import toastr from "toastr";

export const FetchUtxo = () => {
  const [address, setAddress] = useState<string>("tb1qqy3k9ynmt0emvrjg3smhsku86hgflu3sk422y86qz5luvdfnkw2qzq6sgr");
  const [utxoSets, setUtxoSets] = useState<Array<{ txId: string; vout: number; value: number }>>([]);
  const [loader, setLoader] = useState<boolean>(false);

  useEffect(() => {
    init("https://blockstream.info/testnet/api");
  }, []);

  const getMyBalances = async () => {
    setLoader(true);

    let myUtxoSets: { txId: string; vout: number; value: number }[] = [];
    let txs: TxDetail[] = [];

    try {
      txs = await esploraClient.addressTxs(address);
    } catch (err: any) {
      toastr.error(err.response.data);
    }

    if (txs.length > 0) {
      const myPromises = txs.map((tx) => {
        return esploraClient.txOutspends(tx.txid);
      });

      Promise.all(myPromises)
        .then((myProm) => {
          myProm.forEach((os, index) => {
            const tx = txs[index];

            const unSpentIndexs = os
              .map((outspend, index: number) => {
                if (!outspend.spent) {
                  return index;
                }
              })
              .filter((dt) => dt !== undefined);

            if (unSpentIndexs.length > 0) {
              unSpentIndexs.forEach((us) => {
                if (us !== undefined) {
                  if (tx.vout[us].scriptpubkey_address === address) {
                    myUtxoSets.push({ txId: tx.txid, vout: us, value: (tx.vout[us].value || 0) / 100000000 });
                  }
                }
              });
            }
          });
        })
        .finally(() => {
          setUtxoSets(myUtxoSets);
          setLoader(false);
        });
    } else {
      setLoader(false);
    }
  };

  return (
    <Wrapper>
      {loader ? (
        <Loader backdrop content="loading..." vertical />
      ) : (
        <>
          <FromContainer>
            <Input value={address} onChange={(value) => setAddress(value)} />
            <StyledButton onClick={getMyBalances}>Get My UTXOS</StyledButton>
          </FromContainer>

          {utxoSets.length > 0 && (
            <>
              <List>
                {utxoSets.map((utxo) => {
                  return (
                    <>
                      <List.Item>
                        Tx Id: {utxo.txId} Value: {utxo.value.toFixed(8)} Outspend Index: {utxo.vout}
                      </List.Item>
                    </>
                  );
                })}
              </List>
            </>
          )}
        </>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.section`
  padding: 2em;
  display: flex;
  justify-content: normal;
  width: 65%;
  border: 1px solid gray;
  border-radius: 10px;
  height: 65vh;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  flex-direction: column;
`;

const StyledButton = styled(Button)`
  margin: auto 15px;
`;

const FromContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 12vh;
`;
