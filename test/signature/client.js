"use strict";

const assert      = require('power-assert');
const url         = require("url");
const fs          = require("fs");
const qs          = require("qs");
const parseString = require('xml2js').parseString;
const nock        = require("nock");

const Client = require("../../lib/signature/client");

const endpoint = "https://east-1.cp.cloud.nifty.com";

describe("Client class", ()=>{
  describe("constructor", ()=>{
    it("should set empty string as default parameter when parameter is not defined", ()=>{
      const cli = new Client();
      assert.equal(cli.accessKey ,"");
      assert.equal(cli.secretKey , "");
      assert.equal(cli.endpoint , "");
      assert.equal(cli.proxy , "");
    });
    it("should set specified parameters", ()=>{
      const cli = new Client(
        "12345678901234567890",
        "1234567890abcdefghijklmnopqrstuvwxyzABCD",
        endpoint,
        ""
      );
      assert.equal(cli.accessKey , "12345678901234567890");
      assert.equal(cli.secretKey , "1234567890abcdefghijklmnopqrstuvwxyzABCD");
      assert.equal(cli.endpoint , endpoint);
      assert.equal(cli.proxy , "");
    });
    it("should set default parameter when parameter is not specified", ()=>{
      const cli = new Client(
        "12345678901234567890",
        "1234567890abcdefghijklmnopqrstuvwxyzABCD"
      );
      assert.equal(cli.accessKey , "12345678901234567890");
      assert.equal(cli.secretKey , "1234567890abcdefghijklmnopqrstuvwxyzABCD");
      assert.equal(cli.endpoint , "");
      assert.equal(cli.proxy , "");
    });
  });
  describe.only("sendRequest method", ()=>{
    const client = new Client(
      "12345678901234567890",
      "1234567890abcdefghijklmnopqrstuvwxyzABCD",
      endpoint
    );
    before(()=>{
      nock(endpoint).get("/api/validXmlResponse")
                    .times(2)
                    .replyWithFile(200,
                      "./test/mock/validResponse.xml",
                      {
                        "Content-Type":"application/xml"
                      });

      nock(endpoint).get("/api/validJsonResponse")
                    .times(2)
                    .reply(200, {"result":"ok"});

      nock(endpoint).get("/api/validStringResponse")
                    .times(2)
                    .reply(200, "ok");

      nock(endpoint).get("/api/validEmptyResponse")
                    .times(2)
                    .reply(204, null);

      nock(endpoint).get("/api/brokenXmlResponse")
                    .times(2)
                    .replyWithFile(400,
                      "./test/mock/brokenResponse.xml",
                      {
                        "Content-Type":"application/xml"
                      });

      nock(endpoint).get("/api/errorXmlResponse")
                    .times(2)
                    .replyWithFile(400,
                      "./test/mock/errorResponse.xml",
                      {
                        "Content-Type":"application/xml"
                      });

      nock(endpoint).get("/api/errorJsonResponse")
                    .reply(400, {"error":"k"});
    });
    it("shoud return valid xml response as Object in callback", (next)=>{
      const params = {
        cb    : (err, res)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/validResponse.xml");
          parseString(expectResponseXml, (parseErr, result)=>{
            assert(err === null);
            assert(parseErr === null);
            assert.deepEqual(res, result, "response didn't match");
            next();
          });
        }
      };
      client.sendRequest("get", "/api/validXmlResponse", params);
    });
    it("shoud return valid xml response as Object in promise", (next)=>{
      client.sendRequest("get", "/api/validXmlResponse").then((res)=>{
        const expectResponseXml = fs.readFileSync("./test/mock/validResponse.xml");
        parseString(expectResponseXml, (parseErr, result)=>{
          assert(parseErr === null);
          assert.deepEqual(res, result, "response didn't match");
          next();
        });
      }).catch(next);
    });
    it("shoud return valid json response as Object in callback", (next)=>{
      const params = {
        cb    : (err, res)=>{
          assert(err === null);
          assert.deepEqual(res.body, {"result":"ok"});
          next();
        }
      };
      client.sendRequest("get", "/api/validJsonResponse", params);

    });
    it("shoud return valid json response as Object in promise", (next)=>{
      client.sendRequest("get", "/api/validJsonResponse").then((res)=>{
        assert.deepEqual(res.body, {"result":"ok"});
        next();
      }).catch(next);
    });
    it("shoud return api error response as Object in callback", (next)=>{
      const params = {
        cb    : (err, res)=>{
          assert.equal(res, null);
          assert(err instanceof client.ApiError);
          assert.equal(err.name, "ApiError");
          assert.equal(err.statusCode, 400);
          const expectResponseXml = fs.readFileSync("./test/mock/errorResponse.xml");
          parseString(expectResponseXml, (parseErr, result)=>{
            assert.equal(err.errorCode, result.Response.Errors[0].Error[0].Code[0]);
            assert.equal(err.message, result.Response.Errors[0].Error[0].Message[0]);
            next();
          });
        }
      };
      client.sendRequest("get", "/api/errorXmlResponse", params);
    });
    it("shoud return api error response as Object in promise", (next)=>{
      client.sendRequest("get", "/api/errorXmlResponse").then((res)=>{}).catch((err)=>{
        assert(err instanceof client.ApiError);
        assert.equal(err.name, "ApiError");
        assert.equal(err.statusCode, 400);
        const expectResponseXml = fs.readFileSync("./test/mock/errorResponse.xml");
        parseString(expectResponseXml, (parseErr, result)=>{
          assert.equal(err.errorCode, result.Response.Errors[0].Error[0].Code[0]);
          assert.equal(err.message, result.Response.Errors[0].Error[0].Message[0]);
          next();
        });
      });
    });
    it("shoud return parse response error response as Object in callback", (next)=>{
      const params = {
        cb    : (err, res)=>{
          assert.equal(res, null);
          assert(err instanceof client.ParseResponseError);
          assert.equal(err.name, "ParseResponseError");
          assert.equal(err.message, "Response data is broken");
          assert.equal(err.statusCode, 400);
          next();
        }
      };
      client.sendRequest("get", "/api/brokenXmlResponse", params);
    });
    it("shoud return parse response error response as Object in promise", (next)=>{
      client.sendRequest("get", "/api/brokenXmlResponse").then((res)=>{}).catch((err)=>{
        assert(err instanceof client.ParseResponseError);
        assert.equal(err.name, "ParseResponseError");
        assert.equal(err.message, "Response data is broken");
        assert.equal(err.statusCode, 400);
        next();
      });
    });
    //it("shoud return invalid parameters error response as Object in promise", (next)=>{});
    //it("shoud return invalid parameters error response as Object in promise", (next)=>{});
  });
});
