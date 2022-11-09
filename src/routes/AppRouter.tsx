import React, { useEffect, useState } from "react";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import { CreateNewVault } from "../pages/CreateNewVault";
import { Home } from "../pages/Home";
import { Vaults } from "../pages/Vaults";
import { ROUTE_PATH } from "./ROUTE_PATH";
import { crypto } from "@script-wiz/lib-core";
import WizData from "@script-wiz/wiz-data";
import toastr from "toastr";
import { Loader } from "rsuite";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { ViewRequests } from "../pages/ViewRequests";
import { EditVault } from "../pages/EditVault";
import { Header } from "../components/Header";

const message = "Sign this message to log into Bitlock interface.\nWARNING: Only sign this message when you're at bitlock.app.";

export const AppRouter = (): JSX.Element => {
  const [signature, setSignature] = useState<string>("");
  const [privateKey, setPrivateKey] = useState<string>();
  const [publicKey, setPublicKey] = useState<string>("");
  const [account, setAccount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const { getLocalData } = useLocalStorage<any>("bitlock");
  const localData = getLocalData();

  const { setLocalData } = useLocalStorage<any>("bitlock");

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum
        .enable()
        .then(() => {
          window.ethereum.request({ method: "eth_requestAccounts" }).then((accounts: Array<string>) => {
            if (!localData) {
              window.ethereum
                .request({ method: "personal_sign", params: [message, accounts[0]] })
                .then((sgntr: string) => {
                  createKeys(sgntr, accounts[0]);
                  setLocalData({ personel_sign: true, signature: sgntr, account: accounts[0] });
                  setLoading(false);
                })
                .catch((err: any) => toastr.error(err.message));
            } else {
              createKeys(localData.signature, localData.account);
              setLoading(false);
            }
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
  }, [localData, setLocalData]);

  useEffect(() => {
    window.ethereum.on("accountsChanged", (accounts: any) => {
      window.ethereum
        .request({ method: "personal_sign", params: [message, accounts[0]] })
        .then((sgntr: string) => {
          console.log(sgntr, "sss");
          createKeys(sgntr, accounts[0]);
          setLocalData({ personel_sign: true, signature: sgntr, account: accounts[0] });
          setLoading(false);
        })
        .catch((err: any) => toastr.error(err.message));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const Layout = () => (
    <>
      <Header />
      <Outlet />
    </>
  );

  const router = createBrowserRouter([
    {
      element: <Layout />,
      children: [
        {
          path: ROUTE_PATH.HOME,
          element: <Home />,
        },
        {
          path: ROUTE_PATH.VAULTS,
          element: <Vaults account={account} />,
        },
        {
          path: ROUTE_PATH.CREATE_NEW_VAULT,
          element: <CreateNewVault account={account} />,
        },
        {
          path: ROUTE_PATH.VIEW_REQUESTS,
          element: <ViewRequests account={account} publicKey={publicKey} />,
        },
        {
          path: ROUTE_PATH.EDIT_SIGNATORIES,
          element: <EditVault account={account} />,
        },
      ],
    },

    // {
    //   path: ROUTE_PATH.FETCH_UTXO,
    //   element: <FetchUtxo />,
    // },
  ]);

  return <>{loading ? <Loader backdrop content="Waiting Confirm..." vertical /> : <RouterProvider router={router} />}</>;
};
