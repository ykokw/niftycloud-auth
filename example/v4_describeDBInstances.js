"use strict";

const NiftyCloud = require("../lib/niftycloud.js");

const niftyCloud = new NiftyCloud(
  "YOUR_ACCESS_KEY",
  "YOUR_SECRET_ACCESS_KEY",
  "https://rdb.jp-east-1.api.cloud.nifty.com"
);

niftyCloud.V4.get("/", {}, {
  Action: "DescribeDBInstances",
}, "rdb", "east-1").then((res)=>{
  console.log("res:" + JSON.stringify(res));
}).catch((err)=>{
  if (err instanceof niftyCloud.Errors.ApiError) {
    console.log("err:" + err);
  }
  console.log("err:" + err);
});

