"use strict";

const superagent  = require('superagent');
require('superagent-proxy')(superagent);
const parseString = require('xml2js').parseString;
const Joi         = require('joi');

const Errors      = require("../errors");

const clientSchema = {
  method   : Joi.string().required().valid('get', 'post', 'put', 'delete'),
  urlString: Joi.string().required().uri({
    scheme: ['http', 'https']
  }),
  options  : Joi.object({
    headers: Joi.object().optional(),
    queries: Joi.object().optional(),
    bodies : Joi.object().optional(),
    cb     : Joi.func().optional()
  }).optional()
};

class Client{
  constructor(endpoint = "", proxy = "") {
    this.endpoint = endpoint;
    this.proxy = proxy;

    this.ApiError = Errors.ApiError;
    this.ParseResponseError = Errors.ParseResponseError;
    this.InvalidParametersError = Errors.InvalidParametersError;
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
      const validateResult = Joi.validate({
        method    : method,
        urlString : this.endpoint + path,
        options   : {
          headers: headers,
          queries: queries,
          bodies : bodies,
          cb     : cb
        }
      },
      clientSchema);
      if (validateResult.error) {
        const invalidErr = new this.InvalidParametersError(
          "Request parameters is invalid",
          validateResult.error.details
        );
        if (typeof(cb) === "function") {
          cb(invalidErr, null);
        } else {
          return reject(invalidErr);
        }
      } else {
        const request = superagent[method](validateResult.value.urlString).buffer();
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
            if (res.header["content-type"] === "application/xml" && res.text !== "") {
              parseString(res.text, (parseErr, result)=>{
                let error = null;
                if (parseErr !== null){
                  error = new this.ParseResponseError;
                } else {
                  res.body = result;
                }
                if (typeof cb === "function") {
                  cb(error, res);
                } else {
                  resolve(res);
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
      }
    });
  }
}

module.exports = Client;
