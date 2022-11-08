import { Signatories } from "./Signatories";
import { Vault } from "./Vault";

export type VaultState = {
  id: number;
  isMyOwner: boolean;
  signatories: Signatories;
  vault: Vault;
  bitcoin?: {
    address: string;
    balance: number;
  };
};
