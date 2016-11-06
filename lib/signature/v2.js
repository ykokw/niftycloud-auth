"use strict";

const crypto      = require("crypto");
const url         = require("url");
const qs          = require("qs");
const request     = require('superagent');
const sortObject  = require("sort-object");
const parseString = require('xml2js').parseString;
const Checkit     = require("checkit");

const Errors      = require("../errors");
const Utils       = require("./utils");
const Client      = require("./client");

class V2 extends Client{
  constructor(params) {
    super(params);
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

  get(queries, cb) {
    const requestParams = {
      path: "",
      method: "get",
      headers: {},
      queries: queries,
      bodies: null,
      cb: cb
    };
    return this.sendRequest(requestParams);
  }

  sendRequest(req){
    if (req === null || req.queries === null ) return Promise.reject(new Errors.InvalidParameterError("queries is must not be null."));
 
    this.createSignature({
      method: "GET",
      url: this.endpoint + "/api/?",
      queries: req.queries
    });
    req.url = url.parse(this.endpoint + "/api/?" + qs.stringify(req.queries));

    const checkit = new Checkit({
      Action: ["required", "alpha"]
    });
    const [err, validated] = checkit.validateSync(req.queries);
    if (err !== null){
      const invalidParameterErr = new Errors.InvalidParameterError("Invalid parameter");
      if (typeof req.cb === "function") {
        req.cb(invalidParameterErr, null);
      } else {
        return Promise.reject(invalidParameterErr);
      }
    } else {
      return super.sendRequest(req);
    }
  }
}

module.exports = V2;
