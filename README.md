# Microservices Chassis: Core Module (msc-core) [![Build Status](https://travis-ci.org/mujichOk/msc-core.svg?branch=master)](https://travis-ci.org/mujichOk/msc-core)

# Usage (at least in theory :))

```js
  const msc = require('msc-core');
  const mongoConfigProviderFactory = require('msc-config-mongo');
  const express = require('msc-plugin-express');
  const security = require('some-security-middleware-module');
  
  const opts = {
    configProviderFactory: mongoConfigProviderFactory, 
    plugins: [express()]
  }
  
  const microservice = await msc(opts);


  microservice.use.config(resolveEnvMiddleware)
    .use(securityMiddleware);
    .use.method('ping', pingMiddleware, {express: { verb: 'GET' }});

  await microservice.run();


  function resolveEnvMiddleware(key, value, {config}) {
    return `${proces.env.NODE_ENV}.${value}`;
  }
  
  function pingMiddleware({params}) {
    return 'OK';
  }
```
