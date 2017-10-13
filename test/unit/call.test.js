const msc = require('../../source/index.js');

describe('call', () => {

    describe('method routing', () => {
        let microservice;

        beforeAll(async () => {
            microservice = await msc();
            
            microservice
                .use(({ value }) => `<${value || ''}`)
                .use(({ value, params }) => `${value}${params.name}`, { method: 'addName' })
                .use(({ value }) => `${value}>`);

            await microservice.host();
        });

        it('should make alias for method name', () => {
            expect(microservice.methods).toHaveProperty('addName');
        });

        it('should skip name param in no method name provided', async () => {
            expect(await microservice.call({ params: { name: 'test' } })).toBe('<>');
        });

        it('should use name param in method name defined', async () => {
            expect(await microservice.methods.addName({ params: { name: 'test' } })).toBe('<test>');
        });
    });

});