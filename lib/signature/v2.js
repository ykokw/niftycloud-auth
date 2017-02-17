"use strict";

const crypto      = require("crypto");
const url         = require("url");
const Joi         = require("joi");

const Utils       = require("./utils");
const Client      = require("./client");

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
    if (typeof(action) !== "string") return this.handleError(new this.InvalidParametersError("Action must be string"), cb);
    if (typeof(queries) !== "object") return this.handleError(new this.InvalidParametersError("Action must be string"), cb);
    const method = "get";
    const requestQueries = Object.assign({}, queries, {Action: action});
    this.createSignature({
      method: method.toUpperCase(),
      url: url.parse(this.endpoint + path),
      queries: requestQueries 
    });
    return this.sendRequest(method, path, {
      queries: requestQueries,
      cb: cb
    });
  }
}

module.exports = V2;
