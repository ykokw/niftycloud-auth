"use strict";

const crypto      = require("crypto");
const url         = require("url");
const co          = require("co");
const Joi         = require("joi");

const Utils       = require("./utils");
const Client      = require("./client");

const requestSchema = {
  path: Joi.string().required(),
  action: Joi.string().required(),
  options    : Joi.object({
    query    : Joi.object().optional(),
    callback : Joi.func().optional()
  }).optional()
};

class V2 extends Client{
  constructor(accessKey = "", secretKey = "", endpoint = "", proxy = "") {
    super(endpoint, proxy);

    this.accessKey = accessKey;
    this.secretKey = secretKey;
  }
  createSignature(opt) {
    let hmac = crypto.createHmac("sha256", `${this.secretKey}`);
    hmac.update(`${this.stringToSign(opt)}`);
    opt.query["Signature"] = hmac.digest("base64");
  }

  stringToSign(opt) {
    opt.query["AccessKeyId"] = this.accessKey;
    opt.query["SignatureMethod"] = "HmacSHA256";
    opt.query["SignatureVersion"] = "2";
    const hostname = opt.url.hostname;
    const path = opt.url.pathname;
    const str = opt.method + "\n" + 
      hostname + "\n" +
      path + "\n" +
      Utils.canonicalQueryString(opt.query);
    return str;
  }

  get(path = "", action = "", options = {}) {
    return co.call(this, function* (){
      const method = "get";
      const values = yield this.validateReqParameters({
        path: path,
        action: action,
        options: options 
      }, requestSchema);
      const requestQuery = Object.assign({}, values.options.query, {Action: action});
      this.createSignature({
        method: method.toUpperCase(),
        url: url.parse(this.endpoint + path),
        query: requestQuery 
      });
      return this.sendRequest(method, path, {
        query: requestQuery,
        cb: values.options.callback
      });
    }).catch((err)=>{
      return this.handleError(err, options.callback);
    });
  }
}

module.exports = V2;
