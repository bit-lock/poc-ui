import Web3 from "web3";
import BtcVault from "./contracts/BtcVault.json";
import toastr from "toastr";
import { VaultContract } from "./models/VaultContract";
import { Signatories } from "./models/Signatories";

export class Web3Lib {
  private web3: Web3;
  private contract: any;

  constructor() {
    this.web3 = new Web3(window.ethereum);

    this.initContract();
  }

  private initContract = () => {
    this.contract = new this.web3.eth.Contract(BtcVault.abi as any, BtcVault.address);
  };

  initialVault = async (address: string, name: string, threshold: number, signatories: string[], shares: number[]) => {
    const gasPrice = await this.web3.eth.getGasPrice();

    const vaultFunction = this.contract.methods.initializeVault(name, Math.floor(threshold), signatories, shares);

    const gasAmount = await vaultFunction.estimateGas({ from: address });

    return vaultFunction
      .send({ from: address, gasLimit: gasAmount, gasPrice })
      .on("transactionHash", function (hash: string) {
        toastr.success(hash, "Vault creation success.");
        Promise.resolve();
      })
      .on("error", console.error);
  };

  getVaultLength = async (): Promise<number> => {
    return this.contract.methods.getVaultLength().call();
  };

  getVaults = async (id: number): Promise<VaultContract> => {
    return this.contract.methods.vaults(id).call();
  };

  getSignatories = async (id: number): Promise<Signatories> => {
    return this.contract.methods.getSignatories(id).call();
  };

  approveSignatory = async (id: number, pubkey: string, address: string): Promise<string> => {
    const gasPrice = await this.web3.eth.getGasPrice();

    const vaultFunction = this.contract.methods.approveSignatory(id, pubkey);

    const gasAmount = await vaultFunction.estimateGas({ from: address });

    return vaultFunction
      .send({ from: address, gasLimit: gasAmount, gasPrice })
      .on("transactionHash", function (hash: string) {
        toastr.success(hash, "Appromevent success.");
      })
      .on("error", console.error);
  };

  finalizeVault = async (id: number, address: string): Promise<string> => {
    const gasPrice = await this.web3.eth.getGasPrice();

    const vaultFunction = this.contract.methods.finalizeVault(id);

    const gasAmount = await vaultFunction.estimateGas({ from: address });

    return vaultFunction
      .send({ from: address, gasLimit: gasAmount, gasPrice })
      .on("transactionHash", function (hash: string) {
        toastr.success(hash, "Finalized success.");
      })
      .on("error", console.error);
  };

  editSignatories = async (id: number, signatories: string[], shares: number[], address: string): Promise<string> => {
    const gasPrice = await this.web3.eth.getGasPrice();

    const vaultFunction = this.contract.methods.editSignatories(id, signatories, shares);

    const gasAmount = await vaultFunction.estimateGas({ from: address });

    return vaultFunction
      .send({ from: address, gasLimit: gasAmount, gasPrice })
      .on("transactionHash", function (hash: string) {
        toastr.success(hash, "Signatories edited successfully.");
        Promise.resolve();
      })
      .on("error", console.error);
  };
}
