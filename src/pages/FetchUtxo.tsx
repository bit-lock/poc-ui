/* eslint-disable array-callback-return */
import React, { useState } from "react";
import { Button, Input, List, Loader } from "rsuite";
import styled from "styled-components";
import segwit_addr_ecc from "../lib/bitcoin/bech32/segwit_addr_ecc";
import { utils } from "@script-wiz/lib-core";
import { decode } from "bs58";
import { calculateTxFees, fetchUtxos } from "../lib/bitcoin/utils";
import { UTXO } from "../lib/models/UTXO";

export const FetchUtxo = () => {
  const [address, setAddress] = useState<string>("tb1prkzak825qdg3ngem6jeyadg99dml0ppqkg7tz7n24eq0kduk86js5xc8a4");
  const [destinationAddress, setDestinationAddress] = useState<string>("");
  const [utxoSets, setUtxoSets] = useState<UTXO[]>([]);
  const [loader, setLoader] = useState<boolean>(false);

  const getMyBalances = async () => {
    setLoader(true);

    const data = await fetchUtxos(address);

    setUtxoSets(data);

    setLoader(false);
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

  const test = async () => {
    const script =
      "7651876351b202c4096b676a68006b205d4a97906953d0d365e6a8bfa164b298cbabf5ef6711d1a233728060cb11fc5dac63024c1d6700686c936b2055faddcd69d4dff3485f45529eaaaf1a67093797e5fbf91fe24628694c46d7d8ac6302c4096700686c936b6c6ca2";
    const res = await calculateTxFees(utxoSets, 2, script);
    console.log(res);
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
            <StyledButton onClick={test}>Create Destination Pubkey</StyledButton>
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
