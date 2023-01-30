/* eslint-disable no-throw-literal */
import React, { useState } from "react";
import { Button, Divider, Input, InputGroup, Radio, RadioGroup, Tooltip, Whisper } from "rsuite";

import CopyIcon from "../Svg/Icons/Copy";
import "./SignatureTool.scss";
import Web3 from "web3";
import secp256k1 from "secp256k1";
import WizData from "@script-wiz/wiz-data";

export const SignatureTool = () => {
  const [verifyResult, setVerifyResult] = useState<{ r: string; s: string; v: string; publickey: string }>();
  const [messageHash, setMessageHash] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [tab, setTab] = useState(0);

  const [privateKey, setPrivateKey] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [signatureResult, setSignatureResult] = useState<any>();

  const messageSign = () => {
    const web3 = new Web3();
    const res = web3.eth.accounts.sign(message, privateKey);
    setSignatureResult(res);
  };

  // const verify = () => {
  //   const web3 = new Web3();

  //   const res = web3.eth.accounts.recover("0x" + messageHash, "0x" + signature);
  //   console.log("address", res);
  // };

  const buf2hex = (buffer: Uint8Array) => {
    // buffer is an ArrayBuffer
    return [...new Uint8Array(buffer)].map((x) => x.toString(16).padStart(2, "0")).join("");
  };

  const ecrecover = () => {
    try {
      const v = signature.slice(128);

      const recovery = (WizData.fromHex(v).number || 0) - 27;

      if (recovery !== 0 && recovery !== 1) {
        throw new Error("Invalid signature v value");
      }

      console.log("signature", signature.slice(0, 128));
      const si = Buffer.from(signature.slice(0, 128), "hex");
      const m = Buffer.from(messageHash, "hex");
      const senderPubKey = secp256k1.ecdsaRecover(si, recovery, m);

      const pubkey = buf2hex(senderPubKey);
      const r = signature.slice(0, 64);
      const s = signature.slice(64, 128);

      setVerifyResult({ r, s, v, publickey: pubkey });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="signature-tools-page-main">
      <div className="signature-tools-page-item">
        <div className="signature-tools-page-tabs">
          <RadioGroup
            name="radioList"
            inline
            appearance="picker"
            defaultValue={tab}
            onChange={(value: any) => {
              setTab(Number(value));
            }}
          >
            <Radio value={0}>SIGNATURE</Radio>
            <Radio value={1}>VERIFY</Radio>
          </RadioGroup>
        </div>
        <div className="signature-tools-tab-item">
          <div className="signature-tools-result-text">
            {tab === 0 && (
              <>
                <div className="signature-tools-result-item">
                  <h6 className="signature-tools-tab-header">Private Key (hex)</h6>
                  <div>
                    <Input className="signature-tools-main-input" type="text" value={privateKey} onChange={(value: string) => setPrivateKey(value.replace(/\s/g, ""))} />
                  </div>
                </div>
                <div className="signature-tools-result-item">
                  <h6 className="signature-tools-tab-header">Message</h6>
                  <div>
                    <Input className="signature-tools-main-input" type="text" value={message} onChange={(value: string) => setMessage(value.replace(/\s/g, ""))} />
                  </div>
                </div>
                <Button className="signature-tools-button" appearance="primary" size="md" onClick={messageSign} disabled={!privateKey || !message}>
                  Sign
                </Button>
                <Divider />
                {signatureResult && (
                  <div className="signature-tools-result-item">
                    <h6 style={{ textAlign: "center" }}>Signature Result</h6>
                    <h6 className="signature-tools-tab-header">Signature</h6>
                    <div>
                      <InputGroup className="signature-tools-compile-modal-input-group">
                        <Input value={signatureResult.signature.substring(2)} disabled />
                        <Whisper placement="top" trigger="click" speaker={<Tooltip>Signature has been copied to clipboard!</Tooltip>}>
                          <InputGroup.Button onClick={() => navigator.clipboard.writeText(signatureResult.signature.substring(2))}>
                            <CopyIcon width="1rem" height="1rem" />
                          </InputGroup.Button>
                        </Whisper>
                      </InputGroup>
                    </div>
                    <h6 className="signature-tools-tab-header">Message Hash</h6>
                    <div>
                      <InputGroup className="signature-tools-compile-modal-input-group">
                        <Input value={signatureResult.messageHash.substring(2)} disabled />
                        <Whisper placement="top" trigger="click" speaker={<Tooltip>Signature has been copied to clipboard!</Tooltip>}>
                          <InputGroup.Button onClick={() => navigator.clipboard.writeText(signatureResult.messageHash.substring(2))}>
                            <CopyIcon width="1rem" height="1rem" />
                          </InputGroup.Button>
                        </Whisper>
                      </InputGroup>
                    </div>
                    <h6 className="signature-tools-tab-header">R</h6>
                    <div>
                      <InputGroup className="signature-tools-compile-modal-input-group">
                        <Input value={signatureResult.r.substring(2)} disabled />
                        <Whisper placement="top" trigger="click" speaker={<Tooltip>Signature has been copied to clipboard!</Tooltip>}>
                          <InputGroup.Button onClick={() => navigator.clipboard.writeText(signatureResult.r.substring(2))}>
                            <CopyIcon width="1rem" height="1rem" />
                          </InputGroup.Button>
                        </Whisper>
                      </InputGroup>
                    </div>
                    <h6 className="signature-tools-tab-header">S</h6>
                    <div>
                      <InputGroup className="signature-tools-compile-modal-input-group">
                        <Input value={signatureResult.s.substring(2)} disabled />
                        <Whisper placement="top" trigger="click" speaker={<Tooltip>Signature has been copied to clipboard!</Tooltip>}>
                          <InputGroup.Button onClick={() => navigator.clipboard.writeText(signatureResult.s.substring(2))}>
                            <CopyIcon width="1rem" height="1rem" />
                          </InputGroup.Button>
                        </Whisper>
                      </InputGroup>
                    </div>
                    <h6 className="signature-tools-tab-header">V</h6>
                    <div>
                      <InputGroup className="signature-tools-compile-modal-input-group">
                        <Input value={signatureResult.v.substring(2)} disabled />
                        <Whisper placement="top" trigger="click" speaker={<Tooltip>Signature has been copied to clipboard!</Tooltip>}>
                          <InputGroup.Button onClick={() => navigator.clipboard.writeText(signatureResult.v.substring(2))}>
                            <CopyIcon width="1rem" height="1rem" />
                          </InputGroup.Button>
                        </Whisper>
                      </InputGroup>
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === 1 && (
              <>
                <div className="signature-tools-result-item">
                  <h6 className="signature-tools-tab-header">Message Hash (hex)</h6>
                  <div>
                    <Input className="signature-tools-main-input" type="text" value={messageHash} onChange={(value: string) => setMessageHash(value.replace(/\s/g, ""))} />
                  </div>
                </div>
                <div className="signature-tools-result-item">
                  <h6 className="signature-tools-tab-header">Signature (hex)</h6>
                  <div>
                    <Input className="signature-tools-main-input" type="text" value={signature} onChange={(value: string) => setSignature(value.replace(/\s/g, ""))} />
                  </div>
                </div>
                <Button className="signature-tools-button" appearance="primary" size="md" onClick={ecrecover} disabled={!messageHash || !signature}>
                  Verify
                </Button>

                {verifyResult && (
                  <>
                    <h6 className="signature-tools-tab-header">R</h6>
                    <div>
                      <InputGroup className="signature-tools-compile-modal-input-group">
                        <Input value={verifyResult.r} disabled />
                        <Whisper placement="top" trigger="click" speaker={<Tooltip>Signature has been copied to clipboard!</Tooltip>}>
                          <InputGroup.Button onClick={() => navigator.clipboard.writeText(verifyResult.r)}>
                            <CopyIcon width="1rem" height="1rem" />
                          </InputGroup.Button>
                        </Whisper>
                      </InputGroup>
                    </div>
                    <h6 className="signature-tools-tab-header">S</h6>
                    <div>
                      <InputGroup className="signature-tools-compile-modal-input-group">
                        <Input value={verifyResult.s} disabled />
                        <Whisper placement="top" trigger="click" speaker={<Tooltip>Signature has been copied to clipboard!</Tooltip>}>
                          <InputGroup.Button onClick={() => navigator.clipboard.writeText(verifyResult.s)}>
                            <CopyIcon width="1rem" height="1rem" />
                          </InputGroup.Button>
                        </Whisper>
                      </InputGroup>
                    </div>
                    <h6 className="signature-tools-tab-header">V</h6>
                    <div>
                      <InputGroup className="signature-tools-compile-modal-input-group">
                        <Input value={verifyResult.v} disabled />
                        <Whisper placement="top" trigger="click" speaker={<Tooltip>Signature has been copied to clipboard!</Tooltip>}>
                          <InputGroup.Button onClick={() => navigator.clipboard.writeText(verifyResult.v)}>
                            <CopyIcon width="1rem" height="1rem" />
                          </InputGroup.Button>
                        </Whisper>
                      </InputGroup>
                    </div>
                    <h6 className="signature-tools-tab-header">Public key</h6>
                    <div>
                      <InputGroup className="signature-tools-compile-modal-input-group">
                        <Input value={verifyResult.publickey} disabled />
                        <Whisper placement="top" trigger="click" speaker={<Tooltip>Signature has been copied to clipboard!</Tooltip>}>
                          <InputGroup.Button onClick={() => navigator.clipboard.writeText(verifyResult.publickey)}>
                            <CopyIcon width="1rem" height="1rem" />
                          </InputGroup.Button>
                        </Whisper>
                      </InputGroup>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
