module.exports = defaultConfigFactory;


function defaultConfigFactory() {
    const config = require('config');
    
    return {
        get: (key, callback) => 
            callback(null, config.get(key)),
        
        set: (key, value, callback) => { 
            config.set(key, value); 
            callback(null);
        }
    };
}