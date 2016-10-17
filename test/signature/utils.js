"use strict";

const assert      = require("chai").assert;
const Utils = require("../../lib/signature/utils");

describe("Signature", ()=>{
  describe("utils library", ()=>{
    it("should return empty query string with empty queries",()=>{
      assert.equal(Utils.canonicalQueryString({}), "");
    });
    it("should return empty header string with empty headers",()=>{
      assert.equal(Utils.canonicalHeaderString({}), "");
    });
    it("should return empty query string with null",()=>{
      assert.equal(Utils.canonicalQueryString(null), "");
    });
    it("should return empty header string with null",()=>{
      assert.equal(Utils.canonicalHeaderString(null), "");
    });
    it("should return encoded string with url component charactors",()=>{
      assert.equal(Utils.fixedEncodeURIComponent("!'()*"), "%21%27%28%29%2a");
    });
  });
});
