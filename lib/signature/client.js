"use strict";

const superagent  = require('superagent');
require('superagent-proxy')(superagent);
const parseString = require('xml2js').parseString;

const Errors      = require("../errors");

class Client{
  constructor(accessKey = "", secretKey = "", endpoint = "", proxy = "") {
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.endpoint = endpoint;
    this.proxy = proxy;

    this.ApiError = Errors.ApiError;
    this.ParseResponseError = Errors.ParseResponseError;
    this.InvalidParameterError = Errors.InvalidParameterError;
  }
  /**
   * required params
   *  method
   *  path
   * optional params
   *  headers
   *  queries
   *  bodies
   */
  sendRequest(method, path, {headers, queries, bodies, cb} = {}){
    return new Promise((resolve, reject)=>{
      const request = superagent[method](this.endpoint + path).buffer();
      if (headers != null) request.set(headers);
      if (queries != null) request.query(queries);
      if (this.proxy !== ""){
        request.proxy(this.proxy);
      }
      if ((method === "put" || method === "post") && bodies != null){
        request.set("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8")
               .set("accept-encoding", "identity")
               .send(opts.bodies);
      }
      request.end((err, res)=>{
        let responseXml = null;
        if (err !== null){
          responseXml = err.response.text;
          parseString(responseXml, (parseErr, result)=>{
            let error = null;
            if (parseErr !== null){
              error = new this.ParseResponseError(
                "Response data is broken",
                err.status
              );
            } else {
              error = new this.ApiError(
                result.Response.Errors[0].Error[0].Message[0],
                err.status,
                result.Response.Errors[0].Error[0].Code[0]
              );
            }
            if (typeof cb === "function") {
              cb(error, null);
            } else {
              reject(error);
            }
          });
        } else {
          if (res.header["content-type"] === "application/xml") {
            parseString(res.text, (parseErr, result)=>{
              let error = null;
              if (parseErr !== null){
                error = new this.ParseResponseError;
              }
              if (typeof cb === "function") {
                cb(error, result);
              } else {
                resolve(result);
              }
            });
          } else {
            if (typeof cb === "function") {
              cb(err, res);
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
