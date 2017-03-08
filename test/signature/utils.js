"use strict";

const assert      = require("chai").assert;
const Utils = require("../../lib/signature/utils");

describe("utils library", ()=>{
  describe("canonicalQueryString method", ()=>{
    it("should return empty query string with empty queries",()=>{
      assert.equal(Utils.canonicalQueryString({}), "");
    });
    it("should return empty query string with null",()=>{
      assert.equal(Utils.canonicalQueryString(null), "");
    });
    it("should return valid query string", ()=>{
      assert.equal(Utils.canonicalQueryString({key: "value"}), "key=value");
    });
    it("should return valid query string that query object include boolean value", ()=>{
      assert.equal(Utils.canonicalQueryString({"boolean": true}), "boolean=true");
    });
  });
  describe("canonicalHeaderString method", ()=>{
    it("should return empty header string with empty headers",()=>{
      assert.equal(Utils.canonicalHeaderString({}), "");
    });
    it("should return empty header string with null",()=>{
      assert.equal(Utils.canonicalHeaderString(null), "");
    });
    it("should return valid header string", ()=>{
      assert.equal(Utils.canonicalHeaderString({key: "value"}), "value");
    });
    it("should return valid header string that query object include boolean value", ()=>{
      assert.equal(Utils.canonicalHeaderString({"boolean": true}), "true");
    });
  });
  describe("fixedEncodeURIComponent method", ()=>{
    it("should return encoded string with url component charactors",()=>{
      assert.equal(Utils.fixedEncodeURIComponent("!'()*"), "%21%27%28%29%2a");
    });
  });
});
