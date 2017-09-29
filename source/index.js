const assert = require('assert');
const util = require('util');
const async = require('async');

const defaultConfigFactory = require('./defaultConfigFactory');

module.exports = makeAsync(MicroserviceChassisFactory, ['opts', 'callback']);

MicroserviceChassisFactory.pipelines = {
    config: 'config',
    call: 'call'
};

function MicroserviceChassisFactory({
    configFactory = defaultConfigFactory,
    plugins = []
} = {}, callback) {
    assert(configFactory, 'configFactory is not optinal');
    assert(util.isArray(plugins), 'plugins should be an array');

    const middlewarePipelines = Object
        .keys(MicroserviceChassisFactory.pipelines)
        .reduce((map, key) => (map[key] = []) && map, {});

    const context = {
        get: makeAsync(get, ['key', 'callback']),
        call: makeAsync(call, ['meta', 'callback']),
        host: makeAsync(host, ['callback']),
        methods: {},
        use,
        useForConfig
    };

    const config = util.isFunction(configFactory)
        ? configFactory()
        : configFactory;

    useForConfig((ctx, cb) => config.get(ctx.key, cb));

    const tasks = [
        (cb) => invokePluginMethod(plugins, 'onPreConfig', { ...context, config }, cb),
        (cb) => invokePluginMethod(plugins, 'onPreInit', { ...context }, cb),
    ];

    async.series(tasks, (err) => callback(err, err ? null : context));

    return;


    function get(key, callback) {
        const pipeline = middlewarePipelines[MicroserviceChassisFactory.pipelines.config];
        const ctx = { ...context, config, key, value: undefined };

        let deep = 0;

        next(null);


        function next(err, val) {
            if (err) {
                return callback(err);
            }

            ctx.value = val;

            if (deep < pipeline.length) {
                return process.nextTick(() => pipeline[deep++](ctx, next));
            }

            callback(err, ctx.value);
        }
    }

    function call({ method, params }, callback) {
        const pipeline = middlewarePipelines[MicroserviceChassisFactory.pipelines.call];
        const ctx = { ...context, config, params: params || {}, method, value: undefined };

        let deep = 0;

        next(null);


        function next(err, val) {
            if (err) {
                return callback(err);
            }

            ctx.value = val;

            if (deep < pipeline.length) {
                const middleware = pipeline[deep++];
                if (!middleware.method || middleware.method === method) {
                    return process.nextTick(() => middleware(ctx, next));
                }

                return next(null, ctx.value);
            }

            callback(err, ctx.value);
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
                    context.methods[method] = (meta, callback) => context.call({ ...meta, method }, callback);
                }
            }
        }

        middlewarePipelines[pipeline].push(middleware);

        return context;
    }

    function host(callback) {
        const tasks = [
            (cb) => invokePluginMethod(plugins, 'onConfig', { ...context, config }, cb),
            (cb) => invokePluginMethod(plugins, 'onInit', { ...context }, cb),
            (cb) => invokePluginMethod(plugins, 'onHost', { ...context }, cb)
        ];

        async.series(tasks, callback);
    }

    function useForConfig(middleware, opts) {
        return use(middleware, { ...opts, pipeline: MicroserviceChassisFactory.pipelines.config });
    }
}

function invokePluginMethod(plugins, methodName, params = {}, callback) {
    const taskParams = [params];
    const tasks = plugins.reduce((tasks, plugin) => {
        const method = plugin[methodName];
        if (util.isFunction(method)) {
            tasks.push((cb) => method.apply(null, taskParams.concat(cb)));
        }
        return tasks;
    }, []);

    async.series(tasks, (err) => {
        if (err) {
            return callback(err);
        }
        callback();
    });
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
            : new Promise((rs, rj) => {
                resolve = rs;
                reject = rj;
            });

        if (promise) {
            args[callbackParamIndex] = (err, value) => {
                err ? reject(err) : resolve(value);
            };
        }

        fn.apply(null, args);

        return promise;
    }
}
