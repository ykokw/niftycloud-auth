"use strict";

class Client{
  constructor(params) {
    this.accessKey = params.accessKey;
    this.secretKey = params.secretKey;
    this.endpoint = params.endpoint;
  }
}

module.exports = Client;
