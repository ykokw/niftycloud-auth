"use strict";

const assert      = require('power-assert');
const url         = require("url");
const fs          = require("fs");
const qs          = require("qs");
const parseString = require('xml2js').parseString;
const nock        = require("nock");

const Client = require("../../lib/signature/client");

const endpoint = "https://east-1.cp.cloud.nifty.com";
const exampleProxyEndpoint = "http://example.com";
const exampleAuthType = "aws";
const defaultType = 'application/x-www-form-urlencoded;charset=UTF-8';
const jsonType = 'application/json;charset=utf-8';
const xmlType = 'application/xml;charset=utf-8';
const textXmlType = 'text/xml;charset=utf-8';
const textType = 'text/plain;charset=utf-8';

describe("Client class", ()=>{
  describe("constructor", ()=>{
    it("should set empty string as default parameter when parameter is not defined", ()=>{
      const cli = new Client();
      assert.equal(cli.endpoint , "");
      assert.equal(cli.proxy , "");
      assert.equal(cli.authType , "nifty");
    });
    it("should set specified parameters", ()=>{
      const cli = new Client(endpoint, {
        proxy: exampleProxyEndpoint,
        authType: exampleAuthType
      });
      assert.equal(cli.endpoint , endpoint);
      assert.equal(cli.proxy , exampleProxyEndpoint);
      assert.equal(cli.authType, exampleAuthType);
    });
  });
  describe("validateReqParameters method", ()=>{
    it("should returns validate values", (next)=>{
      const cli = new Client(endpoint);
      const params = {
        method    : "get",
        urlString : endpoint + "/api",
      };
      cli.validateReqParameters(params).then((values)=> {
        assert.equal(values.method, "get");
        next();
      }).catch(next);
    });
    it("should returns InvalidParametersError when invalid parameter is specified", (next)=>{
      const cli = new Client(endpoint);
      const params = {
        method    : "head", //invalid
        urlString : endpoint + "/api",
      };
      cli.validateReqParameters(params).then().catch((err)=> {
        assert.equal(err.result[0].path, "method");
        next();
      }).catch(next);
    });
  });
  describe("createRequest method", ()=>{
    before(()=>{
      nock(endpoint, {
        reqheader: {
          'content-type': defaultType
        }
      }).get("/api")
        .replyWithFile(200,
          "./test/mock/validResponse.xml",
          {
            "Content-Type": xmlType
          });

      nock(endpoint, {
        reqheader: {
          'content-type': jsonType
        }
      }).get("/api").reply(200, {"result":"ok"});
    });
    it("should return default request object", (next)=>{
      const client = new Client(
        endpoint
      );
      const req = client.createRequest("get", endpoint + "/api", null);
      req.then((res)=>{
        assert.equal(res.status, 200);
        assert.equal(res.header["content-type"], xmlType);
        next();
      }).catch(next);
    });
    it("should return request object with customize header", (next)=>{
      const client = new Client(
        endpoint
      );
      const req = client.createRequest("get", endpoint + "/api", {
        header: {"content-type": jsonType}
      });
      req.then((res)=>{
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, {"result":"ok"});
        next();
      }).catch(next);
    });
  });
  describe("parseXml method", ()=>{
    it("should return parse result", (next)=>{
      const client = new Client(
        endpoint
      );
      const xml = '<RebootInstancesResponse xmlns="https://cp.cloud.nifty.com/api/"> <requestId>ad2adb5f-3b7a-4574-9b7d-8dd49f6dad4e</requestId><return>true</return></RebootInstancesResponse>';
      client.parseXml("resonse", xml).then((res)=>{
        assert.equal(res["RebootInstancesResponse"]["requestId"], "ad2adb5f-3b7a-4574-9b7d-8dd49f6dad4e");
        next();
      }).catch(next);
    });
  });
  describe("sendRequest method", ()=>{
    const client = new Client(
      endpoint
    );
    before(()=>{
      nock(endpoint).get("/api/validXmlResponse")
                    .times(2)
                    .replyWithFile(200,
                      "./test/mock/validResponse.xml",
                      {
                        "Content-Type": xmlType
                      });

      nock(endpoint, {
        reqheader: {
          'content-type': defaultType
        }
      }).get("/api/textXmlResponse")
        .replyWithFile(200,
          "./test/mock/validResponse.xml",
          {
            "Content-Type": textXmlType
          });


      nock(endpoint, {
        reqheader: {
          'content-type': 'application/json'
        }
      }).get("/api/validJsonResponse").times(2).reply(200, {"result":"ok"});

      nock(endpoint).get("/api/validStringResponse")
                    .times(2)
                    .reply(200, "ok", {
                      "Content-Type":textType
                    });

      nock(endpoint).get("/api/validEmptyResponse")
                    .times(2)
                    .reply(204, null,
                      {
                        "Content-Type":xmlType
                      });

      nock(endpoint).get("/api/brokenXmlResponse")
                    .times(2)
                    .replyWithFile(200,
                      "./test/mock/brokenResponse.xml",
                      {
                        "Content-Type":xmlType
                      });

      nock(endpoint).get("/api/errorXmlResponse")
                    .times(2)
                    .replyWithFile(400,
                      "./test/mock/errorResponse.xml",
                      {
                        "Content-Type":xmlType
                      });

      nock(endpoint).get("/api/errorXmlResponseOfObjectStorage")
                    .replyWithFile(403,
                      "./test/mock/errorResponseOfObjectStorage.xml",
                      {
                        "Content-Type":xmlType
                      });

      nock(endpoint).get("/api/errorXmlResponseOfRDB")
                    .replyWithFile(403,
                      "./test/mock/errorResponseOfRDB.xml",
                      {
                        "Content-Type":xmlType
                      });

      nock(endpoint).get("/api/errorJsonResponse")
                    .reply(400, {"error":"k"});
    });
    it("shoud return valid xml response as Object in callback", (next)=>{
      const params = {
        cb    : (err, res)=>{
          const expectResponseXml = fs.readFileSync("./test/mock/validResponse.xml");
          parseString(expectResponseXml, {explicitArray:false}, (parseErr, result)=>{
            assert(err === null);
            assert(parseErr === null);
            assert.deepEqual(res.body, result, "response didn't match");
            next();
          });
        }
      };
      client.sendRequest("get", "/api/validXmlResponse", params);
    });
    it("shoud return valid xml response as Object in promise", (next)=>{
      client.sendRequest("get", "/api/validXmlResponse").then((res)=>{
        const expectResponseXml = fs.readFileSync("./test/mock/validResponse.xml");
        parseString(expectResponseXml, {explicitArray:false}, (parseErr, result)=>{
          assert(parseErr === null);
          assert.deepEqual(res.body, result, "response didn't match");
          next();
        });
      }).catch(next);
    });
    it("shoud return valid text xml response as Object in promise", (next)=>{
      client.sendRequest("get", "/api/textXmlResponse").then((res)=>{
        const expectResponseXml = fs.readFileSync("./test/mock/validResponse.xml");
        parseString(expectResponseXml, {explicitArray:false}, (parseErr, result)=>{
          assert(parseErr === null);
          assert.deepEqual(res.body, result, "response didn't match");
          next();
        });
      }).catch(next);
    });
    it("shoud return valid json response as Object in callback", (next)=>{
      const params = {
        header: {"content-type":jsonType},
        cb    : (err, res)=>{
          assert(err === null);
          assert.deepEqual(res.body, {"result":"ok"});
          next();
        }
      };
      client.sendRequest("get", "/api/validJsonResponse", params);

    });
    it("shoud return valid json response as Object in promise", (next)=>{
      client.sendRequest("get", "/api/validJsonResponse", {
        header: {"content-type":jsonType}
      }).then((res)=>{
        assert.deepEqual(res.body, {"result":"ok"});
        next();
      }).catch(next);
    });
    it("shoud return valid string response as Object in callback", (next)=>{
      const params = {
        cb    : (err, res)=>{
          assert(err === null);
          assert.equal(res.text, "ok");
          next();
        }
      };
      client.sendRequest("get", "/api/validStringResponse", params);

    });
    it("shoud return valid string response as Object in promise", (next)=>{
      client.sendRequest("get", "/api/validStringResponse").then((res)=>{
        assert.equal(res.text, "ok");
        next();
      }).catch(next);
    });
    it("shoud return valid empty response as Object in callback", (next)=>{
      const params = {
        cb    : (err, res)=>{
          assert(err === null);
          assert.equal(res.status, 204);
          assert.equal(res.text, "");
          next();
        }
      };
      client.sendRequest("get", "/api/validEmptyResponse", params);

    });
    it("shoud return valid empty response as Object in promise", (next)=>{
      client.sendRequest("get", "/api/validEmptyResponse").then((res)=>{
        assert.equal(res.status, 204);
        assert.equal(res.text, "");
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
          parseString(expectResponseXml, {explicitArray:false}, (parseErr, result)=>{
            assert.equal(err.errorCode, result.Response.Errors.Error.Code);
            assert.equal(err.message, result.Response.Errors.Error.Message);
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
        parseString(expectResponseXml, {explicitArray:false}, (parseErr, result)=>{
          assert.equal(err.errorCode, result.Response.Errors.Error.Code);
          assert.equal(err.message, result.Response.Errors.Error.Message);
          next();
        });
      });
    });
    it("shoud return api error response of Object storage as Object in promise", (next)=>{
      client.sendRequest("get", "/api/errorXmlResponseOfObjectStorage").then((res)=>{}).catch((err)=>{
        assert(err instanceof client.ApiError);
        assert.equal(err.name, "ApiError");
        assert.equal(err.statusCode, 403);
        const expectResponseXml = fs.readFileSync("./test/mock/errorResponseOfObjectStorage.xml");
        parseString(expectResponseXml, {explicitArray:false}, (parseErr, result)=>{
          assert.equal(err.errorCode, result.Error.Code);
          assert.equal(err.message, "Api returns error");
          next();
        });
      });
    });
    it("shoud return api error response of RDB as Object in promise", (next)=>{
      client.sendRequest("get", "/api/errorXmlResponseOfRDB").then((res)=>{}).catch((err)=>{
        assert(err instanceof client.ApiError);
        assert.equal(err.name, "ApiError");
        assert.equal(err.statusCode, 403);
        const expectResponseXml = fs.readFileSync("./test/mock/errorResponseOfRDB.xml");
        parseString(expectResponseXml, {explicitArray:false}, (parseErr, result)=>{
          assert.equal(err.errorCode, result.ErrorResponse.Error.Code);
          assert.equal(err.message, result.ErrorResponse.Error.Message);
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
          assert.equal(err.message, "response data is broken");
          next();
        }
      };
      client.sendRequest("get", "/api/brokenXmlResponse", params);
    });
    it("shoud return parse response error response as Object in promise", (next)=>{
      client.sendRequest("get", "/api/brokenXmlResponse").then((res)=>{}).catch((err)=>{
        assert(err instanceof client.ParseResponseError);
        assert.equal(err.name, "ParseResponseError");
        assert.equal(err.message, "response data is broken");
        next();
      });
    });
    it("shoud return invalid parameters error response as Object in callback", (next)=>{
      const invalidClient = new Client(
        "invalidEndPoint"
      );
      const params = {
        cb    : (err, res)=>{
          assert.equal(res, null);
          assert(err instanceof client.InvalidParametersError);
          assert.equal(err.name, "InvalidParametersError");
          assert.equal(err.message, "Request parameters is invalid");
          assert.equal(err.result[0].message, '"urlString" must be a valid uri with a scheme matching the http|https pattern');
          next();
        }
      };
      invalidClient.sendRequest("get", "/api", params)
    });
    it("shoud return invalid parameters error response as Object in promise", (next)=>{
      const invalidClient = new Client(
        "invalidEndPoint"
      );
      invalidClient.sendRequest("get", "/api").then((res)=>{}).catch((err)=>{
        assert(err instanceof client.InvalidParametersError);
        assert.equal(err.name, "InvalidParametersError");
        assert.equal(err.message, "Request parameters is invalid");
        assert.equal(err.result[0].message, '"urlString" must be a valid uri with a scheme matching the http|https pattern');
        next();
      });
    });
    it("shoud return invalid parameters error when method is invalid", (next)=>{
      const invalidClient = new Client(
        endpoint
      );
      invalidClient.sendRequest("head", "/api").then((res)=>{}).catch((err)=>{
        assert(err instanceof client.InvalidParametersError);
        assert.equal(err.name, "InvalidParametersError");
        assert.equal(err.message, "Request parameters is invalid");
        assert.equal(err.result[0].path, "method");
        next();
      });
    });
    it("shoud return invalid parameters error when option is invalid type", (next)=>{
      const invalidClient = new Client(
        endpoint
      );
      invalidClient.sendRequest("get", "/api", {header:"content-type: application/json"}).then((res)=>{}).catch((err)=>{
        assert(err instanceof client.InvalidParametersError);
        assert.equal(err.name, "InvalidParametersError");
        assert.equal(err.message, "Request parameters is invalid");
        assert.equal(err.result[0].path, "options.header");
        next();
      });
    });
  });
});
