module.exports = defaultConfigFactory;


function defaultConfigFactory() {
    const config = require('config');
    
    return {
        get: (key) => config.get(key)
    };
}