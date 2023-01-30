/* eslint-disable no-throw-literal */
import React, { useState } from "react";
import { Button, Divider, Input, InputGroup, Radio, RadioGroup, Tooltip, Whisper } from "rsuite";

import CopyIcon from "../Svg/Icons/Copy";
import "./SignatureTool.scss";
import secp256k1 from "secp256k1";
import WizData from "@script-wiz/wiz-data";
import { crypto } from "@script-wiz/lib-core";

export const SignatureTool = () => {
  const [verifyResult, setVerifyResult] = useState<{ r: string; s: string; v: string; publickey: string }>();
  const [signature, setSignature] = useState<string>("");
  const [tab, setTab] = useState(0);

  const [privateKey, setPrivateKey] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [signatureResult, setSignatureResult] = useState<any>();

  const buf2hex = (buffer: Uint8Array) => {
    // buffer is an ArrayBuffer
    return [...new Uint8Array(buffer)].map((x) => x.toString(16).padStart(2, "0")).join("");
  };

  const messageSign = () => {
    const messageHash = crypto.sha256(WizData.fromHex(message)).toString();
    const res = secp256k1.ecdsaSign(Buffer.from(messageHash, "hex"), Buffer.from(privateKey, "hex"));
    const signHex = buf2hex(res.signature);
    const r = signHex.slice(0, 64);
    const s = signHex.slice(64, 128);

    setSignatureResult({ sign: signHex + (res.recid === 0 ? "1b" : "1c"), v: res.recid === 0 ? "1b" : "1c", messageHash, r, s });
  };

  const ecrecover = () => {
    try {
      const v = signature.slice(128);

      const recovery = (WizData.fromHex(v).number || 0) - 27;

      if (recovery !== 0 && recovery !== 1) {
        throw new Error("Invalid signature v value");
      }

      const msgHash = crypto.sha256(WizData.fromHex(message)).toString();
      console.log(msgHash);
      const si = Buffer.from(signature.slice(0, 128), "hex");
      const m = Buffer.from(msgHash, "hex");
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
                  <h6 className="signature-tools-tab-header">Message (hex)</h6>
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
                        <Input value={signatureResult.sign} disabled />
                        <Whisper placement="top" trigger="click" speaker={<Tooltip>Signature has been copied to clipboard!</Tooltip>}>
                          <InputGroup.Button onClick={() => navigator.clipboard.writeText(signatureResult.sign)}>
                            <CopyIcon width="1rem" height="1rem" />
                          </InputGroup.Button>
                        </Whisper>
                      </InputGroup>
                    </div>
                    <h6 className="signature-tools-tab-header">Message Hash</h6>
                    <div>
                      <InputGroup className="signature-tools-compile-modal-input-group">
                        <Input value={signatureResult.messageHash} disabled />
                        <Whisper placement="top" trigger="click" speaker={<Tooltip>Message hash has been copied to clipboard!</Tooltip>}>
                          <InputGroup.Button onClick={() => navigator.clipboard.writeText(signatureResult.messageHash)}>
                            <CopyIcon width="1rem" height="1rem" />
                          </InputGroup.Button>
                        </Whisper>
                      </InputGroup>
                    </div>
                    <h6 className="signature-tools-tab-header">R</h6>
                    <div>
                      <InputGroup className="signature-tools-compile-modal-input-group">
                        <Input value={signatureResult.r} disabled />
                        <Whisper placement="top" trigger="click" speaker={<Tooltip>Signature has been copied to clipboard!</Tooltip>}>
                          <InputGroup.Button onClick={() => navigator.clipboard.writeText(signatureResult.r)}>
                            <CopyIcon width="1rem" height="1rem" />
                          </InputGroup.Button>
                        </Whisper>
                      </InputGroup>
                    </div>
                    <h6 className="signature-tools-tab-header">S</h6>
                    <div>
                      <InputGroup className="signature-tools-compile-modal-input-group">
                        <Input value={signatureResult.s} disabled />
                        <Whisper placement="top" trigger="click" speaker={<Tooltip>Signature has been copied to clipboard!</Tooltip>}>
                          <InputGroup.Button onClick={() => navigator.clipboard.writeText(signatureResult.s)}>
                            <CopyIcon width="1rem" height="1rem" />
                          </InputGroup.Button>
                        </Whisper>
                      </InputGroup>
                    </div>
                    <h6 className="signature-tools-tab-header">V</h6>
                    <div>
                      <InputGroup className="signature-tools-compile-modal-input-group">
                        <Input value={signatureResult.v} disabled />
                        <Whisper placement="top" trigger="click" speaker={<Tooltip>Signature has been copied to clipboard!</Tooltip>}>
                          <InputGroup.Button onClick={() => navigator.clipboard.writeText(signatureResult.v)}>
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
                  <h6 className="signature-tools-tab-header">Message (hex)</h6>
                  <div>
                    <Input className="signature-tools-main-input" type="text" value={message} onChange={(value: string) => setMessage(value.replace(/\s/g, ""))} />
                  </div>
                </div>
                <div className="signature-tools-result-item">
                  <h6 className="signature-tools-tab-header">Signature (hex)</h6>
                  <div>
                    <Input className="signature-tools-main-input" type="text" value={signature} onChange={(value: string) => setSignature(value.replace(/\s/g, ""))} />
                  </div>
                </div>
                <Button className="signature-tools-button" appearance="primary" size="md" onClick={ecrecover} disabled={!message || !signature}>
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
