"use strict";

const crypto      = require("crypto");
const url         = require("url");
const qs          = require("qs");
const request     = require('superagent');
const sortObject  = require("sort-object");
const parseString = require('xml2js').parseString;
const Checkit     = require("checkit");
const moment      = require("moment");

const Errors      = require("../errors");
const Utils       = require("./utils");
const Client      = require("./client");

class V4 extends Client{
  constructor(params) {
    super(params);
  }
  
  createSignature(opt) {
    opt.canonicalRequest = `${opt.method}\n${opt.path}\n${Utils.canonicalQueryString(opt.queries)}\n${Utils.canonicalHeaderString(opt.headers)}\n\n${Utils.createSignedHeaderString(opt.headers)}\n${this.createEncodedRequestPayload(opt.bodies, opt.headers)}`;
    const stringToSign = this.stringToSign(opt);
    const secret = this.createSecret(opt);
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${this.stringToSign(opt)}`);
    return hmac.digest("hex");
  }

  stringToSign(opt) {
    opt.requestDate = moment.format("YYYYMMDDTHHmmss") + "Z";
    opt.canonicalScope = this.createCanonicalScope(opt);
    const hash = crypto.createHash("sha256");
    hash.update(opt.canonicalRequest);
    const encodedCanonicalRequest = hash.digest("hex");
    return `NIFTY4-HMAC-SHA256\n${opt.requestDate}\n${opt.canonicalScope}\n${encodedCanonicalRequest}`;
  }

  createSecret(opt) {
    const hmacForDate = crypto.createHmac("sha256", `NIFTY4${this.secretKey}`);
    hmacForDate.update(opt.requestDate.substr(0, 8));
    const kDate = hmacForDate.digest(null);
    
    const hmacForRegion = crypto.createHmac("sha256", kDate);
    hmacForRegion.update(opt.region);
    const kRegion = hmacForRegion.digest(null);

    const hmacForService = crypto.createHmac("sha256", kRegion);
    hmacForService.update(opt.serviceId);
    const kServiceId = hmacForService.digest(null);
    
    const hmacForSecret = crypto.createHmac("sha256", kServiceId);
    hmacForSecret.update("nifty4_request");
    return hmacForSecret.digest("hex");
  }

  createCanonicalScope(opt) {
    return `${opt.requestDate.substr(0, 8)}/${opt.region}/${opt.serviceId}/nifty4_request`;
  }

  createEncodedRequestPayload(bodies, headers) {
    const TYPE_JSON = "application/json";
    let contentType = TYPE_JSON;
    if (headers !== null && headers.hasOwnProperty("content-type")) {
      contentType = headers["content-type"];
    } else if (headers !== null && headers.hasOwnProperty("Content-Type")) {
      contentType = headers["Content-Type"];
    }
 
    let payloadString = "";
    if (bodies === null){
      payloadString = "";
    } else if (contentType === TYPE_JSON) {
      payloadString = JSON.stringify(bodies);
    }

    const hash = crypto.createHash("sha256");
    hash.update(payloadString);
    return hash.digest("hex");
  }

  get(path, headers, queries, serviceId, region, cb) {
    const requestParams = {
      path: path,
      method: "get",
      headers: headers,
      queries: queries,
      bodies: null,
      serviceId: serviceId,
      region: region,
      cb: cb
    };
    return this.sendRequest(requestParams);
  }

  sendRequest(req){
    if (req === null || req.queries === null ) return Promise.reject(new Errors.InvalidParameterError("queries must not be null."));
    
    const originalRequestHeaders = Object.assign({}, req.headers);
    const signatureObject = {
      method: "GET",
      path: path,
      url: this.endpoint + "/api/?",
      queries: req.queries,
      headers: req.headers,
      bodies: req.bodies
    };
    const signature = this.createSignature(signatureObject);

    req.headers["X-Nifty-Date"] = signatureObject.requestDate;
    req.headers["Authorization"] = `NIFTY4-HMAC-SHA256 Credential=${this.accessKey}/${signatureObject.canonicalScope} SignedHeaders=${Utils.createSignedHeaderString(originalRequestHeaders)} Signature=${signature}`;

    return super.sendRequest(req);
  }
}

module.exports = V4;
