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
    header: Joi.object().optional(),
    query: Joi.object().optional(),
    body : Joi.object().optional(),
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

  validateReqParameters(params, schema = clientSchema) {
    return new Promise((resolve, reject)=>{
      const validateResult = Joi.validate(params, schema);
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
    const header = {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      "accept-encoding": "identity"
    };
    if (options.header) {
      Object.keys(options.header).forEach((key)=>{
        header[key.toLowerCase()] = options.header[key];
      });
    }
    request.set(header);
    if (options.query) request.query(options.query);
    if ((method === "put" || method === "post") && options.body){
      request.send(options.body);
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
   *  header
   *  query
   *  body
   *  cb (callback)
   */
  sendRequest(method, path, {header, query, body, cb} = {}){
    return co.call(this, function* (){
      const values = yield this.validateReqParameters({
        method    : method,
        urlString : this.endpoint + path,
        options   : {
          header: header,
          query: query,
          body : body,
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
