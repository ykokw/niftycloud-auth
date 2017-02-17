"use strict";

const assert      = require("chai").assert;
const url         = require("url");
const fs          = require("fs");
const parseString = require('xml2js').parseString;
const nock        = require("nock");

const NiftyCloud  = require("../../lib/niftycloud");

const endpoint = "https://jp-east-2.os.cloud.nifty.com";

describe.only("V3 class", ()=>{
  describe("constructor", ()=>{
    it("should set empty string to api key as default parameter", ()=>{
      const v3 = new NiftyCloud.V3();
      assert.equal(v3.accessKey, "");
      assert.equal(v3.secretKey, "");
    });
    it("should set api key", ()=>{
      const v3 = new NiftyCloud.V3(
        "12345678901234567890",
        "1234567890abcdefghijklmnopqrstuvwxyzABCD",
        endpoint
      );
      assert.equal(v3.accessKey, "12345678901234567890");
      assert.equal(v3.secretKey, "1234567890abcdefghijklmnopqrstuvwxyzABCD");
      assert.equal(v3.endpoint, endpoint);
    });
  });
  describe("createSignature method ", ()=>{
    const v3 = new NiftyCloud.V3(
      "12345678901234567890",
      "1234567890abcdefghijklmnopqrstuvwxyzABCD",
      endpoint
    );
    it("should return correct signature", ()=>{
      const headers = {
        "Content-Type": "application/octet-stream",
        "Date": "Wed, 29 Jun 2016 12:00:00 GMT"
      };
      const params = {
        method: "GET",
        url: url.parse("https://jp-east-2.os.cloud.nifty.com/"),
        headers: headers,
        queries: {}
      };

      v3.createSignature(params);
      const expectSignature = "AWS 12345678901234567890:tXIcRltLq+ueG9HWHZDfvT7ry+g=";
      assert.equal(headers["Authorization"], expectSignature, "signature is not correct");
    });
  });
  describe("stringToSign method", ()=>{
    const v3 = new NiftyCloud.V3(
      "12345678901234567890",
      "1234567890abcdefghijklmnopqrstuvwxyzABCD",
      endpoint
    );
    it("should return correct stringToSign when request get service of object storage api", ()=>{
      const headers = {
        "Content-Type": "application/octet-stream",
        "Date": "Wed, 29 Jun 2016 12:00:00 GMT"
      };
      const params = {
        method: "GET",
        url: url.parse("https://jp-east-2.os.cloud.nifty.com/"),
        headers: headers,
        queries: {}
      };

      const stringToSign = v3.stringToSign(params);
    const expectStr = `${params.method}\n\n${headers["Content-Type"]}\n${headers["Date"]}\n/`;
      assert.equal(stringToSign, expectStr, "strToSign is not correct");
    });
  });
  describe("sendRequestWithSignature method", ()=>{
    const v3 = new NiftyCloud.V3(
      "12345678901234567890",
      "1234567890abcdefghijklmnopqrstuvwxyzABCD",
      endpoint
    );
    describe("with valid request parameters", ()=>{
      before(()=>{
        nock(endpoint).get("/")
                      .times(2)
                      .replyWithFile(200,
                        "./test/mock/validResponseOfGetService.xml",
                        {
                          "Content-Type":"application/xml"
                        });
      });
      it("should return correct response as Object in Callback", (next)=>{
        v3.sendRequestWithSignature("get", "/", {
          headers: {
            "Content-Type": "application/xml"
          },
          callback: (err, res)=>{
            console.log(err);
            const expectResponseXml = fs.readFileSync("./test/mock/validResponseOfGetService.xml");
            parseString(expectResponseXml, (parseErr, result)=>{
              assert(result !== null);
              assert.deepEqual(res.body, result);
              assert(err === null);
              next();
            });
          }
        });
      });
      it("should return correct response as Object in Promise", (next)=>{
        v3.sendRequestWithSignature("get", "/", {
          headers: {
            "Content-Type": "application/xml"
          }
        }).then((res)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/validResponseOfGetService.xml");
          parseString(expectResponseXml, (parseErr, result)=>{
            assert(result !== null);
            assert.deepEqual(res.body, result);
            next();
          });
        });
      });
    });
    describe("with invalid parameters", ()=>{
      it("should return invalid parameters error if path is not string", (next)=>{
        v3.sendRequestWithSignature("get", 111, {}).then().catch((err)=>{
          assert.ok(err instanceof v3.InvalidParametersError, `actual type: ${typeof err}`);
          next();
        }); 
      });
      it("should return invalid parameters error if options is not object", (next)=>{
        v3.sendRequestWithSignature("get", "/", 111).then().catch((err)=>{
          assert.ok(err instanceof v3.InvalidParametersError, `actual type: ${typeof err}`);
          next();
        }); 
      });
    });
  });
});
