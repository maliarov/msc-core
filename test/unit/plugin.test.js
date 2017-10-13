process.env.NODE_CONFIG_DIR = 'test/unit/config';

const msc = require('../../source/index.js');

describe('config', () => {

    describe('default provider', () => {
        let microservice;
        let plugin;
        
        beforeAll(async () => {
            plugin = TestPlugin();
            microservice = await msc({plugins: [plugin]});

            await microservice.host();
        });

        it('should call all 4 methods of plugin', () => {
            expect(plugin.onPreConfig.mock.calls.length).toBe(1);
            expect(plugin.onConfig.mock.calls.length).toBe(1);
            expect(plugin.onPreInit.mock.calls.length).toBe(1);
            expect(plugin.onInit.mock.calls.length).toBe(1);
            expect(plugin.onHost.mock.calls.length).toBe(1);
        });

        function TestPlugin() {
            return {
                onPreConfig: jest.fn((opts) => {}),
                onConfig: jest.fn((opts) => {}),
                onPreInit: jest.fn((optss) => {}),
                onInit: jest.fn((opts) => {}),
                onHost: jest.fn((opts) => {})
            };
        }
    });

});