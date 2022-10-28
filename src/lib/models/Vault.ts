import { Signatories } from "./Signatories";
import { VaultDetail } from "./VaultDetail";

export type Vault = {
  id: number;
  isMyOwner: boolean;
  signatories: Signatories;
  vault: VaultDetail;
};
