const assert = require('assert');
const util = require('util');

const defaultConfigFactory = require('./defaultConfigFactory');

module.exports = MicroserviceChassisFactory;

MicroserviceChassisFactory.pipelines = {
    config: 'config',
    call: 'call'
};

async function MicroserviceChassisFactory({ configFactory = defaultConfigFactory, plugins = [] } = {}) {
    assert(configFactory, 'configFactory is not optinal');
    assert(util.isArray(plugins), 'plugins should be an array');

    const middlewarePipelines = Object
        .keys(MicroserviceChassisFactory.pipelines)
        .reduce((map, key) => (map[key] = []) && map, {});

    const context = {
        get,
        call,
        host,
        methods: {},
        use,
        useForConfig
    };

    const config = util.isFunction(configFactory)
        ? configFactory()
        : configFactory;

    useForConfig((ctx, cb) => config.get(ctx.key, cb));

    await invokePluginMethod(plugins, 'onPreConfig', { ...context, config });
    await invokePluginMethod(plugins, 'onPreInit', { ...context });
    
    return context;


    async function get(key) {
        let deep = 0;

        const ctx = { ...context, config, key, value: undefined };
        const pipeline = middlewarePipelines[MicroserviceChassisFactory.pipelines.config];

        for (let i = 0; i < pipeline.length; i++) {
            ctx.value = await pipeline[i](ctx);
        }

        return ctx.value;
    }

    async function call({ method, params }) {
        let deep = 0;

        const ctx = { ...context, config, params: params || {}, method, value: undefined };
        const pipeline = middlewarePipelines[MicroserviceChassisFactory.pipelines.call]
                .filter((middleware) => (!middleware.method || middleware.method === method));
        
        for (let i = 0; i < pipeline.length; i++) {
            ctx.value = await pipeline[i](ctx);
        }

        return ctx.value;
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

    async function host() {
        await invokePluginMethod(plugins, 'onConfig', { ...context, config });
        await invokePluginMethod(plugins, 'onInit', { ...context });
        await invokePluginMethod(plugins, 'onHost', { ...context });
    }

    function useForConfig(middleware, opts) {
        return use(middleware, { ...opts, pipeline: MicroserviceChassisFactory.pipelines.config });
    }
}

async function invokePluginMethod(plugins, methodName, params = {}) {
    const chain = plugins.reduce((chain, plugin) => {
        const method = plugin[methodName];
        util.isFunction(method) && chain.push(method);
        return chain;
    }, []);

    if (chain.length) {
        const methodParams = [params];

        for (let i = 0; i < chain.length; i++) {
            await chain[i].apply(null, methodParams);
        }
    }
}