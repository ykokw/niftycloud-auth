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
  describe("v2 library ", ()=>{
    before(()=>{
      niftycloud = new NiftyCloud(
        "12345678901234567890",
        "1234567890abcdefghijklmnopqrstuvwxyzABCD",
        endpoint
      );
    });
    let v2 = null;
    describe("createSignature method ", ()=>{
      before(()=>{
        v2 = niftycloud.V2;
      });
      it("should return correct signature", ()=>{
        const params = {
          method: "GET",
          url: url.parse("https://east-1.cp.cloud.nifty.com/api/?Action=DescribeSecurityGroups")
        };

        v2.createSignature(params);
        const expectSignature = "3j8yjA3IoqFcYLhHiG7cuXaLPZ9UCY/BOnS2p7haV3Q=";
        assert.equal(v2.canonicalQuery["Signature"], expectSignature, "signature is not correct");
      });
    });
    describe("get method ", ()=>{
      beforeEach(()=>{
        nock.cleanAll();
      });
      it("should return correct response as Object in Callback", (next)=>{
        nock(endpoint).filteringPath((path)=>{return "/api/";})
                      .get("/api/")
                      .replyWithFile(200,
                        "./test/mock/validResponse.xml",
                        {
                          "Content-Type":"application/xml"
                        });
        v2.get({
          Action: "RebootInstances",
          "InstanceId.1": "server01"
        }, (err, res)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/validResponse.xml");
          parseString(expectResponseXml, (parseErr, result)=>{
            assert(result !== null);
            assert.deepEqual(res, result, "response didn't match");
            assert(err === null);
            next();
          });
        });
      });
      it("should return correct response as Object in Promise", (next)=>{
        nock(endpoint).filteringPath((path)=>{return "/api/";})
                      .get("/api/")
                      .replyWithFile(200,
                        "./test/mock/validResponse.xml",
                        {
                          "Content-Type":"application/xml"
                        });
        v2.get({
          Action: "RebootInstances",
          "InstanceId.1": "server01"
        }).then((res)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/validResponse.xml");
          parseString(expectResponseXml, (err, result)=>{
            assert(result !== null);
            assert.deepEqual(res, result, "response didn't match");
            next();
          });
        }).catch((err)=>{
        });
      });
      it("should return error response as Object in Callback", (next)=>{
        nock(endpoint).filteringPath((path)=>{return "/api/";})
                      .get("/api/")
                      .query({"Action":"InvalidAction"})
                      .replyWithFile(400,
                        "./test/mock/invalidResponse.xml",
                        {
                          "Content-Type":"application/xml"
                        });
        v2.get({
          Action: "RebootInstances",
          "InstanceId.1": "server01"
        }, (err, res)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/invalidResponse.xml");
          parseString(expectResponseXml, (parseErr, result)=>{
            assert(res === null);
            assert.ok(err instanceof niftycloud.Errors.ApiError, `actual type: ${typeof err}`);
            assert.deepEqual(err.response, result, `response did not match:${JSON.stringify(err)} with ${JSON.stringify(result)}`);
            next();
          });
        });
      });
      it("should return error response as Object in Promise", (next)=>{
        nock(endpoint).filteringPath((path)=>{return "/api/";})
                      .get("/api/")
                      .query({"Action":"InvalidAction"})
                      .replyWithFile(400,
                        "./test/mock/invalidResponse.xml",
                        {
                          "Content-Type":"application/xml"
                        });
        v2.get({
          Action: "InvalidAction",
        }).then((res)=>{
        }).catch((err)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/invalidResponse.xml");
          parseString(expectResponseXml, (parseErr, result)=>{
            assert.ok(err instanceof niftycloud.Errors.ApiError, `actual type: ${typeof err}`);
            assert.deepEqual(err.response, result, `response did not match:${JSON.stringify(err)} with ${JSON.stringify(result)}`);
            next();
          });
        });
      });
      it("should return Errors.InvalidParameters when option is null", (next)=>{
        v2.get(null).then((res)=>{
        }).catch((err)=>{
          assert.ok(err instanceof niftycloud.Errors.InvalidParameterError, `actual type: ${typeof err}`);
          next();
        });
      });
      it("should return Errors.InvalidParameters when option is not specify api Action", (next)=>{
        v2.get({"key": "value"}).then((res)=>{
        }).catch((err)=>{
          assert.ok(err instanceof niftycloud.Errors.InvalidParameterError, `actual type: ${typeof err}`);
          next();
        });
      });
    });
  });
});
