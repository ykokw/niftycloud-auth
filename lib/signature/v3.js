"use strict";

const crypto      = require("crypto");
const url         = require("url");
const qs          = require("qs");
const superagent  = require('superagent');
const sortObject  = require("sort-object");
const parseString = require('xml2js').parseString;
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
    this.canonicalHeader["Authorization"] = `AWS ${this.accessKey}:${hmac.digest("base64")}`;
  }

  stringToSign(opt) {
    const path = opt.url.pathname;
    if (!this.canonicalHeader.hasOwnProperty("Content-MD5")) {
      this.canonicalHeader["Content-MD5"] = "";
    }
    let str = opt.method + "\n" +
      Utils.canonicalHeaderString(this.canonicalHeader) + "\n" + path;
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
        req.method === null) return Promise.reject(new Errors.InvalidParameterError("path is must not be null."));
    return new Promise((resolve, reject)=>{
      const checkit = new Checkit({
        "Content-Type": "required"
      });

      checkit.run(req.headers).then((validated)=>{
        this.canonicalHeader = req.headers;
        this.canonicalHeader["Date"] = new Date().toUTCString();
        this.canonicalQuery = req.queries;
        this.url = url.parse(this.endpoint + req.path + "?" + qs.stringify(req.queries));
        const params = this.createSignature({
          method: req.method.toUpperCase(),
          url: this.url
        });
        //super agentの設定
        const request = superagent[req.method](this.endpoint + req.path)
          .set(this.canonicalHeader)
          .query(this.canonicalQuery).buffer();
        if (req.method === "put" || req.method === "post"){
          request.send(req.bodies);
        }
        request.end((err, res)=>{
            let responseXml = null;
            if (err !== null){
              responseXml = err.response.text;
              parseString(responseXml, (parseErr, result)=>{
                let error = null;
                if (parseErr !== null){
                  error = new Errors.ParseResponseError;
                } else {
                  error = new Errors.ApiError("API returns error object", {
                    status: err.status,
                    response: result
                  });
                }
                if (typeof req.cb === "function") {
                  req.cb(error, null);
                } else {
                  reject(error);
                }
              });
            } else {
              if (res.header["content-type"] === "application/xml") {
                parseString(res.text, (parseErr, result)=>{
                  let error = null;
                  if (parseErr !== null){
                    error = new Errors.ParseResponseError;
                  }
                  if (typeof req.cb === "function") {
                    req.cb(error, result);
                  } else {
                    resolve(result);
                  }
                });
              } else {
                if (typeof req.cb === "function") {
                  req.cb(err, res);
                } else {
                  resolve(res);
                }
              }
            }
          });
      }).catch((err)=>{
        const invalidParameterErr = new Errors.InvalidParameterError("Content-Type must be specified or invalid action");
        if (typeof req.cb === "function") {
          req.cb(invalidParameterErr, null);
        } else {
          reject(invalidParameterErr);
        }
      });
    });
  }
}

module.exports = V3;
