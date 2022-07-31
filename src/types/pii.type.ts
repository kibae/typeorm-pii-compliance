import { BaseEntity } from 'typeorm';

export type PiiMetadataEntityType = Pick<typeof BaseEntity, 'find' | 'delete' | 'save'>;

export enum PiiDisposalStrategy {
    DELETE = 'DELETE',
    MASKING = 'MASKING',
}
export type PiiMaskingMethod =
    | 'null'
    | 'zero'
    | 'blank'
    | 'date'
    | 'edge1'
    | 'edge2'
    | 'edge3'
    | 'edge4'
    | 'edge5'
    | 'edge6'
    | 'edge7'
    | 'edge8'
    | 'center1'
    | 'center2'
    | 'center3'
    | 'center4'
    | 'center5'
    | 'center6'
    | 'center7'
    | 'center8'
    | 'email'
    | (<T>(value: T) => Promise<T> | T);
