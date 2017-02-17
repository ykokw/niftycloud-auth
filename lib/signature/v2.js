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
  queries: Joi.object().optional()
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
    opt.queries["Signature"] = hmac.digest("base64");
  }

  stringToSign(opt) {
    opt.queries["AccessKeyId"] = this.accessKey;
    opt.queries["SignatureMethod"] = "HmacSHA256";
    opt.queries["SignatureVersion"] = "2";
    const hostname = opt.url.hostname;
    const path = opt.url.pathname;
    const str = opt.method + "\n" + 
      hostname + "\n" +
      path + "\n" +
      Utils.canonicalQueryString(opt.queries);
    return str;
  }

  get(path, action = "", queries = {}, cb) {
    return co.call(this, function* (){
      const method = "get";
      const requestQueries = Object.assign({}, queries, {Action: action});
      const values = yield this.validateReqParameters({
        path: path,
        action: action,
        queries: queries
      }, requestSchema);
      this.createSignature({
        method: method.toUpperCase(),
        url: url.parse(this.endpoint + path),
        queries: requestQueries 
      });
      return this.sendRequest(method, path, {
        queries: requestQueries,
        cb: cb
      });
    }).catch((err)=>{
      return this.handleError(err, cb);
    });
  }
}

module.exports = V2;
