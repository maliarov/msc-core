process.env.NODE_CONFIG_DIR = 'test/unit/config';

const msc = require('../../source/index.js');

describe('config', () => {

    describe('default provider', () => {
        let microservice;

        beforeAll(() => {
            microservice = msc();
        })

        it('should return correct value', async () => {
            expect(await microservice.get('test.value')).toBe('abc');
        });

        describe('middlewares', () => {

            describe('one middleware', () => {
                beforeAll(() => {
                    microservice.useForConfig(simpleConfigMiddleware);  
                });

                it('should return correct value', async () => {
                    expect(await microservice.get('test.value')).toBe('abc1');
                });

                describe('two middlewares', () => {
                    beforeAll(() => {
                        microservice.useForConfig(simpleConfigMiddleware);
                    });
    
                    it('should return correct value', async () => {
                        expect(await microservice.get('test.value')).toBe('abc11');
                    });
                });
            

            });
    
        });
    });

});


function simpleConfigMiddleware({value}, next) {
    next(null, value + '1');
}