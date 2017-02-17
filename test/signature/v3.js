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
  describe("get method", ()=>{
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
        v3.get("/", {
          headers: {
            "Content-Type": "application/xml"
          }
        }, (err, res)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/validResponseOfGetService.xml");
          parseString(expectResponseXml, (parseErr, result)=>{
            assert(result !== null);
            assert.deepEqual(res.body, result);
            assert(err === null);
            next();
          });
        });
      });
      it("should return correct response as Object in Promise", (next)=>{
        v3.get("/", {
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
        v3.get(111, {}).then().catch((err)=>{
          assert.ok(err instanceof v3.InvalidParametersError, `actual type: ${typeof err}`);
          next();
        }); 
      });
      it("should return invalid parameters error if options is not object", (next)=>{
        v3.get("/", 111).then().catch((err)=>{
          assert.ok(err instanceof v3.InvalidParametersError, `actual type: ${typeof err}`);
          next();
        }); 
      });
    });
  });
});
//
//    describe("get method ", ()=>{
//      it("should return correct response as Object in Callback", (next)=>{
//        nock(endpoint).get("/")
//                      .replyWithFile(200,
//                        "./test/mock/validResponseOfGetService.xml",
//                        {
//                          "Content-Type":"application/xml"
//                        });
//        v3.get("/", {
//          "Content-Type": "application/xml"
//        },null , (err, res)=>{
//          const expectResponseXml = fs.readFileSync("./test/mock/validResponseOfGetService.xml");
//          parseString(expectResponseXml, (parseErr, result)=>{
//            assert(result !== null);
//            assert.deepEqual(res, result, "response didn't match");
//            assert(err === null);
//            next();
//          });
//        });
//      });
//      it("should return correct response as Object in Promise", (next)=>{
//        nock(endpoint).get("/")
//                      .replyWithFile(200,
//                        "./test/mock/validResponseOfGetService.xml",
//                        {
//                          "Content-Type":"application/xml"
//                        });
//        v3.get("/", {
//          "Content-Type": "application/xml"
//        }, null).then((res)=>{
//          const expectResponseXml = fs.readFileSync("./test/mock/validResponseOfGetService.xml");
//          parseString(expectResponseXml, (parseErr, result)=>{
//            assert(result !== null);
//            assert.deepEqual(res, result, "response didn't match");
//            next();
//          });
//        });
//      });
//      it("should return error response as Object in Callback", (next)=>{
//        nock(endpoint).get("/invalid/")
//                      .replyWithFile(404,
//                        "./test/mock/invalidResponse.xml",
//                        {
//                          "Content-Type":"application/xml"
//                        });
//        v3.get("/invalid/", {
//          "Content-Type": "application/xml"
//        },null , (err, res)=>{
//          const expectResponseXml = fs.readFileSync("./test/mock/invalidResponse.xml");
//          parseString(expectResponseXml, (parseErr, result)=>{
//            assert.ok(err instanceof NiftyCloud.Errors.ApiError, `actual type: ${typeof err}`);
//            assert.deepEqual(err.response, result, `response did not match:${JSON.stringify(err)} with ${JSON.stringify(result)}`);
//            next();
//          });
//        });
//      });
//      it("should return error response as Object in Promise", (next)=>{
//        nock(endpoint).get("/invalid/")
//                      .replyWithFile(404,
//                        "./test/mock/invalidResponse.xml",
//                        {
//                          "Content-Type":"application/xml"
//                        });
//        v3.get("/invalid/", {
//          "Content-Type": "application/xml"
//        }, null).catch((err)=>{
//          const expectResponseXml = fs.readFileSync("./test/mock/invalidResponse.xml");
//          parseString(expectResponseXml, (parseErr, result)=>{
//            assert.ok(err instanceof NiftyCloud.Errors.ApiError, `actual type: ${typeof err}`);
//            assert.deepEqual(err.response, result, `response did not match:${JSON.stringify(err)} with ${JSON.stringify(result)}`);
//            next();
//          });
//        });
//      });
//      it("should return InvalidParameterErro response when path is not specified", (next)=>{
//        v3.get(null, {
//          "Content-Type": "application/xml"
//        }, null).catch((err)=>{
//          assert.ok(err instanceof NiftyCloud.Errors.InvalidParameterError, `actual type: ${typeof err}`);
//          next();
//        });
//      });
//      it("should return InvalidParameterErro response when Content-Type is not specified", (next)=>{
//        v3.get("/invalid/", {
//        }, null).catch((err)=>{
//          assert.ok(err instanceof NiftyCloud.Errors.InvalidParameterError, `actual type: ${typeof err}`);
//          next();
//        });
//      });
//      it("should return InvalidParameterErro response when headers is null", (next)=>{
//        v3.get("/invalid/", {
//        }, null).catch((err)=>{
//          assert.ok(err instanceof NiftyCloud.Errors.InvalidParameterError, `actual type: ${typeof err}`);
//          next();
//        });
//      });
//    });
//    describe("put method", ()=>{
//      const bucketEndpoint = "https://my-first-bucket.jp-east-2.os.cloud.nifty.com";
//      const invalidBucketEndpoint = "https://invalid..bucket.jp-east-2.os.cloud.nifty.com";
//      it("should return correct response as Object in Callback", (next)=>{
//        nock(bucketEndpoint).put("/").reply(200);
//        v3.endpoint = bucketEndpoint;
//        v3.put("/", {
//          "Content-Type": "application/xml"
//        }, null, null, (err, res)=>{
//          assert.equal(res.status, 200);
//          next();
//        });
//      });
//      it("should return correct response as Object in Promise", (next)=>{
//        nock(bucketEndpoint).put("/").reply(200);
//        v3.endpoint = bucketEndpoint;
//        v3.put("/", {
//          "Content-Type": "application/xml"
//        }, null, null).then((res)=>{
//          assert.equal(res.status, 200);
//          next();
//        });
//      });
//      it("should return error response as Object in Callback", (next)=>{
//        nock(invalidBucketEndpoint).put("/")
//          .replyWithFile(404,
//            "./test/mock/invalidResponse.xml",
//            {
//              "Content-Type":"application/xml"
//            });
//        v3.endpoint = invalidBucketEndpoint;
//        v3.put("/", {
//          "Content-Type": "application/xml"
//        }, null, null, (err, res)=>{
//          const expectResponseXml = fs.readFileSync("./test/mock/invalidResponse.xml");
//          parseString(expectResponseXml, (parseErr, result)=>{
//            assert.ok(err instanceof NiftyCloud.Errors.ApiError, `actual type: ${typeof err}`);
//            assert.deepEqual(err.response, result, `response did not match:${JSON.stringify(err)} with ${JSON.stringify(result)}`);
//            next();
//          });
//        });
//      });
//      it("should return error response as Object in Promise", (next)=>{
//        nock(invalidBucketEndpoint).put("/")
//          .replyWithFile(404,
//            "./test/mock/invalidResponse.xml",
//            {
//              "Content-Type":"application/xml"
//            });
//        v3.endpoint = invalidBucketEndpoint;
//        v3.put("/", {
//          "Content-Type": "application/xml"
//        }, null, null).catch((err)=>{
//          const expectResponseXml = fs.readFileSync("./test/mock/invalidResponse.xml");
//          parseString(expectResponseXml, (parseErr, result)=>{
//            assert.ok(err instanceof NiftyCloud.Errors.ApiError, `actual type: ${typeof err}`);
//            assert.deepEqual(err.response, result, `response did not match:${JSON.stringify(err)} with ${JSON.stringify(result)}`);
//            next();
//          });
//        });
//      });
//    });
//    describe("post method", ()=>{
//      const endpoint = "https://ess.api.cloud.nifty.com";
//      it("should return correct response as Object in Callback", (next)=>{
//        nock(endpoint).post("/")
//                      .replyWithFile(200,
//                        "./test/mock/validResponseOfPostRequest.xml",
//                        {
//                          "Content-Type":"application/xml"
//                        });
//        v3.endpoint = endpoint;
//        v3.post("/", {
//          "Content-Type": "application/xml"
//        }, null, null, (err, res)=>{
//          const expectResponseXml = fs.readFileSync("./test/mock/validResponseOfPostRequest.xml");
//          parseString(expectResponseXml, (parseErr, result)=>{
//            assert(result !== null);
//            assert.deepEqual(res, result, "response didn't match");
//            assert(err === null);
//            next();
//          });
//        });
//      });
//      it("should return correct response as Object in Promise", (next)=>{
//        nock(endpoint).post("/")
//                      .replyWithFile(200,
//                        "./test/mock/validResponseOfPostRequest.xml",
//                        {
//                          "Content-Type":"application/xml"
//                        });
//        v3.endpoint = endpoint;
//        v3.post("/", {
//          "Content-Type": "application/xml"
//        }, null, null).then((res)=>{
//          const expectResponseXml = fs.readFileSync("./test/mock/validResponseOfPostRequest.xml");
//          parseString(expectResponseXml, (parseErr, result)=>{
//            assert(result !== null);
//            assert.deepEqual(res, result, "response didn't match");
//            next();
//          });
//        });
//      });
//      it("should return error response as Object in Callback", (next)=>{
//        nock(endpoint).post("/invalid")
//          .replyWithFile(404,
//            "./test/mock/invalidResponse.xml",
//            {
//              "Content-Type":"application/xml"
//            });
//        v3.endpoint = endpoint;
//        v3.post("/invalid", {
//          "Content-Type": "application/xml"
//        }, null, null, (err, res)=>{
//          const expectResponseXml = fs.readFileSync("./test/mock/invalidResponse.xml");
//          parseString(expectResponseXml, (parseErr, result)=>{
//            assert.ok(err instanceof NiftyCloud.Errors.ApiError, `actual type: ${typeof err}`);
//            assert.deepEqual(err.response, result, `response did not match:${JSON.stringify(err)} with ${JSON.stringify(result)}`);
//            next();
//          });
//        });
//      });
//      it("should return error response as Object in Promise", (next)=>{
//        nock(endpoint).post("/invalid")
//          .replyWithFile(404,
//            "./test/mock/invalidResponse.xml",
//            {
//              "Content-Type":"application/xml"
//            });
//        v3.endpoint = endpoint;
//        v3.post("/invalid", {
//          "Content-Type": "application/xml"
//        }, null, null).catch((err)=>{
//          const expectResponseXml = fs.readFileSync("./test/mock/invalidResponse.xml");
//          parseString(expectResponseXml, (parseErr, result)=>{
//            assert.ok(err instanceof NiftyCloud.Errors.ApiError, `actual type: ${typeof err}`);
//            assert.deepEqual(err.response, result, `response did not match:${JSON.stringify(err)} with ${JSON.stringify(result)}`);
//            next();
//          });
//        });
//      });
//    });
//    describe("delete method", ()=>{
//      const bucketEndpoint = "https://my-first-bucket.jp-east-2.os.cloud.nifty.com";
//      const invalidBucketEndpoint = "https://invalid..bucket.jp-east-2.os.cloud.nifty.com";
//      it("should return correct response as Object in Callback", (next)=>{
//        nock(bucketEndpoint).delete("/").reply(204);
//        v3.endpoint = bucketEndpoint;
//        v3.delete("/", {
//          "Content-Type": "application/xml"
//        }, null, (err, res)=>{
//          assert.equal(res.status, 204);
//          next();
//        });
//      });
//      it("should return correct response as Object in Promise", (next)=>{
//        nock(bucketEndpoint).delete("/").reply(204);
//        v3.endpoint = bucketEndpoint;
//        v3.delete("/", {
//          "Content-Type": "application/xml"
//        }, null).then((res)=>{
//          assert.equal(res.status, 204);
//          next();
//        });
//      });
//      it("should return error response as Object in Callback", (next)=>{
//        nock(invalidBucketEndpoint).delete("/")
//          .replyWithFile(404,
//            "./test/mock/invalidResponse.xml",
//            {
//              "Content-Type":"application/xml"
//            });
//        v3.endpoint = invalidBucketEndpoint;
//        v3.delete("/", {
//          "Content-Type": "application/xml"
//        }, null, (err, res)=>{
//          const expectResponseXml = fs.readFileSync("./test/mock/invalidResponse.xml");
//          parseString(expectResponseXml, (parseErr, result)=>{
//            assert.ok(err instanceof NiftyCloud.Errors.ApiError, `actual type: ${typeof err}`);
//            assert.deepEqual(err.response, result, `response did not match:${JSON.stringify(err)} with ${JSON.stringify(result)}`);
//            next();
//          });
//        });
//      });
//      it("should return error response as Object in Promise", (next)=>{
//        nock(invalidBucketEndpoint).delete("/")
//          .replyWithFile(404,
//            "./test/mock/invalidResponse.xml",
//            {
//              "Content-Type":"application/xml"
//            });
//        v3.endpoint = invalidBucketEndpoint;
//        v3.delete("/", {
//          "Content-Type": "application/xml"
//        }, null).catch((err)=>{
//          const expectResponseXml = fs.readFileSync("./test/mock/invalidResponse.xml");
//          parseString(expectResponseXml, (parseErr, result)=>{
//            assert.ok(err instanceof NiftyCloud.Errors.ApiError, `actual type: ${typeof err}`);
//            assert.deepEqual(err.response, result, `response did not match:${JSON.stringify(err)} with ${JSON.stringify(result)}`);
//            next();
//          });
//        });
//      });
//    });
//  });
//});
