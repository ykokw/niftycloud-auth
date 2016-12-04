"use strict";

const assert      = require("chai").assert;
const url         = require("url");
const fs          = require("fs");
const parseString = require('xml2js').parseString;
const nock        = require("nock");

const NiftyCloud  = require("../../lib/niftycloud");

const endpoint = "https://east-1.cp.cloud.nifty.com";

describe("Signature ", ()=>{
  let niftycloud = null;
  before(()=>{
    niftycloud = new NiftyCloud(
      "12345678901234567890",
      "1234567890abcdefghijklmnopqrstuvwxyzABCD",
      endpoint
    );
  });
  describe("v4 library ", ()=>{
    let v4 = null;
    before(()=>{
      v4 = niftycloud.V4;
    });

    //sample parameters for creating signature is here
    //http://cloud.nifty.com/api/signature_v4.htm

    describe("createCannonicalScope method", ()=>{
      it("should create valid canonical scope", ()=>{
        const params = {
          requestDate: "20160427T025932Z",
          region: "east-1",
          serviceId: "rdb"
        };
        const expect = "20160427/east-1/rdb/nifty4_request";
        const scope = v4.createCanonicalScope(params);
        assert.equal(expect, scope, "Canonical Scope is invalid");
      });
    });

    describe("createSecret method", ()=>{
      it("should create valid secret", ()=>{
        const params = {
          requestDate: "20160427T025932Z",
          region: "east-1",
          serviceId: "rdb"
        };
        const expect = "fd9626ac4e58ab692ce8654bebb4a0628fa974d596e9e800cf6c016e80ed41d8";
        const scope = v4.createSecret(params);
        assert.equal(expect, scope, "Secret is invalid");
      });
    });
    describe("createEncodedRequestPayload method", ()=>{
      it("should create valid hash of payload", ()=>{
        const headerParams = {
          "content-type": "application/json",
        };
        const expect = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        const payload = v4.createEncodedRequestPayload(null, headerParams);
        assert.equal(expect, payload, "Payload is invalid");
      });
    });
  });
});