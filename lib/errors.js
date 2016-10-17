"use strict";

const createError = require("create-error");

const ParseResponseError = createError("ParseResponseError");
const InvalidParameterError = createError("InvalidParameterError");
const ApiError = createError("ApiError");

module.exports = {
  ParseResponseError,
  InvalidParameterError,
  ApiError
};
