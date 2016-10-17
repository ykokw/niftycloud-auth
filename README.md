# niftycloud-auth

[![Build Status](https://travis-ci.org/ykokw/niftycloud-auth.svg?branch=master)](https://travis-ci.org/ykokw/niftycloud-auth)

CAUTION: EXPERIMENTAL CODE

This is the SDK for NIFTY Cloud API to make authentication parameters of API request.

## Authentication of NIFTY Cloud API

### Usage

```
npm install niftycloud-auth
```

### Signature version 2

```javascript
"use strict";

const NiftyCloud = require("niftycloud-auth");

const niftyCloud = new NiftyCloud(
  "YOUR_ACCESS_KEY",
  "YOUR_SECRET_ACCESS_KEY",
  "https://east-1.cp.cloud.nifty.com"
);

niftyCloud.V2.get({
  Action: "DescribeInstances",
}).then((res)=>{
  console.log("res:" + JSON.stringify(res));
}).catch((err)=>{
  if (err instanceof niftyCloud.Errors.ApiError) {
    console.log("err:" + err);
  }
});
```
response is parsed by [xml2js](https://github.com/Leonidas-from-XIV/node-xml2js)

### Signature version 3

- PUT

```javascript
"use strict";

const NiftyCloud = require("niftycloud-auth");

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
```

- GET

```javascript
"use strict";

const NiftyCloud = require("niftycloud-auth");

const niftyCloud = new NiftyCloud(
  "YOUR_ACCESS_KEY",
  "YOUR_SECRET_ACCESS_KEY",
  "https://jp-east-2.os.cloud.nifty.com"
);

const fs = require("fs");

niftyCloud.V3.get("/first-bucket/script.png", {
  "Content-Type":"image/png"
}, null).then((res)=>{
  //If the Content-Type is not "application/xml" in response headers, you can get buffer response from response.body property 
  const image = fs.writeFileSync("./script_get.png", res.body);
  console.log("res:" + res.status);
}).catch((err)=>{
  if (err instanceof niftyCloud.Errors.ApiError) {
    console.log("err:" + JSON.stringify(err));
  }
});
```

- DELETE

```javascript
"use strict";

const NiftyCloud = require("niftycloud-auth");

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
```

### Errors

- ParseResponseError: Error for Response parsing
- InvalidParameterError: Error for Invalid parameters
- ApiError: Error for API Response returns 4xx or 5xx

