import { ScriptWiz, VM, VM_NETWORK, VM_NETWORK_VERSION } from "@script-wiz/lib";
import { Signatories } from "../models/Signatories";

export const bitcoinTemplateMaker = (unlocking_threshold: number, signatories: Signatories[]) => {
  const vm: VM = { network: VM_NETWORK.BTC, ver: VM_NETWORK_VERSION.TAPSCRIPT };

  const scriptWizard = new ScriptWiz(vm);
  noDegradeHeader(scriptWizard, unlocking_threshold);
  body(scriptWizard, signatories);
  footer(scriptWizard);

  scriptWizard.compile();
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

const body = (scriptWizard: ScriptWiz, signatories: Signatories[]) => {
  signatories.forEach((sign, index) => {
    scriptWizard.parseHex(sign[2][index], true, "");
    scriptWizard.parseOpcode("OP_CHECKSIG", false, "");
    scriptWizard.parseOpcode("OP_IF", false, "");
    scriptWizard.parseNumber(Number(sign[1][index]), false, "");
    scriptWizard.parseOpcode("OP_ELSE", false, "");
    scriptWizard.parseOpcode("OP_0", false, "");
    scriptWizard.parseOpcode("OP_ENDIF", false, "");
    scriptWizard.parseOpcode("OP_FROMALTSTACK", false, "");
    scriptWizard.parseOpcode("OP_ADD", false, "");
    scriptWizard.parseOpcode("OP_TOALTSTACK", false, "");
  });
};

const footer = (scriptWizard: ScriptWiz) => {
  scriptWizard.parseOpcode("OP_FROMALTSTACK", false, "");
  scriptWizard.parseOpcode("OP_FROMALTSTACK", false, "");
  scriptWizard.parseOpcode("OP_GREATERTHANOREQUAL", false, "");
};
