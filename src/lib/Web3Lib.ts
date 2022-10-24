import { ethers } from "ethers";
import Web3 from "web3";
import BtcVault from "./contracts/BtcVault.json";

export class Web3Lib {
  private web3: Web3;
  private contract: any;

  constructor(account: string) {
    this.web3 = new Web3("https://goerli.infura.io/v3/6daf3c1cbd5f4b73ab52b2095dad73aa");

    // temp for test
    let mnemonic = "connect spice jar sadness tunnel blanket follow burst dwarf room hospital salt";
    let mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic);

    this.web3.eth.accounts.wallet.add(mnemonicWallet.privateKey);

    this.initContract();

    console.log(this.getSignatories("0xbae7c63eee908d136c6df56f4fba9805e7bc29c5cd304a2f0e8bcabe812d81e0"));
  }

  private initContract = () => {
    this.contract = new this.web3.eth.Contract(BtcVault.abi as any, BtcVault.address);
  };

  initialVault = async (address: string) => {
    const name = "Satoshi's Vault";
    const threshold = 30;
    const signatories = Array.from({ length: 2 }, () => ethers.Wallet.createRandom().address);
    const shares = Array.from({ length: 2 }, () => Math.floor(Math.random() * 100));

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
