"use strict";

const NiftyCloud = require("../lib/niftycloud.js");

const v4 = new NiftyCloud.V4(
  "YOUR_ACCESS_KEY",
  "YOUR_SECRET_ACCESS_KEY",
  "https://rdb.jp-east-1.api.cloud.nifty.com",
  "http://example.com:8080" //proxy server
);

v4.get("/", "rdb", "east-1", {
  query: {
    Action: "DescribeDBInstances"
  }
}).then((res)=>{
  console.log(res.body);
}).catch((err)=>{
  console.log(err);
});

