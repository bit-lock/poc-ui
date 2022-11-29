/* eslint-disable array-callback-return */
import { UTXO } from "../models/UTXO";
import axios from "axios";
import { RecommendedFee } from "../models/RecommendedFee";
import WizData, { hexLE } from "@script-wiz/wiz-data";
import { esploraClient, init, TxDetail } from "@bitmatrix/esplora-api-client";
import segwit_addr_ecc from "./bech32/segwit_addr_ecc";
import { utils, arithmetics64, convertion, crypto } from "@script-wiz/lib-core";
import { decode } from "bs58";

const recomommendedFee = async () => {
  return axios.get<RecommendedFee>("https://mempool.space/testnet/api/v1/fees/recommended").then((response) => {
    return response.data;
  });
};

export const fetchUtxos = async (address: string): Promise<UTXO[]> => {
  init("https://blockstream.info/testnet/api");

  let myUtxoSets: UTXO[] = [];
  let allTxs: TxDetail[] = [];

  try {
    allTxs = await esploraClient.addressTxs(address);
  } catch (err: any) {
    toastr.error(err.response.data);
  }

  const confirmedTxs = allTxs;

  if (confirmedTxs.length > 0) {
    const myPromises = confirmedTxs.map((tx) => {
      return esploraClient.txOutspends(tx.txid);
    });

    return Promise.all(myPromises).then((myProm) => {
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

      const myFinalUtxos = myUtxoSets.map((value, index) => {
        return { data: crypto.sha256v2(WizData.fromHex(value.txId + convertion.convert32(WizData.fromNumber(value.vout)).hex)), index };
      });

      const sortedUtxos = myFinalUtxos.sort((a, b) => lexicographical(a.data, b.data));

      const finalData = sortedUtxos.map((data) => myUtxoSets[data.index]);

      return finalData;
    });
  }

  return myUtxoSets;
};

export const calculateTxFees = async (utxos: UTXO[], minimumSignatoryCount: number, template: string) => {
  const totalUtxoCount = utxos.length;
  const templateByteSize = WizData.fromHex(template).bytes.byteLength;
  const fee = await recomommendedFee();

  const formula = (40 * totalUtxoCount + 16 * totalUtxoCount * minimumSignatoryCount + 10 + 8 + (templateByteSize * totalUtxoCount) / 4 + 87) * fee.fastestFee;

  return Math.round(formula);
};

export const createDestinationPubkey = (destinationAddress: string) => {
  if (destinationAddress === "") return { errorMessage: "", scriptPubkey: "" };
  const res = segwit_addr_ecc.check(destinationAddress, ["bc", "tb"]);

  let scriptPubkey = "";

  try {
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

      if (data.byteLength === 25) {
        const editedData = data.slice(1, 21);
        const validData = data.slice(0, 21);

        const editedDataDoubleHash = crypto.hash256(WizData.fromBytes(validData)).toString();
        const doubleHashFirst4Byte = editedDataDoubleHash.substring(0, 8);
        const dataLast4byte = Buffer.from(data.slice(21)).toString("hex");

        if (doubleHashFirst4Byte === dataLast4byte) {
          if (data[0] === 111 || data[0] === 0) {
            scriptPubkey = "76a914" + Buffer.from(editedData).toString("hex") + "88ac";
          } else if (data[0] === 196 || data[0] === 5) {
            scriptPubkey = "a914" + Buffer.from(editedData).toString("hex") + "87";
          } else {
            return { errorMessage: "Invalid address", scriptPubkey: "" };
          }
        } else {
          return { errorMessage: "Invalid address", scriptPubkey: "" };
        }
      } else {
        return { errorMessage: "Invalid address", scriptPubkey: "" };
      }
    }
  } catch {
    return { errorMessage: "Invalid address", scriptPubkey: "" };
  }

  return { errorMessage: "", scriptPubkey };
};

export const bitcoinBalanceCalculation = (utxos: UTXO[]) => {
  if (utxos.length > 0) {
    const balances = utxos.map((utxo) => utxo.value);

    const initialValue = 0;
    return balances.reduce((previousValue, currentValue) => previousValue + currentValue, initialValue);
  }

  return 0;
};

export const lexicographical = (aTx: string, bTx: string): number => {
  if (aTx.length !== 64 || bTx.length !== 64) throw new Error("Lexicographical error. Wrong length tx ids: " + aTx + "," + bTx);

  const a = hexLE(aTx.substring(48));
  const b = hexLE(bTx.substring(48));

  return arithmetics64.greaterThan64(WizData.fromHex(a), WizData.fromHex(b)).number === 1 ? 1 : -1;
};

export const convertTo35Byte = (hex: string) => {
  const hexByteLegth = hex.length / 2;

  return hex + "00".repeat(35 - hexByteLegth);
};

export const BITCOIN_PER_SATOSHI = 100000000;
