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
    header: Joi.object().optional(),
    query: Joi.object().optional(),
    body : Joi.object().optional(),
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
    opt.header["Authorization"] = `AWS ${this.accessKey}:${hmac.digest("base64")}`;
  }

  stringToSign(opt) {
    const path = opt.url.pathname;
    if (!opt.header.hasOwnProperty("Content-MD5")) {
      opt.header["Content-MD5"] = "";
    }
    let str = opt.method + "\n" +
      Utils.canonicalHeaderString(opt.header) + "\n" + path;
      if (qs.stringify(opt.url.query) !== ""){
        str += "?" +  Utils.canonicalQueryString(qs.parse(opt.url.query));
      }
    return str;
  }
  
  sendRequestWithSignature(method = "", path = "", {header, query, body, callback} = {}){
    return co.call(this, function* (){
      const values = yield this.validateReqParameters({
        path: path,
        options: {
          header  : header,
          query   : query,
          body    : body,
          callback: callback
        }
      }, requestSchema);
      this.createSignature({
        method: method.toUpperCase(),
        url: url.parse(this.endpoint + path),
        header: Object.assign({}, values.options.header),
        query: Object.assign({}, values.options.query)
      });
      return this.sendRequest(method, path, {
        header: values.options.header,
        query : values.options.query,
        body  : values.options.body,
        cb: values.options.callback
      });
    }).catch((err)=>{
      return this.handleError(err, callback);
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
