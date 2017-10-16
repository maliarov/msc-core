process.env.NODE_CONFIG_DIR = 'test/unit/config';

const msc = require('../../source/index.js');

describe('config', () => {

    describe('default provider', () => {

        describe('get config value', () => {
            let microservice;
            let value;

            beforeAll(async () => {
                microservice = await msc();
                await microservice.start();
            });

            afterAll(async () => {
                await microservice.stop();
            });
    

            beforeAll(async () => {
                value = await microservice.get('test.value');
            });

            it('should return correct value', () => {
                expect(value).toBe('abc');
            });

            describe('middlewares', () => {

                describe('one middleware', () => {

                    beforeAll(() => {
                        microservice.use.config(simpleConfigMiddleware);
                    });

                    beforeAll(async () => {
                        value = await microservice.get('test.value');
                    });

                    it('should return correct value', () => {
                        expect(value).toBe('abc1');
                    });

                    describe('two middlewares', () => {
                        beforeAll(() => {
                            microservice.use.config(simpleConfigMiddleware);
                        });

                        it('should return correct value', async () => {
                            expect(await microservice.get('test.value')).toBe('abc11');
                        });
                    });

                });

            });
        });

    });

    describe('custom provider factory', () => {

        let microservice;
        let configProvider;

        beforeAll(async () => {
            microservice = await msc({ configProviderFactory: customerConfigProviderFactory });
            await microservice.start();
        });

        afterAll(async () => {
            await microservice.stop();
        });

        beforeAll(async () => {
            value = await microservice.get('test.value');
        });

        it('should call provider method', () => {
            expect(configProvider.get.mock.calls.length).toBe(1);
        });

        
        function customerConfigProviderFactory() {
            configProvider = {
                get: jest.fn((key) => { })
            };

            return configProvider;
        }
        
    });

});


function simpleConfigMiddleware({ value }) {
    return value + '1';
}