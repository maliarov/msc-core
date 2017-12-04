const msc = require('../../source/index.js');

describe('call', () => {

    describe('method routing', () => {
        let microservice;
        let resultOfMethodCall;

        const middlewares = {
            a: jest.fn((text, { value }) => `<${value || ''}`),
            b: jest.fn((text, { value }) => `${value}${text}`),
            c: jest.fn((text, { value }) => `${value}|${text}`),
            d: jest.fn((text, { value }) => new Promise((resolve) =>
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
            resultOfMethodCall = await microservice.call.join('test');
        });

        it('should call each method from middleware chain', () => {
            expect(middlewares.a.mock.calls.length).toBe(1);
            expect(middlewares.b.mock.calls.length).toBe(1);
            expect(middlewares.c.mock.calls.length).toBe(1);
            expect(middlewares.d.mock.calls.length).toBe(1);
        });

        it('should make alias for method name', () => {
            expect(microservice.call).toHaveProperty('join');
            expect(microservice.call.join).toHaveProperty('meta.someMetaProperty', 'some meta property value');
        });

        it('should use name param in method name defined', async () => {
            expect(resultOfMethodCall).toBe('<test|test>');
        });

    });

});