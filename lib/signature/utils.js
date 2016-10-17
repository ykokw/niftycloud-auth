"use strict";

const crypto      = require("crypto");
const qs          = require("qs");
const sortObject  = require("sort-object");
const parseString = require('xml2js').parseString;

class Utils {
  static canonicalQueryString(queries) {
    if(queries === null || JSON.stringify(queries) === "{}") return "";
    const encodedQueries = {};
    Object.keys(queries).forEach((key)=>{
      encodedQueries[this.fixedEncodeURIComponent(key)] = this.fixedEncodeURIComponent(queries[key]);
    });
    return qs.stringify(sortObject(encodedQueries));
  }

  static canonicalHeaderString(headers) {
    if(headers === null || JSON.stringify(headers) === "{}") return "";
    const headerStrings = {str: ""};
    Object.keys(sortObject(headers)).forEach((key)=>{
      const regExp = /x-amz-/;
      if (regExp.test(key)){
        headerStrings.str += `${key}:${headers[key]}\n`;
      } else {
        headerStrings.str += headers[key] + "\n";
      }
    });
    return headerStrings.str.replace(/\n$/, "");
  }

  static fixedEncodeURIComponent (str) {
    return str.replace(/[!'()*]/g, function(c) {
      return '%' + c.charCodeAt(0).toString(16);
    });
  }
}

module.exports = Utils;
