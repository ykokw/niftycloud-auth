"use strict";

const assert      = require("power-assert");
const url         = require("url");
const fs          = require("fs");
const parseString = require('xml2js').parseString;
const nock        = require("nock");

const NiftyCloud  = require("../../lib/niftycloud");

const endpoint = "https://east-1.cp.cloud.nifty.com";

describe("V2 class", ()=>{
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
        query: {"Action":"DescribeSecurityGroups"}
      };

      v2.createSignature(params);
      const expectSignature = "3j8yjA3IoqFcYLhHiG7cuXaLPZ9UCY/BOnS2p7haV3Q=";
      assert.equal(params.query["Signature"], expectSignature, "signature is not correct");
    });
  });
  describe("get method ", ()=>{
    const v2 = new NiftyCloud.V2(
      "12345678901234567890",
      "1234567890abcdefghijklmnopqrstuvwxyzABCD",
      endpoint
    );
    describe("with valid request parameters", ()=>{
      const path = "/api/";
      const action = "RebootInstances";
      const query = {
        "InstanceId.1":"server01"
      };
      before(()=>{
        nock(endpoint).get(path)
                      .times(2)
                      .query((q)=>{
                        if ( 'Action' in q &&
                             'AccessKeyId' in q &&
                              'SignatureMethod' in q &&
                              'SignatureVersion' in q &&
                              'Signature' in q) return true;
                        return false;
                      })
                      .replyWithFile(200,
                        "./test/mock/validResponse.xml",
                        {
                          "Content-Type":"application/xml"
                        });
      });
      it("should return response in callback", (next)=>{
        v2.get(path, action, {
          query   : query,
          callback: (err, res)=>{
            const expectResponseXml = fs.readFileSync("./test/mock/validResponse.xml");
            parseString(expectResponseXml, {explicitArray:false}, (parseErr, result)=>{
              assert(result !== null);
              assert.deepEqual(res.body, result);
              assert(err === null);
              next();
            });
          }
        });
      });
      it("should return response in promise", (next)=>{
        v2.get(path, action, {query: query}).then((res)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/validResponse.xml");
          parseString(expectResponseXml, {explicitArray:false}, (parseErr, result)=>{
            assert(result !== null);
            assert.deepEqual(res.body, result);
            next();
          });
        }).catch(next);
      });
    });
    describe("with invalid parameters", ()=>{
      const path = "/api/";
      it("should return invalid parameters error if action parameter is null", (next)=>{
        v2.get(path, null, {}).then().catch((err)=>{
          assert.ok(err instanceof v2.InvalidParametersError, `actual type: ${typeof err}`);
          next();
        });
      });
      it("should return invalid parameters error if action parameter is not string", (next)=>{
        v2.get(path, 111, {}).then().catch((err)=>{
          assert.ok(err instanceof v2.InvalidParametersError, `actual type: ${typeof err}`);
          next();
        });
      });
      it("should return invalid parameters error if query parameter is not object", (next)=>{
        v2.get(path, "DummyAction", {query: 111}).then().catch((err)=>{
          assert.ok(err instanceof v2.InvalidParametersError, `actual type: ${typeof err}`);
          next();
        });
      });
    });
  });
});
