import { ScriptWiz, VM, VM_NETWORK, VM_NETWORK_VERSION } from "@script-wiz/lib";
import { taproot, TAPROOT_VERSION } from "@script-wiz/lib-core";
import WizData from "@script-wiz/wiz-data";
import { Signatories } from "../models/Signatories";

export const bitcoinTemplateMaker = (unlocking_threshold: number, signatories: Signatories) => {
  const vm: VM = { network: VM_NETWORK.BTC, ver: VM_NETWORK_VERSION.TAPSCRIPT };

  const scriptWizard = new ScriptWiz(vm);
  noDegradeHeader(scriptWizard, unlocking_threshold);
  body(scriptWizard, signatories);
  footer(scriptWizard);

  const script = scriptWizard.compile();

  const innerkey = "1dae61a4a8f841952be3a511502d4f56e889ffa0685aa0098773ea2d4309f624";

  const result = taproot.tapRoot(WizData.fromHex(innerkey), [WizData.fromHex(script.substring(2))], TAPROOT_VERSION.BITCOIN);

  return { script, address: result.address.testnet };
};

const noDegradeHeader = (scriptWizard: ScriptWiz, unlocking_threshold: number) => {
  scriptWizard.parseOpcode("OP_DUP", false, "");
  scriptWizard.parseOpcode("OP_1", false, "");
  scriptWizard.parseOpcode("OP_EQUAL", false, "");
  scriptWizard.parseOpcode("OP_IF", false, "");
  scriptWizard.parseOpcode("OP_1", false, "");
  scriptWizard.parseOpcode("OP_CHECKSEQUENCEVERIFY", false, "");
  scriptWizard.parseNumber(unlocking_threshold, true, "");
  scriptWizard.parseOpcode("OP_TOALTSTACK", false, "");
  scriptWizard.parseOpcode("OP_ELSE", false, "");
  scriptWizard.parseOpcode("OP_RETURN", false, "");
  scriptWizard.parseOpcode("OP_ENDIF", false, "");
  scriptWizard.parseOpcode("OP_0", false, "");
  scriptWizard.parseOpcode("OP_TOALTSTACK", false, "");
};

const body = (scriptWizard: ScriptWiz, signatories: Signatories) => {
  const loopIndex = signatories[0].length;

  for (let index = 0; index < loopIndex; index++) {
    scriptWizard.parseHex(signatories[2][index].substring(2), true, "");
    scriptWizard.parseOpcode("OP_CHECKSIG", false, "");
    scriptWizard.parseOpcode("OP_IF", false, "");
    scriptWizard.parseNumber(Number(signatories[1][index]), true, "");
    scriptWizard.parseOpcode("OP_ELSE", false, "");
    scriptWizard.parseOpcode("OP_0", false, "");
    scriptWizard.parseOpcode("OP_ENDIF", false, "");
    scriptWizard.parseOpcode("OP_FROMALTSTACK", false, "");
    scriptWizard.parseOpcode("OP_ADD", false, "");
    scriptWizard.parseOpcode("OP_TOALTSTACK", false, "");
  }
};

const footer = (scriptWizard: ScriptWiz) => {
  scriptWizard.parseOpcode("OP_FROMALTSTACK", false, "");
  scriptWizard.parseOpcode("OP_FROMALTSTACK", false, "");
  scriptWizard.parseOpcode("OP_GREATERTHANOREQUAL", false, "");
};
