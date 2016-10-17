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

class V2{
  constructor(nc) {
    this.accessKey = nc.accessKey;
    this.secretKey = nc.secretKey;
    this.endpoint = nc.endpoint;
  }
  createSignature(opt) {
    let hmac = crypto.createHmac("sha256", `${this.secretKey}`);
    hmac.update(`${this.stringToSign(opt)}`);
    this.canonicalQuery["Signature"] = hmac.digest("base64");
  }

  stringToSign(opt) {
    this.canonicalQuery = qs.parse(opt.url.query);
    this.canonicalQuery["AccessKeyId"] = this.accessKey;
    this.canonicalQuery["SignatureMethod"] = "HmacSHA256";
    this.canonicalQuery["SignatureVersion"] = "2";
    const hostname = opt.url.hostname;
    const path = opt.url.pathname;
    const str = opt.method + "\n" + 
      hostname + "\n" +
      path + "\n" +
      Utils.canonicalQueryString(this.canonicalQuery);
    return str;
  }


  get(queries, cb) {
    if (queries === null) return Promise.reject(new Errors.InvalidParameterError("queries is must not be null."));
    return new Promise((resolve, reject)=>{
      const checkit = new Checkit({
        Action: ["required", "alpha"]
      });

      checkit.run(queries).then((validated)=>{
        this.url = url.parse(this.endpoint + "/api/?" + qs.stringify(queries));
        //this.url = url.parse(this.endpoint + "/api/");
        const params = this.createSignature({
          method: "GET",
          url: this.url
        });
        //super agentの設定
        request.get(this.endpoint + "/api/").query(this.canonicalQuery).buffer().end((err, res)=>{
          let responseXml = null;
          if (err !== null){
            responseXml = err.response.text;
          } else {
            responseXml = res.text;
          }

          parseString(responseXml, (parseErr, result)=>{
            let error = null;
            if (parseErr !== null){
              error = new Errors.ParseResponseError;
            } else if (err !== null) {
              error = new Errors.ApiError("API returns error object", {
                status: err.status,
                response: result
              });
              result = null;
            }
            if (typeof cb === "function") {
              cb(error, result);
            } else {
              if (error !== null) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          });
        });
      }).catch((err)=>{
        const invalidParameterErr = new Errors.InvalidParameterError("Action must be specified or invalid action");
        if (typeof cb === "function") {
          cb(invalidParameterErr, null);
        } else {
          reject(invalidParameterErr);
        }
      });
    });
  }
}

module.exports = V2;
