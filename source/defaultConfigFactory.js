module.exports = defaultConfigFactory;


function defaultConfigFactory() {
    const config = require('config');
    
    return {
        get: async (key) => await config.get(key),
        set: async (key, value) => await config.set(key, value)
    };
}