import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "rsuite";
import styled from "styled-components";
import { ROUTE_PATH } from "../routes/ROUTE_PATH";

function Home() {
  const navigate = useNavigate();
  return (
    <Wrapper>
      <span> Welcome To BTC Vault</span>
      <StyledButton onClick={() => navigate(ROUTE_PATH.VAULT)}>Vault Detail</StyledButton>
    </Wrapper>
  );
}

export default Home;

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
  text-align: center;
  color: #f4bf75;
  font-size: 1.2rem;
`;

const StyledButton = styled(Button)`
  height: 45px;
  width: 100%;
  margin: auto;
`;
