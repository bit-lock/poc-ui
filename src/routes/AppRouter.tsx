import React, { useEffect, useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CreateNewVault } from "../pages/CreateNewVault";
import { FetchUtxo } from "../pages/FetchUtxo";
import { Home } from "../pages/Home";
import { Vaults } from "../pages/Vaults";
import { ROUTE_PATH } from "./ROUTE_PATH";
import { crypto } from "@script-wiz/lib-core";
import WizData from "@script-wiz/wiz-data";
import toastr from "toastr";
import { Loader } from "rsuite";

const message = "Sign this message to log into Bitlock interface.WARNING: Only sign this message when you're at bitlock.app.";

export const AppRouter = (): JSX.Element => {
  const [signature, setSignature] = useState<string>("");
  const [privateKey, setPrivateKey] = useState<string>();
  const [publicKey, setPublicKey] = useState<string>();
  const [account, setAccount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum
        .enable()
        .then(() => {
          window.ethereum.request({ method: "eth_requestAccounts" }).then((accounts: Array<string>) => {
            window.ethereum
              .request({ method: "personal_sign", params: [message, accounts[0]] })
              .then((sgntr: string) => {
                createKeys(sgntr, accounts[0]);
                setLoading(false);
              })
              .catch((err: any) => toastr.error(err.message));
          });
        })
        .catch((error: any) => {
          if (error.code === 4001) {
            toastr.error("Please connect to MetaMask.");
          } else {
            toastr.error(error.response.data);
          }
        });
    } else {
      window.open("https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en");
    }
  }, []);

  const createKeys = (signature: string, account: string) => {
    try {
      const withoutPrefixSignature = signature.slice(2);
      const prvKey = crypto.sha256(WizData.fromHex(withoutPrefixSignature)).toString();

      const keys = crypto.schnorrCreatePublicKey(WizData.fromHex(prvKey));

      setSignature(withoutPrefixSignature);
      setPrivateKey(prvKey);
      setPublicKey(keys.publicKey.hex);
      setAccount(account);
    } catch (err: any) {
      toastr.error(err);
    }
  };

  const router = createBrowserRouter([
    {
      path: ROUTE_PATH.HOME,
      element: <Home />,
    },
    {
      path: ROUTE_PATH.VAULTS,
      element: <Vaults />,
    },
    {
      path: ROUTE_PATH.CREATE_NEW_VAULT,
      element: <CreateNewVault account={account} />,
    },
    {
      path: ROUTE_PATH.FETCH_UTXO,
      element: <FetchUtxo />,
    },
  ]);

  return <>{loading ? <Loader backdrop content="Waiting Confirm..." vertical /> : <RouterProvider router={router} />}</>;
};
