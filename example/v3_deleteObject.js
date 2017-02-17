"use strict";

const NiftyCloud = require("../lib/niftycloud.js");

const v3 = new NiftyCloud.V3(
  "YOUR_ACCESS_KEY",
  "YOUR_SECRET_ACCESS_KEY",
  "https://jp-east-2.os.cloud.nifty.com"
);

v3.delete("/first-bucket/niftycloud.png", {
  header: {
    "Content-Type":"image/png"
  },
}).then((res)=>{
  console.log("res:" + res.status);
}).catch((err)=>{
  console.log(err);
});
