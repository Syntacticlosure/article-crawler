import 'reflect-metadata';
import { Handlers } from './types';
const refl = {
    hasMetadata: (key: string, target: Object, method: string | undefined) =>
        method ? Reflect.hasMetadata(key, target, method) : 
            Reflect.hasMetadata(key, target),
    getMetadata: (key: string, target: Object, method: string | undefined) =>
        method ? Reflect.getMetadata(key, target, method) :
            Reflect.getMetadata(key, target),
    defineMetadata: (key: string, value: any, target: Object, method: string | undefined) =>
        method ? Reflect.defineMetadata(key,value, target, method) :
            Reflect.defineMetadata(key, value,target),
};
function updateMetadata<T>(key: string,
    updater: (x: T) => T, init: T,target:Object,method ?: string) {
    if (!refl.hasMetadata(key, target , method)) {
        refl.defineMetadata(key, init, target, method);
    }
    const metadata= refl.getMetadata(key, target, method) as T;
    refl.defineMetadata(key, updater(metadata), target, method);
}

export function matchUrl(reg: RegExp): MethodDecorator {
    return (target, key, desc) => {
        updateMetadata('handlers', (arr : Handlers) => {
            arr.push({
                handler: target[key],
                regexp:reg,
            });
            return arr;
        },
        [],target);
    };
}