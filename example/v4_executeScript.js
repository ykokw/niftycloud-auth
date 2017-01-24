"use strict";

const NiftyCloud = require("../lib/niftycloud.js");

const niftyCloud = new NiftyCloud(
  "YOUR_ACCESS_KEY",  //Change to own access key
  "YOUR_SECRET_ACCESS_KEY", //Change to own secret access key
  "https://script.api.cloud.nifty.com"
);

niftyCloud.V4AWS.post("/2015-09-01", {
  "X-Amz-Target":"2015-09-01.ExecuteScript"
}, {}, {
  "ScriptIdentifier":"test.js",  //Change to own script name
  "Method":"POST", //Change to own script method
  //If your script required other parameters (e.g. Body, Header), you need to add it here as JSON string.
  "Body": JSON.stringify({"key": "value"}) 
}, "SCRIPT", "east-1").then((res)=>{
  console.log(res.text);
}).catch((err)=>{
  if (err instanceof niftyCloud.Errors.ApiError) {
    console.log("err:" + err);
  }
  console.log("err:" + err);
});
