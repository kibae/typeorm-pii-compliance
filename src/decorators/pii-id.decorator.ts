import { PiiMetadata } from '../pii-metadata';
import { PiiDisposalStrategy } from '../types/pii.type';

export enum PiiHierarchyLevel {
    TOP = 0,
    HIGHER,
    HIGH,
    MIDDLE,
    LOW,
    LOWER,
    LEAF = Number.MAX_VALUE,
}

export interface PiiIdOptions {
    /**
     * Items with a lower hierarchy level (LEAF) are processed first, and items with a higher level (TOP) are processed last.
     * This is to prevent items with a lower hierarchy level from being deleted by a trigger or FK cascade operation when TOP level items are processed first.
     */
    hierarchyLevel: PiiHierarchyLevel;

    strategy?: PiiDisposalStrategy;
    group?: string;
}

export const PiiId =
    (options: PiiIdOptions): PropertyDecorator =>
    (target: any, key: string | symbol) => {
        const currentDefinition = PiiMetadata.entities.find((item) => item.entity === target.constructor);
        if (currentDefinition) {
            if (
                currentDefinition.strategy !== options?.strategy ||
                currentDefinition.group !== options?.group ||
                currentDefinition.hierarchyPriority !== options?.hierarchyLevel
            )
                throw new Error(
                    `PII Compliance: [${target.constructor.name}] PiiId decorator is set for multiple columns. However, the (group or strategy or order) option value is different.`
                );
            currentDefinition.columns.push(key.toString());
        } else
            PiiMetadata.entities.push({
                group: options.group,
                entity: target.constructor,
                columns: [key.toString()],
                strategy: options.strategy || PiiDisposalStrategy.MASKING,
                hierarchyPriority: options.hierarchyLevel,
            });
    };
