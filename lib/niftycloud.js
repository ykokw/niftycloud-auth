"use strict";

const V2     = require("./signature/v2");
const V3     = require("./signature/v3");
const V4     = require("./signature/v4");
const Errors = require("./errors");

class NiftyCloud{
  constructor(accessKey, secretKey, endpoint) {
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.endpoint = endpoint;
    this.V2 = new V2(this);
    this.V3 = new V3(this);
    this.V4 = new V4(this);
    this.Errors = Errors;
  }
}

module.exports = NiftyCloud;
