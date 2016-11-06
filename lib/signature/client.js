"use strict";

const superagent  = require('superagent');
const parseString = require('xml2js').parseString;
const Checkit     = require("checkit");

const Errors      = require("../errors");

class Client{
  constructor(params) {
    this.accessKey = params.accessKey;
    this.secretKey = params.secretKey;
    this.endpoint = params.endpoint;
  }
  sendRequest(req){
    return new Promise((resolve, reject)=>{
      const checkit = new Checkit({
        "Content-Type": "required"
      });

      checkit.run(req.headers).then((validated)=>{
        //super agentの設定
        const request = superagent[req.method](this.endpoint + req.path)
          .set(req.headers)
          .query(req.queries).buffer();
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

module.exports = Client;
