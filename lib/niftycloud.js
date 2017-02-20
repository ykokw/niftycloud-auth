"use strict";

const V2     = require("./signature/v2");
const V3     = require("./signature/v3");
const V4     = require("./signature/v4");
const Errors = require("./errors");

module.exports = {
  V2: V2,
  V3: V3,
  V4: V4,
  Errors: Errors
};
