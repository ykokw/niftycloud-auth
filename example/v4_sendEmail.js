"use strict";

const NiftyCloud = require("../lib/niftycloud.js");

const v4 = new NiftyCloud.V4(
  "YOUR_ACCESS_KEY",
  "YOUR_SECRET_ACCESS_KEY",
  "https://ess.api.cloud.nifty.com"
);

v4.post("/", "east-1", "email", {
  body: {
    "Action":"SendEmail",
    "Version":"2010-12-01",
    "Destination.ToAddresses.member.1": "destination.address@example.com",
    "Source": "source.address@example.com",
    "Message.Subject.Data": "testFromApi",
    "Message.Body.Text.Data": "testFromApi"
  }
}).then((res)=>{
  console.log(res.body);
}).catch((err)=>{
  console.log(err);
});

