"use strict";

const NiftyCloud = require("../lib/niftycloud.js");

const niftyCloud = new NiftyCloud(
  "YOUR_ACCESS_KEY",
  "YOUR_SECRET_ACCESS_KEY",
  "https://east-1.cp.cloud.nifty.com"
);

niftyCloud.V2.get({
  Action: "DescribeInstances",
}).then((res)=>{
  console.log("res:" + JSON.stringify(res));
}).catch((err)=>{
  if (err instanceof niftyCloud.Errors.ApiError) {
    console.log("err:" + err);
  }
});

