"use strict";

const NiftyCloud = require("../lib/niftycloud.js");

const niftyCloud = new NiftyCloud(
  "YOUR_ACCESS_KEY",
  "YOUR_SECRET_ACCESS_KEY",
  "https://jp-east-2.os.cloud.nifty.com"
);

const fs = require("fs");

const image = fs.readFileSync("./script.png"); // you must create script.png at current path
niftyCloud.V3.put("/first-bucket/script.png", { // you must create first-bucket before run this example
  "Content-Type":"image/png"
}, null, image).then((res)=>{
  console.log("res:" + res.status);
}).catch((err)=>{
  if (err instanceof niftyCloud.Errors.ApiError) {
    console.log("err:" + JSON.stringify(err));
  }
});
