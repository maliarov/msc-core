# Microservices Chassis: Core Module (msc-core) [![Build Status](https://travis-ci.org/mujichOk/msc-core.svg?branch=master)](https://travis-ci.org/mujichOk/msc-core)

## plugins:
[express](https://github.com/mujichOk/msc-plugin-express)

## Usage (at least in theory :))

### config/default.json
```json
{
  "http": {
    "port": 3000
  }
}
```

### app.js
```js
  const msc = require('msc-core');
  const mongoConfig = require('msc-config-mongo');
  const express = require('msc-plugin-express');
  const security = require('some-security-middleware-module');
  
  const opts = {
    configProvider: mongoConfig(),
    plugins: [express()]
  };
  
  const microservice = await (await msc(opts))
    .use.config(({key}) => ({ key: `${proces.env.NODE_ENV}.${key}` }))
    .use(security)
    .use.method('ping', () => 'OK', {express: { verb: 'get', route: '/api/ping' }});
    .start();
```

now after starting sevice, express app should be started with ping route at [http://localhost:3000/api/ping](http://localhost:3000/api/ping)

