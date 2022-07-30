import { PiiMetadata } from '../pii-metadata';
import { PiiMaskingMethod } from '../types/pii.type';

export interface PiiColumnOptions {
    maskingMethod: PiiMaskingMethod;
}

export const PiiColumn =
    (options: PiiColumnOptions): PropertyDecorator =>
    (target: any, key: string | symbol) => {
        PiiMetadata.columns.push({
            entity: target.constructor,
            name: key.toString(),
            maskingMethod: options.maskingMethod,
        });
    };
