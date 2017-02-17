"use strict";

const crypto = require("crypto");

const NiftyCloud = require("../lib/niftycloud.js");

  "YOUR_ACCESS_KEY",
  "YOUR_SECRET_ACCESS_KEY",
const v3 = new NiftyCloud.V3(
  "https://jp-east-2.os.cloud.nifty.com"
);

const fs = require("fs");

const image = fs.readFileSync("./niftycloud.png"); // you must create niftycloud.png at current path
const md5hash = crypto.createHash('md5');
md5hash.update(image);

v3.put("/first-bucket/niftycloud.png", { // you must create first-bucket before run this example
  header: {
    "Content-Type":"image/png",
    "Content-MD5" : md5hash.digest('base64')
  },
  body: image
}).then((res)=>{
  console.log("res:" + res.status);
}).catch((err)=>{
  console.log(err);
});
