const msc = require('../../source/index.js');

describe('call', () => {

    describe('method routing', () => {
        let microservice;
        let value, valueWithRoute;

        const middlewares = {
            a: jest.fn(({ value }) => `<${value || ''}`),
            b: jest.fn(({ value, params }) => `${value}${params.name}`),
            c: jest.fn(({ value, params }) => `${value}|${params.name}`),
            d: jest.fn(({ value }) => new Promise((resolve, reject) => setTimeout(() => resolve(`${value}>`), 100)))
        };
        
        beforeAll(async () => {
            microservice = await msc();

            microservice
                .use(middlewares.a)
                .use.method('addName', middlewares.b)
                .use.method('addName', middlewares.c)
                .use(middlewares.d);

            await microservice.host();
        });

        beforeAll(async () => {
            valueA = await microservice.call();
        });
        beforeAll(async () => {
            valueWithRoute = await microservice.call.addName({ name: 'test' });
        });
        
        it('should call each method from middleware chain', () => {
            expect(middlewares.a.mock.calls.length).toBe(2);
            expect(middlewares.b.mock.calls.length).toBe(1);
            expect(middlewares.c.mock.calls.length).toBe(1);
            expect(middlewares.d.mock.calls.length).toBe(2);
        });

        it('should make alias for method name', () => {
            expect(microservice.call).toHaveProperty('addName');
        });

        it('should skip name param in no method name provided', async () => {
            expect(valueA).toBe('<>');
        });

        it('should use name param in method name defined', async () => {
            expect(valueWithRoute).toBe('<test|test>');
        });

    });

});