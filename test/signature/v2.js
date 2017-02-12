"use strict";

const assert      = require("power-assert");
const url         = require("url");
const fs          = require("fs");
const parseString = require('xml2js').parseString;
const nock        = require("nock");

const NiftyCloud  = require("../../lib/niftycloud");

const endpoint = "https://east-1.cp.cloud.nifty.com";


describe.only("V2 class", ()=>{
  describe("constructor", ()=>{
    it("should set empty string to api key as default parameter", ()=>{
      const v2 = new NiftyCloud.V2();
      assert.equal(v2.accessKey, "");
      assert.equal(v2.secretKey, "");
    });
    it("should set api key", ()=>{
      const v2 = new NiftyCloud.V2(
        "12345678901234567890",
        "1234567890abcdefghijklmnopqrstuvwxyzABCD",
        endpoint
      );
      assert.equal(v2.accessKey, "12345678901234567890");
      assert.equal(v2.secretKey, "1234567890abcdefghijklmnopqrstuvwxyzABCD");
      assert.equal(v2.endpoint, endpoint);
    });
  });
  describe("createSignature method ", ()=>{
    const v2 = new NiftyCloud.V2(
      "12345678901234567890",
      "1234567890abcdefghijklmnopqrstuvwxyzABCD",
      endpoint
    );
    it("should return correct signature", ()=>{
      const params = {
        method: "GET",
        url: url.parse("https://east-1.cp.cloud.nifty.com/api/?"),
        queries: {"Action":"DescribeSecurityGroups"}
      };

      v2.createSignature(params);
      const expectSignature = "3j8yjA3IoqFcYLhHiG7cuXaLPZ9UCY/BOnS2p7haV3Q=";
      assert.equal(params.queries["Signature"], expectSignature, "signature is not correct");
    });
  });
  //describe("get method ", ()=>{
  //  it("should return response with valid request parameters", ()=>{});
  //  it("should set empty string as default action parameters", ()=>{});
  //  it("should set empty object as default query parameter", ()=>{});
  //  it("should set query parameter object", ()=>{});
  //  it("should return invalid parameters error if action parameter is invalid", ()=>{});
  //  it("should return invalid parameters error if query parameter is invalid", ()=>{});
  //});
});
