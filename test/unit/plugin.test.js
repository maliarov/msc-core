process.env.NODE_CONFIG_DIR = 'test/unit/config';

const msc = require('../../source/index.js');

describe('config', () => {

    describe('default provider', () => {
        let microservice;
        let plugin;
        
        beforeAll(async () => {
            plugin = testPluginFactory();
            microservice = await msc({plugins: [plugin]});

            await microservice.start();
        });

        beforeAll(async () => {
            await microservice.stop();
        });

        it('should call all 4 methods of plugin', () => {
            expect(plugin.onPreConfig.mock.calls.length).toBe(1);
            expect(plugin.onConfig.mock.calls.length).toBe(1);
            expect(plugin.onPreInit.mock.calls.length).toBe(1);
            expect(plugin.onInit.mock.calls.length).toBe(1);
            expect(plugin.onStart.mock.calls.length).toBe(1);
            expect(plugin.onStop.mock.calls.length).toBe(1);
        });

        function testPluginFactory() {
            return {
                onPreConfig: jest.fn((opts) => {}),
                onConfig: jest.fn((opts) => {}),
                onPreInit: jest.fn((opts) => {}),
                onInit: jest.fn((opts) => {}),
                onStart: jest.fn((opts) => {}),
                onStop: jest.fn((opts) => {})
            };
        }
    });

});