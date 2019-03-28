import { getArgsNames } from './util/function';

interface Map<T> {
    [K: string]: T;
}

interface MethodMetaInfo {
    method: Function;
    args: Map<MethodArgumentMetaInfo>;
    result: MethodArgumentMetaInfo;
}

interface MethodArgumentMetaInfo {
    name: string;
    defaultValue: any;
    validate: (value: any) => boolean;
}

interface MethodResultMetaInfo {
}

interface ServiceMetaInfoMap {
    service: any;
    methods: Map<MethodMetaInfo>;
}


export class MSC {
    private map: Map<ServiceMetaInfoMap> = {};

    host<T>(service: T, namespace: string = 'root', ServiceMetaProvider: any): MSC {
        const provider = new (<BaseServiceMetaProvider<T>>ServiceMetaProvider)(service);
        provider.exportTo(this.map);
        return this;
    }

    async invoke<T>(namespace: string, method: string, ...args: any[]): Promise<T> {
        return await this.map[namespace].methods[method].method.call(this.map[namespace].service, ...args);
    }

}

class BaseServiceMetaProvider<T> {
    constructor(private service: T) {

    }

    public exportTo(serviceMap: ServiceMap) {

        Object
            .getOwnPropertyNames(this.service.constructor.prototype)
            .reduce((map: ServiceMethodsArgumentsMap, key) => {
                const property = Object.getOwnPropertyDescriptor(service.constructor.prototype, key);
                if (key !== 'constructor' && property && typeof property.value === 'function') {
                    map.methods[key] = {
                        method: property.value,
                        args: getArgsNames(property.value),
                    };
                }
                return map;
            }, { service: this.service, methods: {} });

    }

    public getMethodMetaInfo(name: string, method: PropertyDescriptor): MethodMetaInfo {

    }
}
