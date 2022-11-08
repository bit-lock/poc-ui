import { UTXO } from "../models/UTXO";
import axios from "axios";
import { RecommendedFee } from "../models/RecommendedFee";
import WizData from "@script-wiz/wiz-data";
import { esploraClient, init, TxDetail } from "@bitmatrix/esplora-api-client";

const recomommendedFee = async () => {
  return axios.get<RecommendedFee>("https://mempool.space/api/v1/fees/recommended").then((response) => {
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

  const confirmedTxs = allTxs.filter((tx) => tx.status.confirmed);

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

      return myUtxoSets;
    });
  }

  return myUtxoSets;
};

export const calculateTxFees = async (utxos: UTXO[], minimumSignatoryCount: number, template: string) => {
  const totalUtxoCount = utxos.length;
  const templateByteSize = WizData.fromHex(template).bytes.byteLength;
  console.log(templateByteSize);
  const fee = await recomommendedFee();

  const formula = (40 * totalUtxoCount + 16 * totalUtxoCount * minimumSignatoryCount + 10 + 8 + (templateByteSize * totalUtxoCount) / 4 + 87) * fee.fastestFee;

  return Math.round(formula);
};
