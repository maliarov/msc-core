# Microservices Chassis: Core Module (msc-core) [![Build Status](https://travis-ci.org/mujichOk/msc-core.svg?branch=master)](https://travis-ci.org/mujichOk/msc-core)

# Usage (at least in theory :))

```js
  const msc = require('msc-core');
  const mongoConfigProvider = require('msc-plugin-mongo-config');
  const express = require('msc-plugin-express');
  const security = require('some-security-middleware-module');
  
  const microservice = msc({configProvider: mongoConfigProvider})
    .useInConfig(resolveEnvMiddleware)
    .use(securityMiddleware);
    .use(msc.fascade(express));
    .use(pingMiddleware, {method: 'ping', transport: { verb: 'GET' }});
  
  microservice.run();
  
  
  function resolveEnvMiddleware(key, value, {config}, next) {
    next(null, `${proces.env.NODE_ENV}.${value}`);
  }
  
  function pingMiddleware({params}, next) {
    next(null, 'OK');
  }
```
