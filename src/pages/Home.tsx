import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "rsuite";
import styled from "styled-components";
import { ROUTE_PATH } from "../routes/ROUTE_PATH";

export const Home = () => {
  const navigate = useNavigate();

  return (
    <Wrapper>
      <StyledButton onClick={() => navigate(ROUTE_PATH.CREATE_NEW_VAULT)}>Create New Vault</StyledButton>
      <StyledButton onClick={() => navigate(ROUTE_PATH.VAULTS)}>View Vaults</StyledButton>
      <StyledButton disabled>View Requests</StyledButton>
      <StyledButton onClick={() => navigate(ROUTE_PATH.FETCH_UTXO)}>Fetch UTXO</StyledButton>
    </Wrapper>
  );
};

const Wrapper = styled.section`
  padding: 4em;
  display: flex;
  justify-content: center;
  width: 65%;
  border: 1px solid gray;
  border-radius: 10px;
  height: 45vh;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  flex-direction: column;
`;

const StyledButton = styled(Button)`
  height: 45px;
  width: 100%;
  margin: auto;
`;
