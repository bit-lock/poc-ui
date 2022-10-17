import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CreateNewVault } from "../pages/CreateNewVault";
import { FetchUtxo } from "../pages/FetchUtxo";
import Vault from "../pages/Vault";
import { ROUTE_PATH } from "./ROUTE_PATH";

export const AppRouter = (): JSX.Element => {
  const router = createBrowserRouter([
    {
      path: ROUTE_PATH.HOME,
      element: <Vault />,
    },
    {
      path: ROUTE_PATH.VAULT,
      element: <Vault />,
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
