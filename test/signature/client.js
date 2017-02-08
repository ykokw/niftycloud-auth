"use strict";

const assert      = require("chai").assert;
const url         = require("url");
const fs          = require("fs");
const qs          = require("qs");
const parseString = require('xml2js').parseString;
const nock        = require("nock");

const Client = require("../../lib/signature/client");

const endpoint = "https://east-1.cp.cloud.nifty.com";
const client = new Client(
  "12345678901234567890",
  "1234567890abcdefghijklmnopqrstuvwxyzABCD",
  endpoint
);

describe("Client class", ()=>{
  describe("constructor", ()=>{
    it("should set empty string as default parameter", ()=>{
      const cli = new Client();
      assert(cli.accessKey === "", "access key is not empty string" + cli.accessKey + typeof(cli.accessKey));
      assert(cli.secretKey === "");
      assert(cli.endpoint === "");
      assert(cli.proxy === "");
    });
  });
  //describe("sendRequest method", ()=>{
  //  before(()=>{
  //    nock(endpoint).get("/api/validXmlResponse")
  //                  .times(2)
  //                  .replyWithFile(200,
  //                    "./test/mock/validResponse.xml",
  //                    {
  //                      "Content-Type":"application/xml"
  //                    });

  //    nock(endpoint).get("/api/validJsonResponse")
  //                  .times(2)
  //                  .reply(200, {"result":"ok"});

  //    nock(endpoint).get("/api/validStringResponse")
  //                  .times(2)
  //                  .reply(200, "ok");

  //    nock(endpoint).get("/api/validEmptyResponse")
  //                  .times(2)
  //                  .reply(200, {"result":"ok"});

  //    nock(endpoint).get("/api/errorXmlResponse")
  //                  .times(2)
  //                  .replyWithFile(400,
  //                    "./test/mock/errorResponse.xml",
  //                    {
  //                      "Content-Type":"application/xml"
  //                    });

  //    nock(endpoint).get("/api/errorJsonResponse")
  //                  .reply(400, {"error":"k"});
  //  });
  //  it("shoud return valid xml response as Object in callback", (next)=>{
  //    const params = {
  //      method: "GET",
  //      url: url.parse(endpoint),
  //    };
  //  });
  //  it("shoud return valid xml response as Object in promise", (next)=>{});
  //  it("shoud return valid json response as Object in callback", (next)=>{});
  //  it("shoud return valid json response as Object in promise", (next)=>{});
  //  it("shoud return api error response as Object in promise", (next)=>{});
  //  it("shoud return api error response as Object in promise", (next)=>{});
  //  it("shoud return parse response error response as Object in promise", (next)=>{});
  //  it("shoud return parse response error response as Object in promise", (next)=>{});
  //  it("shoud return invalid parameters error response as Object in promise", (next)=>{});
  //  it("shoud return invalid parameters error response as Object in promise", (next)=>{});
  //});
});
