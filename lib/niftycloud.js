"use strict";

const V2     = require("./signature/v2");
const V3     = require("./signature/v3");
const V4     = require("./signature/v4");
const V4AWS  = require("./signature/v4_aws");
const Errors = require("./errors");

class NiftyCloud{
  constructor(accessKey, secretKey, endpoint, proxy = "") {
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.endpoint = endpoint;
    this.proxy = proxy;
    this.V2 = new V2(this);
    this.V3 = new V3(this);
    this.V4 = new V4(this);
    this.V4AWS = new V4AWS(this);
    this.Errors = Errors;
  }
}

module.exports = NiftyCloud;
