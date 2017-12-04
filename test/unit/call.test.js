const msc = require('../../source/index.js');

describe('call', () => {

    describe('method routing', () => {
        let microservice;
        let value, valueWithRoute;

        const middlewares = {
            a: jest.fn((args, { value }) => `<${value || ''}`),
            b: jest.fn((args, { value }) => `${value}${args.text}`),
            c: jest.fn((args, { value }) => `${value}|${args.text}`),
            d: jest.fn((args, { value }) => new Promise((resolve) =>
                setTimeout(() => resolve(`${value}>`), 100))
            )
        };

        beforeAll(async () => {
            microservice = await msc();

            microservice
                .use(middlewares.a)
                .use.method('join', [middlewares.b, middlewares.c], { someMetaProperty: 'some meta property value' })
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
            valueWithRoute = await microservice.call.join({ text: 'test' });
        });

        it('should call each method from middleware chain', () => {
            expect(middlewares.a.mock.calls.length).toBe(2);
            expect(middlewares.b.mock.calls.length).toBe(1);
            expect(middlewares.c.mock.calls.length).toBe(1);
            expect(middlewares.d.mock.calls.length).toBe(2);
        });

        it('should make alias for method name', () => {
            expect(microservice.call).toHaveProperty('join');
            expect(microservice.call.join).toHaveProperty('meta.someMetaProperty', 'some meta property value');
        });

        it('should skip name param in no method name provided', async () => {
            expect(valueA).toBe('<>');
        });

        it('should use name param in method name defined', async () => {
            expect(valueWithRoute).toBe('<test|test>');
        });

    });

});