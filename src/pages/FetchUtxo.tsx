/* eslint-disable array-callback-return */
import React, { useEffect, useState } from "react";
import { esploraClient, init, TxDetail } from "@bitmatrix/esplora-api-client";
import { Button, Input, List, Loader } from "rsuite";
import styled from "styled-components";
import toastr from "toastr";
import segwit_addr_ecc from "../lib/bitcoin/bech32/segwit_addr_ecc";
import { utils } from "@script-wiz/lib-core";
import { decode } from "bs58";

export const FetchUtxo = () => {
  const [address, setAddress] = useState<string>("");
  const [destinationAddress, setDestinationAddress] = useState<string>("tb1prkzak825qdg3ngem6jeyadg99dml0ppqkg7tz7n24eq0kduk86js5xc8a4");
  const [utxoSets, setUtxoSets] = useState<Array<{ txId: string; vout: number; value: number }>>([]);
  const [loader, setLoader] = useState<boolean>(false);

  useEffect(() => {
    init("https://blockstream.info/testnet/api");
  }, []);

  const getMyBalances = async () => {
    setLoader(true);

    let myUtxoSets: { txId: string; vout: number; value: number }[] = [];
    let allTxs: TxDetail[] = [];

    try {
      allTxs = await esploraClient.addressTxs(address);
    } catch (err: any) {
      toastr.error(err.response.data);
    }

    const confirmedTxs = allTxs.filter((tx) => tx.status.confirmed);

    if (confirmedTxs.length > 0) {
      const myPromises = confirmedTxs.map((tx) => {
        return esploraClient.txOutspends(tx.txid);
      });

      Promise.all(myPromises)
        .then((myProm) => {
          myProm.forEach((os, index) => {
            const tx = confirmedTxs[index];

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

  const createDestinationPubkey = () => {
    const res = segwit_addr_ecc.check(destinationAddress, ["bc", "tb"]);

    let scriptPubkey = "";

    if (res.program) {
      const result = res.program
        .map((byte) => {
          return ("0" + (byte & 0xff).toString(16)).slice(-2);
        })
        .join("");

      const versionPrefix = res.version === 1 ? "51" : "00";
      scriptPubkey = versionPrefix + utils.compactSizeVarIntData(result);
    } else {
      const data = decode(destinationAddress);
      console.log(data);
      const editedData = data.slice(1, 21);

      if (data[0] === 111 || data[0] === 0) {
        scriptPubkey = "76a914" + Buffer.from(editedData).toString("hex") + "88ac";
      } else if (data[0] === 196 || data[0] === 5) {
        scriptPubkey = "a914" + Buffer.from(editedData).toString("hex") + "87";
      }
    }

    return scriptPubkey;
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

          <FromContainer>
            <Input value={destinationAddress} onChange={(value) => setDestinationAddress(value)} />
            <StyledButton onClick={createDestinationPubkey}>Create Destination Pubkey</StyledButton>
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
