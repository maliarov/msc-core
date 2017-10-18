const msc = require('../../source/index.js');

describe('call', () => {

    describe('method routing', () => {
        let microservice;
        let value, valueWithRoute;

        const middlewares = {
            a: jest.fn(({ value }) => `<${value || ''}`),
            b: jest.fn(({ value, params }) => `${value}${params.value}`),
            c: jest.fn(({ value, params }) => `${value}|${params.value}`),
            d: jest.fn(({ value }) => new Promise((resolve, reject) => setTimeout(() => resolve(`${value}>`), 100)))
        };
        
        beforeAll(async () => {
            microservice = await msc();
 
            microservice
                .use(middlewares.a)
                .use.method('join', middlewares.b, {a: 1})
                .use.method('join', middlewares.c, {b: 2})
                .use(middlewares.d);

            await microservice.start();
        });

        afterAll(async () => {
            await microservice.stop();
        });

        beforeAll(async () => {
            valueA = await microservice.call();
        });

        beforeAll(async () => {
            valueWithRoute = await microservice.call.join({ value: 'test' });
        });
        
        it('should call each method from middleware chain', () => {
            expect(middlewares.a.mock.calls.length).toBe(2);
            expect(middlewares.b.mock.calls.length).toBe(1);
            expect(middlewares.c.mock.calls.length).toBe(1);
            expect(middlewares.d.mock.calls.length).toBe(2);
        });

        it('should make alias for method name', () => {
            expect(microservice.call).toHaveProperty('join');
            expect(microservice.call.join).toHaveProperty('meta.a', 1);
            expect(microservice.call.join).toHaveProperty('meta.b', 2);
        });

        it('should skip name param in no method name provided', async () => {
            expect(valueA).toBe('<>');
        });

        it('should use name param in method name defined', async () => {
            expect(valueWithRoute).toBe('<test|test>');
        });

    });

});