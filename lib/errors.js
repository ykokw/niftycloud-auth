"use strict";

const makeError = require("make-error");

function ApiError (message = "", statusCode = 500, errorCode = "") {
  ApiError.super.call(this, message);
  this.statusCode = statusCode;
  this.errorCode = errorCode;
}

function ParseResponseError (message = "", statusCode = 500) {
  ParseResponseError.super.call(this, message);
  this.statusCode = statusCode;
}

function InvalidParametersError (message = "", result = {}) {
  InvalidParametersError.super.call(this, message);
  this.result = result;
}

module.exports = {
  ParseResponseError: makeError(ParseResponseError),
  InvalidParametersError: makeError(InvalidParametersError),
  ApiError: makeError(ApiError)
};
