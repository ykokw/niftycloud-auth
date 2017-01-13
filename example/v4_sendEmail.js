"use strict";

const NiftyCloud = require("../lib/niftycloud.js");

const niftyCloud = new NiftyCloud(
  "YOUR_ACCESS_KEY",
  "YOUR_SECRET_ACCESS_KEY",
  "https://ess.api.cloud.nifty.com"
);

niftyCloud.V4.post("/", {}, {}, {
  "Action":"SendEmail",
  "Version":"2010-12-01",
  "Destination.ToAddresses.member.1": "your.destination.address@example.com",
  "Source": "your.source.address@example.com",
  "Message.Subject.Data": "testFromApi",
  "Message.Body.Text.Data": "testFromApi"
}, "email", "east-1").then((res)=>{
  console.log("res:" + JSON.stringify(res));
}).catch((err)=>{
  if (err instanceof niftyCloud.Errors.ApiError) {
    console.log("err:" + err);
  }
  console.log("err:" + err);
});

