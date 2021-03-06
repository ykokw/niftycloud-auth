"use strict";

const NiftyCloud = require("../lib/niftycloud.js");

const v2 = new NiftyCloud.V2(
  "YOUR_ACCESS_KEY",
  "YOUR_SECRET_ACCESS_KEY",
  "https://east-1.cp.cloud.nifty.com"
);

v2.get( "/api/", "DescribeInstances", {}).then((res)=>{
  console.log("res:" + JSON.stringify(res.body));
}).catch((err)=>{
  if (err instanceof v2.ApiError) {
    console.log("err:" + err);
  }
});

