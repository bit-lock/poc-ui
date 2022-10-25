import React, { useEffect } from "react";
import { Web3Lib } from "../lib/Web3Lib";

export const Vaults = () => {
  useEffect(() => {
    const init = async () => {
      const web3Instance = new Web3Lib();

      const vaultCount = await web3Instance.getVaultLength();
      const fetchVaultPromises = [];
      const fetchSignatoriesPromises = [];

      for (let i = 0; i < vaultCount; i++) {
        fetchVaultPromises.push(web3Instance.getVaults(i));
        fetchSignatoriesPromises.push(web3Instance.getSignatories(i));
      }

      const vaults = await Promise.all(fetchVaultPromises);
      const signatories = await Promise.all(fetchSignatoriesPromises);

      const myAddresses: string[] = await window.ethereum.request({ method: "eth_requestAccounts" });
      const myCurrentAdress = myAddresses[0].toLowerCase();

      const accountVaultList = [];

      for (let z = 0; z < vaultCount; z++) {
        const currentVault = vaults[z];
        const currentSignatories = signatories[z][0].map((data: string) => data.toLowerCase());

        if (currentVault.initiator.toLowerCase() === myCurrentAdress) {
          accountVaultList.push({ id: z, vault: vaults[z], signatories: signatories[z], isMyOwner: true });
        } else if (currentSignatories.includes(myCurrentAdress)) {
          accountVaultList.push({ id: z, vault: vaults[z], signatories: signatories[z], isMyOwner: false });
        }
      }

      console.log(accountVaultList);
    };

    init();
  }, []);

  return <span>Vaults</span>;
};
