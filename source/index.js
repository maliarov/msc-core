const assert = require('assert');
const util = require('util');

const defaultConfigFactory = require('./defaultConfigFactory');

module.exports = MicroserviceChassisFactory;


MicroserviceChassisFactory.pipelines = {
    config: 'config',
    call: 'call'
};

function MicroserviceChassisFactory({ configFactory = defaultConfigFactory } = {}) {
    const config = configFactory();

    const middlewarePipelines = Object
        .keys(MicroserviceChassisFactory.pipelines)
        .reduce((map, key) => (map[key] = []) && map, {});

    const context = {
        get: makeAsync(get, ['key', 'callback']),
        call: makeAsync(call, ['meta', 'callback']),
        methods: {},

        use,
        useForConfig
    };

    // prepare config pipeline
    useForConfig((ctx, n) => config.get(ctx.key, n));

    return context;


    function get(key, callback) {
        const pipeline = middlewarePipelines[MicroserviceChassisFactory.pipelines.config];
        const ctx = {...context, key, value: undefined, config};
        
        let deep = 0;

        next(null);


        function next(err, val) {
            process.nextTick(() => {
                if (err) {
                    return callback(err);
                }

                ctx.value = val;

                if (deep < pipeline.length) {
                    return pipeline[deep++](ctx, next);
                }

                callback(err, ctx.value);
            });
        }
    }

    function call({method, params}, callback) {
        const pipeline = middlewarePipelines[MicroserviceChassisFactory.pipelines.call];
        const ctx = {...context, config, params: params || {}, method, value: undefined};
        
        let deep = 0;

        next(null);

        function next(err, val) {
            process.nextTick(() => {
                if (err) {
                    return callback(err);
                }

                ctx.value = val;

                if (deep < pipeline.length) {
                    const middleware = pipeline[deep++];
                    if (!middleware.method || middleware.method === method) {
                        return middleware(ctx, next);
                    }
                    
                    return next(null, ctx.value);
                }

                callback(err, ctx.value);
            });
        }
    }

    function use(middleware, { pipeline = MicroserviceChassisFactory.pipelines.call, method } = {}) {
        assert(util.isFunction(middleware), 'middleware should be a function');
        assert(MicroserviceChassisFactory.pipelines[pipeline], 'unknown pipeline type');

        if (pipeline === MicroserviceChassisFactory.pipelines.call) {
            if (method) {
                assert(util.isString(method), 'method should be a string');
                middleware.method = method;

                if (!context.methods[method]) {
                    context.methods[method] = (meta, callback) => context.call({...meta, method}, callback);
                }
            }
        }

        middlewarePipelines[pipeline].push(middleware);

        return context;
    }

    function useForConfig(middleware, opts) {
        return use(middleware, { ...opts, pipeline: MicroserviceChassisFactory.pipelines.config });
    }
}

function runPipeline(pipeline) {
    return function () {
        const arg = arguments;

        let deep = 0;
        let value;

        next.apply(null, null, [...args]);

        function next(err, val) {
            process.nextTick(() => {
                if (err) {
                    return callback(err);
                }

                value = val;

                if (deep < pipeline.length) {
                    return pipeline[deep++].apply(null, [...arg, next]);
                }

                callback(err, value);
            });
        }
    }
}

function makeAsync(fn, params) {
    const callbackParamIndex = params.indexOf('callback');

    return function () {
        const args = Array.prototype.slice.call(arguments);

        let resolve;
        let reject;

        const promise = args[callbackParamIndex]
            ? undefined
            : new Promise((_resolve, _reject) => { 
                resolve = _resolve; _reject = reject;
            });

        if (promise) {
            args[callbackParamIndex] = (err, value) => { 
                err ? reject(err) : resolve(value);
            }
        }

        fn.apply(null, args);

        return promise;
    }
}
