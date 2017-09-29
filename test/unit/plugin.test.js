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
                onPreConfig: jest.fn((opts, cb) => cb()),
                onConfig: jest.fn((opts, cb) => cb()),
                onPreInit: jest.fn((opts, cb) => cb()),
                onInit: jest.fn((opts, cb) => cb()),
                onHost: jest.fn((opts, cb) => cb())
            };
        }
    });

});