import Web3 from "web3";
import BtcVault from "./contracts/BtcVault.json";

export class Web3Lib {
  private web3: Web3;
  private contract: any;

  constructor(ethereum: any) {
    this.web3 = new Web3(ethereum);

    this.initContract();
  }

  private initContract = () => {
    this.contract = new this.web3.eth.Contract(BtcVault.abi as any, BtcVault.address);
  };

  initialVault = async (address: string, name: string, threshold: number, signatories: string[], shares: number[]) => {
    const gasPrice = await this.web3.eth.getGasPrice();

    const vaultFunction = this.contract.methods.initializeVault(name, threshold, signatories, shares);

    const gasAmount = await vaultFunction.estimateGas({ from: address });

    return vaultFunction
      .send({ from: address, gasLimit: gasAmount, gasPrice })
      .on("transactionHash", function (hash: any) {
        console.log("hash", hash);
      })
      .on("error", console.error);
  };

  getVaultLength = async (): Promise<number> => {
    return this.contract.methods.getVaultLength().call();
  };

  getSignatories = async (id: string): Promise<any> => {
    return this.contract.methods.getSignatories(id).call();
  };
}
