"use strict";

const NiftyCloud = require("../lib/niftycloud.js");

const niftyCloud = new NiftyCloud(
  "YOUR_ACCESS_KEY",
  "YOUR_SECRET_ACCESS_KEY",
  "https://jp-east-2.os.cloud.nifty.com"
);

const fs = require("fs");

niftyCloud.V3.delete("/first-bucket/script.png", {
  "Content-Type":"image/png"
}, null).then((res)=>{
  console.log("res:" + res.status);
}).catch((err)=>{
  if (err instanceof niftyCloud.Errors.ApiError) {
    console.log("err:" + JSON.stringify(err));
  }
});
