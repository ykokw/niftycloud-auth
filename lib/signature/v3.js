"use strict";

const crypto      = require("crypto");
const url         = require("url");
const qs          = require("qs");
const Checkit     = require("checkit");

const Errors      = require("../errors");
const Utils       = require("./utils");
const Client      = require("./client");

class V3 extends Client{
  constructor(params) {
    super(params);
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

  get(path, headers, queries, cb){
    const requestParams = {
      path: path,
      method: "get",
      headers: headers,
      queries: queries,
      bodies: null,
      cb: cb
    };
    return this.sendRequest(requestParams);
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
  sendRequest(req){
    if (req === null ||
        req.path === null ||
        req.method === null) return Promise.reject(new Errors.InvalidParameterError("path must not be null."));
    req.headers["Date"] = new Date().toUTCString();
    req.url = url.parse(this.endpoint + req.path + "?" + qs.stringify(req.queries));
    this.createSignature({
      method: req.method.toUpperCase(),
      url: req.url,
      headers: req.headers,
      queries: req.queries
    });
    const checkit = new Checkit({"Content-Type": "required"});
    const [err, validated] = checkit.validateSync(req.headers);
    if (err !== null){
      const invalidParameterErr = new Errors.InvalidParameterError("Cotent-Type must not be null");
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

module.exports = V3;
