import { Navbar, Nav } from "rsuite";
import { useNavigate } from "react-router-dom";
import { ROUTE_PATH } from "../routes/ROUTE_PATH";
import VaultIcon from "../Svg/Icons/VaultIcon";

export const Header = () => {
  const navigate = useNavigate();

  return (
    <Navbar>
      <div style={{ display: "flex" }}>
        <VaultIcon />
        <Navbar.Brand>BTC Vault</Navbar.Brand>
        <Nav>
          <Nav.Item onClick={() => navigate(ROUTE_PATH.HOME)}>Home</Nav.Item>
          <Nav.Item onClick={() => navigate(ROUTE_PATH.CREATE_NEW_VAULT)}>New Vault</Nav.Item>
          <Nav.Item onClick={() => navigate(ROUTE_PATH.VAULTS)}>Vaults</Nav.Item>
          <Nav.Item onClick={() => navigate(ROUTE_PATH.VIEW_REQUESTS)}>View Requests</Nav.Item>
        </Nav>
      </div>
    </Navbar>
  );
};
