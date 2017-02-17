"use strict";

const crypto      = require("crypto");
const url         = require("url");
const qs          = require("qs");
const co          = require("co");
const Joi         = require("joi");

const Errors      = require("../errors");
const Utils       = require("./utils");
const Client      = require("./client");

const requestSchema = {
  path: Joi.string().required(),
  options  : Joi.object({
    headers: Joi.object().optional(),
    queries: Joi.object().optional(),
    bodies : Joi.object().optional(),
  }).optional()
};

class V3 extends Client{
  constructor(accessKey = "", secretKey = "", endpoint = "", proxy = "") {
    super(endpoint, proxy);

    this.accessKey = accessKey;
    this.secretKey = secretKey;
  }
  createSignature(opt) {
    let hmac = crypto.createHmac("sha1", `${this.secretKey}`);
    hmac.update(`${this.stringToSign(opt)}`);
    opt.headers["Authorization"] = `AWS ${this.accessKey}:${hmac.digest("base64")}`;
  }

  stringToSign(opt) {
    const path = opt.url.pathname;
    if (!opt.headers.hasOwnProperty("Content-MD5")) {
      opt.headers["Content-MD5"] = "";
    }
    let str = opt.method + "\n" +
      Utils.canonicalHeaderString(opt.headers) + "\n" + path;
      if (qs.stringify(opt.url.query) !== ""){
        str += "?" +  Utils.canonicalQueryString(qs.parse(opt.url.query));
      }
    return str;
  }

  get(path, opt, cb){
    return co.call(this, function* (){
      const method = "get";
      const values = yield this.validateReqParameters({
        path: path,
        options: opt
      }, requestSchema);
      this.createSignature({
        method: method.toUpperCase(),
        url: url.parse(this.endpoint + path),
        headers: Object.assign({}, values.headers),
        queries: Object.assign({}, values.queries)
      });
      return this.sendRequest(method, path, {
        headers: values.headers,
        queries: values.queries,
        cb: cb
      });
    }).catch((err)=>{
      return this.handleError(err, cb);
    });
  }

  put(path, headers, queries, bodies, cb){
    const requestParams = {
      path: path,
      method: "put",
      headers: headers,
      queries: queries,
      bodies: bodies,
      cb: cb
    };
    return this.sendRequest(requestParams);
  }

  post(path, headers, queries, bodies, cb){
    const requestParams = {
      path: path,
      method: "post",
      headers: headers,
      queries: queries,
      bodies: bodies,
      cb: cb
    };
    return this.sendRequest(requestParams);
  }
  
  delete(path, headers, queries, cb){
    const requestParams = {
      path: path,
      method: "delete",
      headers: headers,
      queries: queries,
      bodies: null,
      cb: cb
    };
    return this.sendRequest(requestParams);
  }
}

module.exports = V3;
