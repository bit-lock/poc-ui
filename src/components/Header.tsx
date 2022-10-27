import { Navbar, Nav } from "rsuite";
import HomeIcon from "@rsuite/icons/legacy/Home";
import { ROUTE_PATH } from "../routes/ROUTE_PATH";
import { useNavigate } from "react-router-dom";
export const Header = () => {
  const navigate = useNavigate();

  return (
    <Navbar>
      <Navbar.Brand>BTC Vault</Navbar.Brand>
      <Nav>
        <Nav.Item icon={<HomeIcon />} onClick={() => navigate(ROUTE_PATH.HOME)}>
          Home
        </Nav.Item>
        <Nav.Item onClick={() => navigate(ROUTE_PATH.CREATE_NEW_VAULT)}>New Vault</Nav.Item>
        <Nav.Item onClick={() => navigate(ROUTE_PATH.VAULTS)}>Vaults</Nav.Item>
        <Nav.Item onClick={() => navigate(ROUTE_PATH.VIEW_REQUESTS)}>View Requests</Nav.Item>
      </Nav>
    </Navbar>
  );
};
