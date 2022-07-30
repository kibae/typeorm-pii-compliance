import { PiiMaskingMethod, PiiMetadataEntityType, PiiDisposalStrategy } from './types/pii.type';

export interface PiiMetadataEntity {
    group?: string;
    strategy?: PiiDisposalStrategy;
    entity: PiiMetadataEntityType;
    columns: string[];
    hierarchyPriority: number;
}

export interface PiiMetadataColumn {
    entity: PiiMetadataEntityType;
    name: string;
    maskingMethod: PiiMaskingMethod;
}

export class PiiMetadata {
    public static readonly entities: PiiMetadataEntity[] = [];
    public static readonly columns: PiiMetadataColumn[] = [];
}
