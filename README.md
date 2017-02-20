# niftycloud-auth

[![Build Status](https://travis-ci.org/ykokw/niftycloud-auth.svg?branch=master)](https://travis-ci.org/ykokw/niftycloud-auth)

CAUTION: EXPERIMENTAL CODE

This is the SDK for NIFTY Cloud API to make authentication parameters of API request.

## Install

```
npm install niftycloud-auth
```

## Basic Usage

There is classes that maekes signature parameters for signature version 2 / 3 / 4.

First, you need to create instance of class of signature version that you want to request.   
Then, you can request api with some parameters. Please visit [NIFTY Cloud API Reference page](http://cloud.nifty.com/api/rest/) to know about API endpoint, path and required parameters.

All api request method is avaiable both callback `(err, res)=>{}` and promise chain.

If content type of response is xml, `response.body` property includes result ofparsing xml by [xml2js](https://github.com/Leonidas-from-XIV/node-xml2js).  
Other response parameter is same as [Superagent](https://github.com/visionmedia/superagent)

```javascript
const NiftyCloud = require("../lib/niftycloud.js");

const v2 = new NiftyCloud.V2(
  "YOUR_ACCESS_KEY",
  "YOUR_SECRET_ACCESS_KEY",
  "https://east-1.cp.cloud.nifty.com"
);

v2.get( "/api/", "DescribeInstances", {}).then((res)=>{
  console.log("res:" + JSON.stringify(res.body));
}).catch((err)=>{
  if (err instanceof v2.ApiError) {
    console.log("err:" + err);
  }
});

```

## API

- [Constructor](#constructor)
- [Signature version 2](#signature-version-2)
- [Signature version 3](#signature-version-3)
- [Signature version 4](#signature-version-4)
- [errors](#errors)

### Constructor

- Required: Access key, Secret Access key, API Endpoint
- Optional: Proxy endpoint (Please see `examples/v4_describeDBInstances.js` for example)

```javascript
const v2 = new NiftyCloud.V2(
  "YOUR_ACCESS_KEY",
  "YOUR_SECRET_ACCESS_KEY",
  "https://east-1.cp.cloud.nifty.com"
);
```

### Signature version 2

- GET
    - Required: Path and Action name of API
    - Optional: query , header Object and callback

```javascript
"use strict";

const NiftyCloud = require("../lib/niftycloud.js");

const v2 = new NiftyCloud.V2(
  "YOUR_ACCESS_KEY",
  "YOUR_SECRET_ACCESS_KEY",
  "https://east-1.cp.cloud.nifty.com"
);

v2.get( "/api/", "DescribeInstances", {}).then((res)=>{
  console.log("res:" + JSON.stringify(res.body));
}).catch((err)=>{
  if (err instanceof v2.ApiError) {
    console.log("err:" + err);
  }
});
```

### Signature version 3

(This class is available only for [Object storage](http://cloud.nifty.com/service/obj_storage.htm). 
Because other products implementation of signature version 3 is different from object storage.)

- PUT
    - Required: Path of API
    - Optional: query, header, body Object and callback

```javascript
"use strict";

const crypto = require("crypto");

const NiftyCloud = require("../lib/niftycloud.js");

const v3 = new NiftyCloud.V3(
  "YOUR_ACCESS_KEY",
  "YOUR_SECRET_ACCESS_KEY",
  "https://jp-east-2.os.cloud.nifty.com"
);

const fs = require("fs");

const image = fs.readFileSync("./niftycloud.png"); // you must prepare niftycloud.png at current path
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
```

- GET
    - Required: Path of API
    - Optional: query, header Object and callback

```javascript
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
```

- DELETE
    - Required: Path of API
    - Optional: query, header Object and callback

```javascript
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
```

### Signature version 4

- GET
    - Required: Path of API, service ID, region
    - Optional: query, header Object and callback

```javascript
"use strict";

const NiftyCloud = require("../lib/niftycloud.js");

const v4 = new NiftyCloud.V4(
  "YOUR_ACCESS_KEY",
  "YOUR_SECRET_ACCESS_KEY",
  "https://rdb.jp-east-1.api.cloud.nifty.com",
  "http://example.com:8080" //proxy server
);

v4.get("/", "rdb", "east-1", {
  query: {
    Action: "DescribeDBInstances"
  }
}).then((res)=>{
  console.log(res.body);
}).catch((err)=>{
  console.log(err);
});

```

- POST
    - Required: Path of API, service ID, region
    - Optional: query, header, body Object and callback

```javascript
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
    "Message.body.Text.Data": "testFromApi"
  }
}).then((res)=>{
  console.log(res.body);
}).catch((err)=>{
  console.log(err);
});
```

### Errors

- ParseResponseError: Error for Response parsing
    - Parameters: `error.name`, `error.message`
- InvalidParameterError: Error for Invalid parameters
    - Parameters: `error.name`, `error.message`, `error.results` (array of detail messages)
- ApiError: Error for API Response returns 4xx or 5xx
    - Parameters: `error.name`, `error.message`, `error.statusCode` (HTTP Status Code), `error.errorCode` (Error Code of [NIFTYCloud API](http://cloud.nifty.com/api/rest/errorcode.htm))

