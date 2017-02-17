"use strict";

const crypto      = require("crypto");
const qs          = require("qs");
const co          = require("co");
const Joi         = require("joi");
const moment      = require("moment");

const Utils       = require("./utils");
const Client      = require("./client");

const requestSchema = {
  path: Joi.string().required(),
  region: Joi.string().required(),
  serviceId: Joi.string().required(),
  options  : Joi.object({
    header: Joi.object().optional(),
    query: Joi.object().optional(),
    body : Joi.object().optional(),
    callback : Joi.func().optional()
  }).optional()
};

class V4 extends Client{
  constructor(accessKey = "", secretKey = "", endpoint = "", proxy = "") {
    super(endpoint, proxy);

    this.accessKey = accessKey;
    this.secretKey = secretKey;
  }
  createSignature(opt) {
    opt.canonicalRequest = `${opt.method}\n${opt.path}\n${Utils.canonicalQueryString(opt.query)}\n${Utils.canonicalHeaderString(opt.header, 4)}\n\n${Utils.createSignedHeaderString(opt.header)}\n${this.createEncodedRequestPayload(opt.body, opt.header)}`;
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
    if (opt.header && opt.header.hasOwnProperty("X-Nifty-Date")) {
      opt.requestDate = opt.header["X-Nifty-Date"];
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

  createEncodedRequestPayload(body, header) {
 
    let payloadString = "";
    if (body !== null){
      payloadString = new Buffer(qs.stringify(body), 'utf8');
    }

    const hash = crypto.createHash("sha256");
    hash.update(payloadString);
    const out = hash.digest("hex");
    return out;
  }

  get(path, region, serviceId, options) {
    return this.sendRequestWithSignature("get", path, region, serviceId, options);
  }

  post(path, region, serviceId, options) {
    return this.sendRequestWithSignature("post", path, region, serviceId, options);
  }
  
  put(path, region, serviceId, options) {
    return this.sendRequestWithSignature("put", path, region, serviceId, options);
  }
  
  delete(path, region, serviceId, options) {
    return this.sendRequestWithSignature("delete", path, region, serviceId, options);
  }

  createAuthorizationHeader(params, signature){
    return `NIFTY4-HMAC-SHA256 Credential=${this.accessKey}/${params.canonicalScope}, SignedHeaders=${Utils.createSignedHeaderString(params.header)}, Signature=${signature}`;
  }

  sendRequestWithSignature(method = "", path = "", region = "", serviceId = "", {header, query, body, callback} = {}){
    return co.call(this, function* (){
      const values = yield this.validateReqParameters({
        path: path,
        region: region,
        serviceId: serviceId,
        options: {
          header  : header,
          query   : query,
          body    : body,
          callback: callback
        }
      }, requestSchema);
      const signatureObject = {
        method: method.toUpperCase(),
        path: path,
        region: region,
        serviceId: serviceId,
        header: Object.assign({}, values.options.header, {"X-Nifty-Date": moment().format("YYYYMMDDTHHmmss") + "Z"}),
        query: Object.assign({}, values.options.query),
        body: Object.assign({}, values.options.body)
      };
      const signature = this.createSignature(signatureObject);
      return this.sendRequest(method, path, {
        header: Object.assign({}, values.options.header, {Authorization: this.createAuthorizationHeader(signatureObject, signature)}),
        query : values.options.query,
        body  : values.options.body,
        cb: values.options.callback
      });
    }).catch((err)=>{
      return this.handleError(err, callback);
    });
  }
}

module.exports = V4;
