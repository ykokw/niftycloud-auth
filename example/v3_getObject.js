"use strict";

const NiftyCloud = require("../lib/niftycloud.js");

const v3 = new NiftyCloud.V3(
  "YOUR_ACCESS_KEY",
  "YOUR_SECRET_ACCESS_KEY",
  "https://jp-east-2.os.cloud.nifty.com"
);

const fs = require("fs");

v3.get("/first-bucket/niftycloud.png", {
  header: {
    "Content-Type":"image/png"
  },
}).then((res)=>{
  //If the Content-Type is not "application/xml" in response headers, you can get buffer response from response.body property 
  const image = fs.writeFileSync("./niftycloud_get.png", res.body);
  console.log("res:" + res.status);
}).catch((err)=>{
  console.log(err);
});
