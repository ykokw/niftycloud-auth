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
    callback : Joi.func().optional()
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
  
  sendRequestWithSignature(method = "", path = "", options = {}){
    return co.call(this, function* (){
      const values = yield this.validateReqParameters({
        path: path,
        options: options
      }, requestSchema);
      this.createSignature({
        method: method.toUpperCase(),
        url: url.parse(this.endpoint + path),
        headers: Object.assign({}, values.options.headers),
        queries: Object.assign({}, values.options.queries)
      });
      return this.sendRequest(method, path, {
        headers: values.options.headers,
        queries: values.options.queries,
        cb: values.options.callback
      });
    }).catch((err)=>{
      return this.handleError(err, options.callback);
    });
  }

  get(path, options){
    const method = "get";
    return this.sendRequestWithSignature(method, path, options);
  }

  put(path, options){
    const method = "put";
    return this.sendRequestWithSignature(method, path, options);
  }
  
  post(path, options){
    const method = "post";
    return this.sendRequestWithSignature(method, path, options);
  }
  
  delete(path, options){
    const method = "delete";
    return this.sendRequestWithSignature(method, path, options);
  }
}

module.exports = V3;
