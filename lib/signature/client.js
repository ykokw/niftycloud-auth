"use strict";

const superagent  = require('superagent');
require('superagent-proxy')(superagent);
const parseString = require('xml2js').parseString;
const Joi         = require('joi');
const co          = require('co');

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

  validateReqParameters(params) {
    return new Promise((resolve, reject)=>{
      const validateResult = Joi.validate(params, clientSchema);
      if (validateResult.error) {
        const invalidErr = new this.InvalidParametersError(
          "Request parameters is invalid",
          validateResult.error.details
        );
        reject(invalidErr);
      } else {
        resolve(validateResult.value);
      }
    });
  }

  createRequest(method, urlString, options) {
    const request = superagent[method](urlString).buffer();
    if (this.proxy !== ""){
      request.proxy(this.proxy);
    }
    if (options === null) return request;
    const headers = {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      "accept-encoding": "identity"
    };
    if (options.headers) {
      Object.keys(options.headers).forEach((key)=>{
        headers[key.toLowerCase()] = options.headers[key];
      });
    }
    request.set(headers);
    if (options.queries) request.query(options.queries);
    if ((method === "put" || method === "post") && options.bodies){
      request.send(options.bodies);
    }
    return request;
  }

  parseXml(type, data) {
    return new Promise((resolve, reject)=>{
      parseString(data, (err, result)=>{
        if (err) {
          const error = new this.ParseResponseError(
                  `${type} data is broken`
          );
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  handleResponse(res, cb) {
    if (typeof cb === "function") {
      return Promise.resolve(cb(null, res));
    } else {
      return Promise.resolve(res);
    }
  }

  handleError(err, cb) {
    if (err instanceof this.InvalidParametersError ||
        err instanceof this.ParseResponseError){
      return this.handleErrorResponse(err, cb);
    }
    if (err.response && err.response.text){
      return this.parseXml("error", err.response.text).then((result)=>{
        const error = new this.ApiError(
          result.Response.Errors[0].Error[0].Message[0],
          err.status,
          result.Response.Errors[0].Error[0].Code[0]
        );
        return this.handleErrorResponse(error, cb);
      }).catch((parseErr)=>{
        return this.handleErrorResponse(parseErr, cb);
      });
    } else {
      return this.handleErrorResponse(err, cb);
    }
  }

  handleErrorResponse(err, cb){
    if (typeof cb === "function") {
      return Promise.resolve(cb(err, null));
    } else {
      return Promise.reject(err);
    }
  }

  /**
   * required params
   *  method
   *  path
   * optional params
   *  headers
   *  queries
   *  bodies
   *  cb (callback)
   */
  sendRequest(method, path, {headers, queries, bodies, cb} = {}){
    return co.call(this, function* (){
      const values = yield this.validateReqParameters({
        method    : method,
        urlString : this.endpoint + path,
        options   : {
          headers: headers,
          queries: queries,
          bodies : bodies,
          cb     : cb
        }
      });
      //create request
      const request = this.createRequest(
        method,
        values.urlString,
        values.options
      );
      //send request
      const res = yield request;

      //parse xml response
      if (res.header["content-type"] === "application/xml" &&
          res.text !== "") {
        res.body = yield this.parseXml("response", res.text);
      }
      return yield this.handleResponse(res, cb);
    }).catch((err)=>{
      return this.handleError(err, cb);
    });
  }
}

module.exports = Client;
