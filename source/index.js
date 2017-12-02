const assert = require('assert');
const util = require('util');

const defaultConfigFactory = () => require('./defaultConfigFactory')();

module.exports = microserviceChassisFactory;


microserviceChassisFactory.pipelines = {
    config: 'config',
    call: 'call'
};

async function microserviceChassisFactory({ configProvider = defaultConfigFactory(), plugins = [] } = {}) {
    assert(configProvider, 'configProviderFactory is not optinal');
    assert(util.isArray(plugins), 'plugins should be an array');

    // note: if plugin is array then it is preset
    plugins = plugins.reduce((plugins, plugin) => plugins.concat(plugin), []);

    const middlewarePipelines = Object
        .keys(microserviceChassisFactory.pipelines)
        .reduce((map, key) => (map[key] = []) && map, {});

    const context = {
        start,
        stop,

        use,
        get,
        call
    };

    context.use.config = useForConfig;
    context.use.method = useForMethod;

    const config = configProvider;

    useForConfig(async ({ key }) => ({ value: await config.get(key) }));

    await invokePluginMethod(plugins, 'onPreConfig', { context, config });
    await invokePluginMethod(plugins, 'onPreInit', context);

    return context;


    async function get(key) {
        const ctx = Object.assign({}, context, { key, value: undefined });
        const pipeline = middlewarePipelines[microserviceChassisFactory.pipelines.config];

        for (let i = 0; i < pipeline.length; i++) {
            const { key, value } = (await pipeline[i](ctx)) || {};

            ctx.key = key === undefined ? ctx.key : key;
            ctx.value = value;
        }

        return ctx.value;
    }

    async function call({ method, params = {} } = {}) {
        const ctx = Object.assign({}, context, { params, method, value: undefined });
        const pipeline = middlewarePipelines[microserviceChassisFactory.pipelines.call]
            .filter((middleware) => (!middleware.method || middleware.method === method));

        for (let i = 0; i < pipeline.length; i++) {
            ctx.value = await pipeline[i](ctx);
        }

        return ctx.value;
    }

    function use(middleware, options = {pipeline: microserviceChassisFactory.pipelines.call}) {
        const { pipeline, method } = options;

        assert(util.isFunction(middleware), 'middleware should be a function');
        assert(microserviceChassisFactory.pipelines[pipeline], 'unknown pipeline type');

        if (pipeline === microserviceChassisFactory.pipelines.call) {
            if (method) {
                assert(util.isString(method), 'method name should be a string');

                middleware.method = method;

                if (!context.call[method]) {
                    context.call[method] = (params, opts = {}) => context.call(Object.assign({}, opts, { method, params, meta: context.call[method].meta }));
                    context.call[method].meta = {};
                }

                context.call[method].meta = Object.assign(context.call[method].meta, options);
            }
        }

        middlewarePipelines[pipeline].push(middleware);

        return context;
    }

    async function start() {
        await invokePluginMethod(plugins, 'onConfig', { context, config });
        await invokePluginMethod(plugins, 'onInit', context);
        await invokePluginMethod(plugins, 'onStart', context);

        return context;
    }

    async function stop() {
        await invokePluginMethod(plugins, 'onStop', context);

        return context;
    }

    function useForConfig(middleware, opts = {}) {
        return use(middleware, Object.assign({}, opts, { pipeline: microserviceChassisFactory.pipelines.config }));
    }
    function useForMethod(method, middleware, opts) {
        return use(middleware, Object.assign({}, opts, { pipeline: microserviceChassisFactory.pipelines.call, method }));
    }

}

async function invokePluginMethod(plugins, methodName, params) {
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