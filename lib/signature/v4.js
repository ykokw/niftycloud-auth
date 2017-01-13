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
    opt.canonicalRequest = `${opt.method}\n${opt.path}\n${Utils.canonicalQueryString(opt.queries)}\n${Utils.canonicalHeaderString(opt.headers, 4)}\n\n${Utils.createSignedHeaderString(opt.headers)}\n${this.createEncodedRequestPayload(opt.bodies, opt.headers)}`;
    const stringToSign = this.stringToSign(opt);
    const secret = this.createSecret(opt);
    if (stringToSign == null || secret == null) {
      return null;
    }
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(stringToSign);
    return hmac.digest("hex");
  }

  stringToSign(opt) {
    if (opt.headers && opt.headers.hasOwnProperty("X-Nifty-Date")) {
      opt.requestDate = opt.headers["X-Nifty-Date"];
    } else {
      return null;
    }
    opt.canonicalScope = this.createCanonicalScope(opt);
    const hash = crypto.createHash("sha256");
    hash.update(new Buffer(opt.canonicalRequest, "utf8"));
    const encodedCanonicalRequest = hash.digest("hex");
    return `NIFTY4-HMAC-SHA256\n${opt.requestDate}\n${opt.canonicalScope}\n${encodedCanonicalRequest}`;
  }

  createSecret(opt) {
    const hmacForDate = crypto.createHmac("sha256", `NIFTY4${this.secretKey}`);
    hmacForDate.update(opt.requestDate.substr(0, 8));
    const kDate = hmacForDate.digest();
    
    const hmacForRegion = crypto.createHmac("sha256", kDate);
    hmacForRegion.update(opt.region);
    const kRegion = hmacForRegion.digest();

    const hmacForService = crypto.createHmac("sha256", kRegion);
    hmacForService.update(opt.serviceId);
    const kServiceId = hmacForService.digest();
    
    const hmacForSecret = crypto.createHmac("sha256", kServiceId);
    hmacForSecret.update("nifty4_request");
    return hmacForSecret.digest();
  }

  createCanonicalScope(opt) {
    return `${opt.requestDate.substr(0, 8)}/${opt.region}/${opt.serviceId}/nifty4_request`;
  }

  createEncodedRequestPayload(bodies, headers) {
 
    let payloadString = "";
    if (bodies !== null){
      payloadString = new Buffer(qs.stringify(bodies), 'utf8');
    }

    const hash = crypto.createHash("sha256");
    hash.update(payloadString);
    const out = hash.digest("hex");
    return out;
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

  post(path, headers, queries, bodies, serviceId, region, cb) {
    const requestParams = {
      path: path,
      method: "post",
      headers: headers,
      queries: queries,
      bodies: bodies,
      serviceId: serviceId,
      region: region,
      cb: cb
    };
    return this.sendRequest(requestParams);
  }

  createAuthorizationHeader(params, signature){
    return `NIFTY4-HMAC-SHA256 Credential=${this.accessKey}/${params.canonicalScope}, SignedHeaders=${Utils.createSignedHeaderString(params.headers)}, Signature=${signature}`;
  }

  sendRequest(req){
    if (req === null) return Promise.reject(new Errors.InvalidParameterError("request object must not be null."));
    req.headers["X-Nifty-Date"] = moment().format("YYYYMMDDTHHmmss") + "Z";
    const signatureObject = {
      method: req.method.toUpperCase(),
      path: req.path,
      queries: req.queries,
      headers: req.headers,
      bodies: req.bodies,
      serviceId: req.serviceId,
      region: req.region,
    };
    const signature = this.createSignature(signatureObject);
    if (signature === null ) return Promise.reject(new Errors.InvalidParameterError("Can't create signature. Please confirm your request parameters."));

    req.headers["Authorization"] = this.createAuthorizationHeader(signatureObject, signature);


    return super.sendRequest(req);
  }
}

module.exports = V4;
