"use strict";

const NiftyCloud = require("../lib/niftycloud.js");

const v4 = new NiftyCloud.V4(
  "YOUR_ACCESS_KEY",
  "YOUR_SECRET_ACCESS_KEY",
  "https://script.api.cloud.nifty.com",
  {
    proxy: "http://example.com:8080", //proxy server
    authType: "aws" //Execute Script API is required "aws" authType
  }
);

v4.post("/2015-09-01", "SCRIPT", "east-1", {
  header: {
    "X-Amz-Target":"2015-09-01.ExecuteScript"
  },
  body: {
    "ScriptIdentifier":"now.js",  //Change to own script name
    "Method":"GET" //Change to own script method
    //If your script required other parameters (e.g. Body, Header), you need to add it here as JSON string.
    //"Body": JSON.stringify({"key": "value"})
  }
}).then((res)=>{
  console.log(JSON.stringify(res.body));
}).catch((err)=>{
  console.log(err);
});
