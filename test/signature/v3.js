
"use strict";

const assert      = require("chai").assert;
const url         = require("url");
const fs          = require("fs");
const parseString = require('xml2js').parseString;
const nock        = require("nock");

const NiftyCloud  = require("../../lib/niftycloud");

const endpoint = "https://jp-east-2.os.cloud.nifty.com";

describe("Signature ", ()=>{
  let niftycloud = null;
  before(()=>{
    niftycloud = new NiftyCloud(
      "12345678901234567890",
      "1234567890abcdefghijklmnopqrstuvwxyzABCD",
      endpoint
    );
  });
  describe("v3 library ", ()=>{
    let v3 = null;
    before(()=>{
      v3 = niftycloud.V3;
    });
    describe("createSignature method ", ()=>{
      before(()=>{
      });
      it("should return correct signature", ()=>{
        v3.canonicalHeader = {
          "Content-Type": "application/octet-stream",
          "Date": "Wed, 29 Jun 2016 12:00:00 GMT"
        };
        const params = {
          method: "GET",
          url: url.parse("https://jp-east-2.os.cloud.nifty.com/")
        };

        v3.createSignature(params);
        const expectSignature = "AWS 12345678901234567890:tXIcRltLq+ueG9HWHZDfvT7ry+g=";
        assert.equal(v3.canonicalHeader["Authorization"], expectSignature, "signature is not correct");
      });
    });
    describe("stringToSign method", ()=>{
      it("should return correct stringToSign when request get service of object storage api", ()=>{
        v3.canonicalHeader = {
          "Content-Type": "application/octet-stream",
          "Date": "Wed, 29 Jun 2016 12:00:00 GMT"
        };
        const params = {
          method: "GET",
          url: url.parse("https://jp-east-2.os.cloud.nifty.com/")
        };

        const stringToSign = v3.stringToSign(params);
      const expectStr = `${params.method}\n\n${v3.canonicalHeader["Content-Type"]}\n${v3.canonicalHeader["Date"]}\n/`;
        assert.equal(stringToSign, expectStr, "strToSign is not correct");
      });
    });
    describe("get method ", ()=>{
      it("should return correct response as Object in Callback", (next)=>{
        nock(endpoint).get("/")
                      .replyWithFile(200,
                        "./test/mock/validResponseOfGetService.xml",
                        {
                          "Content-Type":"application/xml"
                        });
        v3.get("/", {
          "Content-Type": "application/xml"
        },null , (err, res)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/validResponseOfGetService.xml");
          parseString(expectResponseXml, (parseErr, result)=>{
            assert(result !== null);
            assert.deepEqual(res, result, "response didn't match");
            assert(err === null);
            next();
          });
        });
      });
      it("should return correct response as Object in Promise", (next)=>{
        nock(endpoint).get("/")
                      .replyWithFile(200,
                        "./test/mock/validResponseOfGetService.xml",
                        {
                          "Content-Type":"application/xml"
                        });
        v3.get("/", {
          "Content-Type": "application/xml"
        }, null).then((res)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/validResponseOfGetService.xml");
          parseString(expectResponseXml, (parseErr, result)=>{
            assert(result !== null);
            assert.deepEqual(res, result, "response didn't match");
            next();
          });
        });
      });
      it("should return error response as Object in Callback", (next)=>{
        nock(endpoint).get("/invalid/")
                      .replyWithFile(404,
                        "./test/mock/invalidResponse.xml",
                        {
                          "Content-Type":"application/xml"
                        });
        v3.get("/invalid/", {
          "Content-Type": "application/xml"
        },null , (err, res)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/invalidResponse.xml");
          parseString(expectResponseXml, (parseErr, result)=>{
            assert.ok(err instanceof niftycloud.Errors.ApiError, `actual type: ${typeof err}`);
            assert.deepEqual(err.response, result, `response did not match:${JSON.stringify(err)} with ${JSON.stringify(result)}`);
            next();
          });
        });
      });
      it("should return error response as Object in Promise", (next)=>{
        nock(endpoint).get("/invalid/")
                      .replyWithFile(404,
                        "./test/mock/invalidResponse.xml",
                        {
                          "Content-Type":"application/xml"
                        });
        v3.get("/invalid/", {
          "Content-Type": "application/xml"
        }, null).catch((err)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/invalidResponse.xml");
          parseString(expectResponseXml, (parseErr, result)=>{
            assert.ok(err instanceof niftycloud.Errors.ApiError, `actual type: ${typeof err}`);
            assert.deepEqual(err.response, result, `response did not match:${JSON.stringify(err)} with ${JSON.stringify(result)}`);
            next();
          });
        });
      });
      it("should return InvalidParameterErro response when path is not specified", (next)=>{
        v3.get(null, {
          "Content-Type": "application/xml"
        }, null).catch((err)=>{
          assert.ok(err instanceof niftycloud.Errors.InvalidParameterError, `actual type: ${typeof err}`);
          next();
        });
      });
      it("should return InvalidParameterErro response when Content-Type is not specified", (next)=>{
        v3.get("/invalid/", {
        }, null).catch((err)=>{
          assert.ok(err instanceof niftycloud.Errors.InvalidParameterError, `actual type: ${typeof err}`);
          next();
        });
      });
      it("should return InvalidParameterErro response when headers is null", (next)=>{
        v3.get("/invalid/", {
        }, null).catch((err)=>{
          assert.ok(err instanceof niftycloud.Errors.InvalidParameterError, `actual type: ${typeof err}`);
          next();
        });
      });
    });
    describe("put method", ()=>{
      const bucketEndpoint = "https://my-first-bucket.jp-east-2.os.cloud.nifty.com";
      const invalidBucketEndpoint = "https://invalid..bucket.jp-east-2.os.cloud.nifty.com";
      it("should return correct response as Object in Callback", (next)=>{
        nock(bucketEndpoint).put("/").reply(200);
        v3.endpoint = bucketEndpoint;
        v3.put("/", {
          "Content-Type": "application/xml"
        }, null, null, (err, res)=>{
          assert.equal(res.status, 200);
          next();
        });
      });
      it("should return correct response as Object in Promise", (next)=>{
        nock(bucketEndpoint).put("/").reply(200);
        v3.endpoint = bucketEndpoint;
        v3.put("/", {
          "Content-Type": "application/xml"
        }, null, null).then((res)=>{
          assert.equal(res.status, 200);
          next();
        });
      });
      it("should return error response as Object in Callback", (next)=>{
        nock(invalidBucketEndpoint).put("/")
          .replyWithFile(404,
            "./test/mock/invalidResponse.xml",
            {
              "Content-Type":"application/xml"
            });
        v3.endpoint = invalidBucketEndpoint;
        v3.put("/", {
          "Content-Type": "application/xml"
        }, null, null, (err, res)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/invalidResponse.xml");
          parseString(expectResponseXml, (parseErr, result)=>{
            assert.ok(err instanceof niftycloud.Errors.ApiError, `actual type: ${typeof err}`);
            assert.deepEqual(err.response, result, `response did not match:${JSON.stringify(err)} with ${JSON.stringify(result)}`);
            next();
          });
        });
      });
      it("should return error response as Object in Promise", (next)=>{
        nock(invalidBucketEndpoint).put("/")
          .replyWithFile(404,
            "./test/mock/invalidResponse.xml",
            {
              "Content-Type":"application/xml"
            });
        v3.endpoint = invalidBucketEndpoint;
        v3.put("/", {
          "Content-Type": "application/xml"
        }, null, null).catch((err)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/invalidResponse.xml");
          parseString(expectResponseXml, (parseErr, result)=>{
            assert.ok(err instanceof niftycloud.Errors.ApiError, `actual type: ${typeof err}`);
            assert.deepEqual(err.response, result, `response did not match:${JSON.stringify(err)} with ${JSON.stringify(result)}`);
            next();
          });
        });
      });
    });
    describe("post method", ()=>{
      const endpoint = "https://ess.api.cloud.nifty.com";
      it("should return correct response as Object in Callback", (next)=>{
        nock(endpoint).post("/")
                      .replyWithFile(200,
                        "./test/mock/validResponseOfPostRequest.xml",
                        {
                          "Content-Type":"application/xml"
                        });
        v3.endpoint = endpoint;
        v3.post("/", {
          "Content-Type": "application/xml"
        }, null, null, (err, res)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/validResponseOfPostRequest.xml");
          parseString(expectResponseXml, (parseErr, result)=>{
            assert(result !== null);
            assert.deepEqual(res, result, "response didn't match");
            assert(err === null);
            next();
          });
        });
      });
      it("should return correct response as Object in Promise", (next)=>{
        nock(endpoint).post("/")
                      .replyWithFile(200,
                        "./test/mock/validResponseOfPostRequest.xml",
                        {
                          "Content-Type":"application/xml"
                        });
        v3.endpoint = endpoint;
        v3.post("/", {
          "Content-Type": "application/xml"
        }, null, null).then((res)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/validResponseOfPostRequest.xml");
          parseString(expectResponseXml, (parseErr, result)=>{
            assert(result !== null);
            assert.deepEqual(res, result, "response didn't match");
            next();
          });
        });
      });
      it("should return error response as Object in Callback", (next)=>{
        nock(endpoint).post("/invalid")
          .replyWithFile(404,
            "./test/mock/invalidResponse.xml",
            {
              "Content-Type":"application/xml"
            });
        v3.endpoint = endpoint;
        v3.post("/invalid", {
          "Content-Type": "application/xml"
        }, null, null, (err, res)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/invalidResponse.xml");
          parseString(expectResponseXml, (parseErr, result)=>{
            assert.ok(err instanceof niftycloud.Errors.ApiError, `actual type: ${typeof err}`);
            assert.deepEqual(err.response, result, `response did not match:${JSON.stringify(err)} with ${JSON.stringify(result)}`);
            next();
          });
        });
      });
      it("should return error response as Object in Promise", (next)=>{
        nock(endpoint).post("/invalid")
          .replyWithFile(404,
            "./test/mock/invalidResponse.xml",
            {
              "Content-Type":"application/xml"
            });
        v3.endpoint = endpoint;
        v3.post("/invalid", {
          "Content-Type": "application/xml"
        }, null, null).catch((err)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/invalidResponse.xml");
          parseString(expectResponseXml, (parseErr, result)=>{
            assert.ok(err instanceof niftycloud.Errors.ApiError, `actual type: ${typeof err}`);
            assert.deepEqual(err.response, result, `response did not match:${JSON.stringify(err)} with ${JSON.stringify(result)}`);
            next();
          });
        });
      });
    });
    describe("delete method", ()=>{
      const bucketEndpoint = "https://my-first-bucket.jp-east-2.os.cloud.nifty.com";
      const invalidBucketEndpoint = "https://invalid..bucket.jp-east-2.os.cloud.nifty.com";
      it("should return correct response as Object in Callback", (next)=>{
        nock(bucketEndpoint).delete("/").reply(204);
        v3.endpoint = bucketEndpoint;
        v3.delete("/", {
          "Content-Type": "application/xml"
        }, null, (err, res)=>{
          assert.equal(res.status, 204);
          next();
        });
      });
      it("should return correct response as Object in Promise", (next)=>{
        nock(bucketEndpoint).delete("/").reply(204);
        v3.endpoint = bucketEndpoint;
        v3.delete("/", {
          "Content-Type": "application/xml"
        }, null).then((res)=>{
          assert.equal(res.status, 204);
          next();
        });
      });
      it("should return error response as Object in Callback", (next)=>{
        nock(invalidBucketEndpoint).delete("/")
          .replyWithFile(404,
            "./test/mock/invalidResponse.xml",
            {
              "Content-Type":"application/xml"
            });
        v3.endpoint = invalidBucketEndpoint;
        v3.delete("/", {
          "Content-Type": "application/xml"
        }, null, (err, res)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/invalidResponse.xml");
          parseString(expectResponseXml, (parseErr, result)=>{
            assert.ok(err instanceof niftycloud.Errors.ApiError, `actual type: ${typeof err}`);
            assert.deepEqual(err.response, result, `response did not match:${JSON.stringify(err)} with ${JSON.stringify(result)}`);
            next();
          });
        });
      });
      it("should return error response as Object in Promise", (next)=>{
        nock(invalidBucketEndpoint).delete("/")
          .replyWithFile(404,
            "./test/mock/invalidResponse.xml",
            {
              "Content-Type":"application/xml"
            });
        v3.endpoint = invalidBucketEndpoint;
        v3.delete("/", {
          "Content-Type": "application/xml"
        }, null).catch((err)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/invalidResponse.xml");
          parseString(expectResponseXml, (parseErr, result)=>{
            assert.ok(err instanceof niftycloud.Errors.ApiError, `actual type: ${typeof err}`);
            assert.deepEqual(err.response, result, `response did not match:${JSON.stringify(err)} with ${JSON.stringify(result)}`);
            next();
          });
        });
      });
    });
  });
});
