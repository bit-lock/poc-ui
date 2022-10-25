import React, { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CreateNewVault } from "../pages/CreateNewVault";
import { FetchUtxo } from "../pages/FetchUtxo";
import { Home } from "../pages/Home";
import { Vaults } from "../pages/Vaults";
import { ROUTE_PATH } from "./ROUTE_PATH";

export const AppRouter = (): JSX.Element => {
  const { ethereum } = window;

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      ethereum
        .enable()
        .then(() => {
          console.log("connection success");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ethereum]);

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
      element: <CreateNewVault />,
    },
    {
      path: ROUTE_PATH.FETCH_UTXO,
      element: <FetchUtxo />,
    },
  ]);

  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
};
