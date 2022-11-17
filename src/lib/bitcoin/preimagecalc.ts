import { UTXO } from "../models/UTXO";
import WizData, { hexLE } from "@script-wiz/wiz-data";
import { convertion, crypto, utils, taproot } from "@script-wiz/lib-core";
import { createDestinationPubkey } from "./utils";

// amount satoshi
export const calculateSighashPreimage = (utxoSet: UTXO[], feeGap: number, vaultAddress: string, destinationScriptPubkey: string, amount: number, script: string) => {
  const sighashPreimage: string[] = [];

  let hasChange: boolean = true;

  const { scriptPubkey: vaultScriptPubkey } = createDestinationPubkey(vaultAddress);

  if (feeGap < 1000) {
    hasChange = false;
  }

  utxoSet.forEach((utxo: UTXO, index) => {
    let value = "";

    value += "00000200000000000000";

    // console.log("1", value);

    value += calculatePrevouts(utxoSet); //sha prevouts

    // console.log("2", calculatePrevouts(utxoSet));

    value += calculateShaAmounts(utxoSet); //prevvaules

    // console.log("3", calculateShaAmounts(utxoSet));

    value += calculateScriptPubkeys(utxoSet, vaultScriptPubkey); // sha prevscriptpubkeys

    // console.log("4", calculateScriptPubkeys(utxoSet, vaultScriptPubkey));

    value += calculateShaSequences(utxoSet); // sha sequences

    // console.log("5", calculateShaSequences(utxoSet));

    value += calculateShaOutputs(feeGap, hasChange, vaultScriptPubkey, destinationScriptPubkey, amount); //sha outs

    // console.log("6", calculateShaOutputs(feeGap, hasChange, vaultScriptPubkey, destinationScriptPubkey, amount));

    value += "02"; //spend type

    // console.log("7", "02");

    value += convertion.convert32(WizData.fromNumber(index)).hex; // input index

    // console.log("8", convertion.convert32(WizData.fromNumber(index)).hex);

    value += taproot.tapLeaf(WizData.fromHex(script), "c0"); //tapleaf

    // console.log("9", taproot.tapLeaf(WizData.fromHex(script), "c0"));

    value += "00"; //key version

    // console.log("10", "00");

    value += "ffffffff"; //codesep position

    // console.log("11", "ffffffff");

    sighashPreimage.push(value);
  });

  // console.log("sighashPreimage", sighashPreimage);

  return sighashPreimage;
};

export const calculatePrevouts = (utxoSet: UTXO[]) => {
  let hashInputs = "";

  utxoSet.forEach((input: UTXO) => {
    const vout = convertion.numToLE32(WizData.fromNumber(Number(input.vout))).hex;

    hashInputs += WizData.fromHex(hexLE(input.txId) + vout).hex;
  });

  // console.log("prevouts", hashInputs);

  return crypto.sha256(WizData.fromHex(hashInputs)).toString();
};

export const calculateShaAmounts = (utxoSet: UTXO[]) => {
  let inputAmounts = "";

  utxoSet.forEach((input: UTXO) => {
    inputAmounts += convertion.numToLE64(WizData.fromNumber(Number(input.value) * 100000000)).hex;
  });

  // console.log("sha amoutns", inputAmounts);

  return crypto.sha256(WizData.fromHex(inputAmounts)).toString();
};

export const calculateScriptPubkeys = (utxoSet: UTXO[], scriptPubkey: string) => {
  let inputScriptPubkeys = "";

  utxoSet.forEach(() => {
    inputScriptPubkeys += utils.compactSizeVarIntData(scriptPubkey);
  });

  // console.log("script pub keys", inputScriptPubkeys);

  return crypto.sha256(WizData.fromHex(inputScriptPubkeys)).toString();
};

export const calculateShaSequences = (utxoSet: UTXO[]) => {
  let inputSequences = "";

  utxoSet.forEach(() => {
    inputSequences += "01000000";
  });

  // console.log("sequences", inputSequences);

  return crypto.sha256(WizData.fromHex(inputSequences)).toString();
};

export const calculateShaOutputs = (feeGap: number, hasChange: boolean, vaultScriptPubkey: string, destinationScriptPubkey: string, amount: number) => {
  let outputs = "";

  const destinationAmount = convertion.numToLE64(WizData.fromNumber(Number(amount))).hex;

  outputs += destinationAmount;

  outputs += utils.compactSizeVarIntData(destinationScriptPubkey);

  if (hasChange) {
    const feeGapAmount = convertion.numToLE64(WizData.fromNumber(Number(feeGap))).hex;

    outputs += feeGapAmount;
    outputs += utils.compactSizeVarIntData(vaultScriptPubkey);
  }

  // console.log("line 100 : ", outputs);

  return crypto.sha256(WizData.fromHex(outputs)).toString();
};

export const signPreimages = (privateKey: string, preImages: string[]) => {
  const signs = preImages.map((preImage) => {
    return crypto.schnorrSign(WizData.fromHex(preImage), WizData.fromHex(privateKey)).sign.hex;
  });

  return signs;
};
