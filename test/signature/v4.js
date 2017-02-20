"use strict";

const assert      = require("power-assert");
const url         = require("url");
const fs          = require("fs");
const qs          = require("qs");
const parseString = require('xml2js').parseString;
const nock        = require("nock");

const NiftyCloud  = require("../../lib/niftycloud");

const endpoint = "https://east-1.cp.cloud.nifty.com";


describe("V4 class", ()=>{
  describe("constructor", ()=>{
    it("should set empty string to api key as default parameter", ()=>{
      const v4 = new NiftyCloud.V4();
      assert.equal(v4.accessKey, "");
      assert.equal(v4.secretKey, "");
    });
    it("should set api key", ()=>{
      const v4 = new NiftyCloud.V4(
        "12345678901234567890",
        "1234567890abcdefghijklmnopqrstuvwxyzABCD",
        endpoint
      );
      assert.equal(v4.accessKey, "12345678901234567890");
      assert.equal(v4.secretKey, "1234567890abcdefghijklmnopqrstuvwxyzABCD");
      assert.equal(v4.endpoint, endpoint);
    });
  });
  
  describe("create signature method", ()=>{
    const v4 = new NiftyCloud.V4(
      "12345678901234567890",
      "1234567890abcdefghijklmnopqrstuvwxyzABCD",
      endpoint
    );

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
        assert.equal(expect, scope);
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
        const secret = v4.createSecret(params).toString("hex");
        assert.equal(expect, secret);
      });
    });
    describe("createEncodedRequestPayload method", ()=>{
      it("should create valid hash of payload", ()=>{
        const headerParams = {
          "content-type": "application/json",
        };
        const expect = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        const payload = v4.createEncodedRequestPayload(null, headerParams);
        assert.equal(expect, payload);
      });
    });
    describe("stringToSign method", ()=>{
      it("should create valid string to sign", ()=>{
        const params = {
          header: {
            "X-Nifty-Date": "20160427T025932Z"
          },
          region: "east-1",
          serviceId: "rdb",
          canonicalRequest: "GET\n/\nAction=CreateDBSecurityGroup&DBSecurityGroupDescription=%E3%83%86%E3%82%B9%E3%83%88%E3%83%95%E3%82%A1%E3%82%A4%E3%82%A2%E3%82%A6%E3%82%A9%E3%83%BC%E3%83%AB&DBSecurityGroupName=test-fire-wall&NiftyAvailabilityZone=east-11\nhost:rdb.jp-east-1.api.cloud.nifty.com\nx-nifty-date:20160427T025932Z\n\nhost;x-nifty-date\ne3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        };
        const expect = "NIFTY4-HMAC-SHA256\n20160427T025932Z\n20160427/east-1/rdb/nifty4_request\n0342e5ade7ccb557f1d64c5e8a64f5beab49016c5675aca13cb285d8979cf8a0";
        const stringToSign = v4.stringToSign(params);
        assert.equal(expect, stringToSign);
      });
    });
    describe("createSignature method", ()=>{
      it("should create valid string to sign", ()=>{
        const params = {
          method: "GET",
          path: "/",
          header: {
            "Host": "rdb.jp-east-1.api.cloud.nifty.com",
            "X-Nifty-Date": "20160427T025932Z"
          },
          query: qs.parse("Action=CreateDBSecurityGroup&NiftyAvailabilityZone=east-11&DBSecurityGroupDescription=テストファイアウォール&DBSecurityGroupName=test-fire-wall"),
          body: null,
          region: "east-1",
          serviceId: "rdb"
        };
        const expect = "d2e766e939478e65f6521fcda574e30b7cfa0d9332ccd2473c25fdd8a895073b";
        const signature = v4.createSignature(params);
        assert.equal(expect, signature, "signature is invalid");
      });
    });
    describe("createAuthorizationHeader method", ()=>{
      it("should return authorization header", ()=>{
        const params = {
          method: "GET",
          path: "/",
          header: {
            "Host": "rdb.jp-east-1.api.cloud.nifty.com",
            "X-Nifty-Date": "20160427T025932Z"
          },
          query: qs.parse("Action=CreateDBSecurityGroup&NiftyAvailabilityZone=east-11&DBSecurityGroupDescription=テストファイアウォール&DBSecurityGroupName=test-fire-wall"),
          body: null,
          region: "east-1",
          serviceId: "rdb"
        };
        const expect = "NIFTY4-HMAC-SHA256 Credential=12345678901234567890/20160427/east-1/rdb/nifty4_request, SignedHeaders=host;x-nifty-date, Signature=d2e766e939478e65f6521fcda574e30b7cfa0d9332ccd2473c25fdd8a895073b";

        const signature = v4.createSignature(params);
        const authorization = v4.createAuthorizationHeader(params, signature);
        assert.equal(expect, authorization, "authorization is invalid");
      });
    });
  });
  describe("sendRequestWithSignature method", ()=>{
    const v4 = new NiftyCloud.V4(
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
        v4.sendRequestWithSignature("get", "/", "east-1", "rdb", {
          header: {
            "Content-Type": "application/xml"
          },
          callback: (err, res)=>{
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
      it("should return correct response as Object in promise", (next)=>{
        v4.sendRequestWithSignature("get", "/", "east-1", "rdb", {
          header: {
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
    describe("with invalid request parameters", ()=>{
      it("should return invalid parameters error if path is not string", (next)=>{
        v4.sendRequestWithSignature("get", 111, "east-1", "rdb", {}).then().catch((err)=>{
          assert.ok(err instanceof v4.InvalidParametersError, `actual type: ${typeof err}`);
          next();
        }); 
      });
      it("should return invalid parameters error if region is not string", (next)=>{
        v4.sendRequestWithSignature("get", "/", 111, "rdb", {}).then().catch((err)=>{
          assert.ok(err instanceof v4.InvalidParametersError, `actual type: ${typeof err}`);
          next();
        }); 
      });
      it("should return invalid parameters error if serviceId is not string", (next)=>{
        v4.sendRequestWithSignature("get", "/", "east-1", 111, {}).then().catch((err)=>{
          assert.ok(err instanceof v4.InvalidParametersError, `actual type: ${typeof err}`);
          next();
        }); 
      });
    });
  });
  describe("api request method", ()=>{
    const path = "/";
    const region = "east-1";
    const serviceId = "rdb";
    const expectResponse = {"result":"ok"};
    const v4 = new NiftyCloud.V4(
      "12345678901234567890",
      "1234567890abcdefghijklmnopqrstuvwxyzABCD",
      endpoint
    );
    describe("with header parameter", ()=>{
      before(()=>{
        nock(endpoint)
          .matchHeader('content-type', 'application/json')
          .matchHeader('x-nifty-date', function(dateValue){
              if(dateValue !== "") {
                return true;
              } else {
                return false;
              }
            })
          .matchHeader('authorization', function(authorizationValue){
            if(authorizationValue !== "") {
              return true;
            } else {
              return false;
            }
          })
          .delete(path)
          .reply(200, expectResponse);
      });
      it("should send header parameter in delete method", (next)=>{
        v4.delete(path, region, serviceId, {
          header: {"Content-Type": "application/json"}
        }).then((res)=>{
          assert.deepEqual(res.body, expectResponse);
          next();
        });
      });
    });
    describe("with query parameter in get method", ()=>{
      before(()=>{
        nock(endpoint).get(path)
                      .query({key: "value"}) 
                      .reply(200, expectResponse);
      });
      it("should send query parameter", (next)=>{
        v4.get(path, region, serviceId, {
          query: {key: "value"}
        }).then((res)=>{
          assert.deepEqual(res.body, expectResponse);
          next();
        });
      });
    });
    describe("with body parameter in put and post method", ()=>{
      before(()=>{
        nock(endpoint).post(path, {key: "value"})
                      .reply(200, expectResponse);
        nock(endpoint).put(path, {key: "value"})
                      .reply(200, expectResponse);
      });
      it("should send body parameter in post method", (next)=>{
        v4.post(path, region, serviceId, {
          header: {"content-type":"application/json"},
          body: {key: "value"}
        }).then((res)=>{
          assert.deepEqual(res.body, expectResponse);
          next();
        }).catch((err)=>{console.log(err);console.log(res);});
      });
      it("should send body parameter in put method", (next)=>{
        v4.put(path, region, serviceId, {
          header: {"content-type":"application/json"},
          body: {key: "value"}
        }).then((res)=>{
          assert.deepEqual(res.body, expectResponse);
          next();
        });
      });
    });
  });
});
