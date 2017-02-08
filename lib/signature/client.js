"use strict";

const superagent  = require('superagent');
require('superagent-proxy')(superagent);
const parseString = require('xml2js').parseString;

const Errors      = require("../errors");

const defaultParams = {
  accessKey: "",
  secretKey: "",
  endpoint : "",
  proxy    : ""
};

class Client{
  constructor({accessKey, secretKey, endpoint, proxy} = defaultParams) {
    this.accessKey = accessKey || "";
    this.secretKey = secretKey || "";
    this.endpoint = endpoint || "";
    this.proxy = proxy || "";
  }
  sendRequest(req){
    return new Promise((resolve, reject)=>{
      //super agentの設定
      const request = superagent[req.method](this.endpoint + req.path)
        .set(req.headers)
        .query(req.queries).buffer();
      if (this.proxy !== ""){
        request.proxy(this.proxy);
      }
      if (req.method === "put" || req.method === "post"){
        request.set("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8")
               .set("accept-encoding", "identity")
               .send(req.bodies);
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
    });
  }
}

module.exports = Client;
