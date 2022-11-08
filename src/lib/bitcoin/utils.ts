import { UTXO } from "../models/UTXO";
import axios from "axios";
import { RecommendedFee } from "../models/RecommendedFee";
import WizData from "@script-wiz/wiz-data";

const recomommendedFee = async () => {
  return axios.get<RecommendedFee>("https://mempool.space/api/v1/fees/recommended").then((response) => {
    return response.data;
  });
};

export const calculateTxFees = async (utxos: UTXO[], minimumSignatoryCount: number, template: string) => {
  const totalUtxoCount = utxos.length;
  const templateByteSize = WizData.fromHex(template).bytes.byteLength;
  console.log(templateByteSize);
  const fee = await recomommendedFee();

  const formula = (40 * totalUtxoCount + 16 * totalUtxoCount * minimumSignatoryCount + 10 + 8 + (templateByteSize * totalUtxoCount) / 4 + 87) * fee.fastestFee;

  return Math.round(formula);
};
