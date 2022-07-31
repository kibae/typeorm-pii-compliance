import { BaseEntity, ObjectLiteral } from 'typeorm';
import { PiiMetadata, PiiMetadataColumn, PiiMetadataEntity } from './pii-metadata';
import { PiiMaskingMethod, PiiMetadataEntityType, PiiDisposalStrategy } from './types/pii.type';

export type EntityId = string | symbol | number | EntityId[];
export type BeforeDisposalFunc = (type: PiiMetadataEntityType, entity: ObjectLiteral | BaseEntity) => Promise<void> | void;

export interface PiiComplianceServiceOptions {
    replaceChar?: '*' | '-' | string;
    beforeDisposal?: BeforeDisposalFunc;
}

export class PiiComplianceService {
    constructor(protected readonly options?: PiiComplianceServiceOptions) {}

    private _sorted?: PiiMetadataEntity[];
    private entities(): PiiMetadataEntity[] {
        if (!this._sorted) {
            this._sorted = [...PiiMetadata.entities];
            this._sorted.sort((a, b) => b.hierarchyPriority - a.hierarchyPriority);
        }
        return this._sorted;
    }

    public async process(entityId: EntityId, beforeDisposal?: BeforeDisposalFunc): Promise<void>;
    public async process(group: string, entityId: EntityId, beforeDisposal?: BeforeDisposalFunc): Promise<void>;
    public async process(
        groupOrEntityId: string | EntityId,
        idOrCallback?: EntityId | BeforeDisposalFunc,
        callbackFunc?: BeforeDisposalFunc
    ): Promise<void> {
        let [group, entityId, beforeDisposal]: [string | undefined, EntityId[], BeforeDisposalFunc | undefined] = [
            undefined,
            [],
            undefined,
        ];
        if (idOrCallback && callbackFunc)
            [group, entityId, beforeDisposal] = [
                groupOrEntityId as string,
                idArrayize(idOrCallback as EntityId),
                callbackFunc as BeforeDisposalFunc,
            ];
        else if (idOrCallback) {
            if (typeof idOrCallback === 'function')
                [entityId, beforeDisposal] = [idArrayize(groupOrEntityId as EntityId), idOrCallback as BeforeDisposalFunc];
            else [group, entityId] = [groupOrEntityId as string, idArrayize(idOrCallback as EntityId)];
        } else entityId = idArrayize(groupOrEntityId as EntityId);

        beforeDisposal = beforeDisposal || this.options?.beforeDisposal;

        const entityConfigs = this.entities().filter((item) => (!group && !item.group) || (group && item.group === group));
        for (const { entity, columns, strategy } of entityConfigs) {
            const where: ObjectLiteral = columns.reduce<ObjectLiteral>((result, item, idx) => {
                result[item] = entityId[idx];
                return result;
            }, {});

            let columnsMeta: PiiMetadataColumn[] = [];
            if (strategy === PiiDisposalStrategy.MASKING) {
                columnsMeta = PiiMetadata.columns.filter((item) => item.entity === entity);
                if (columnsMeta.length <= 0) {
                    console.warn(
                        `PiiComplianceService: [${entity.constructor.name}] entity does not have a column referenced by @PiiColumn decorator.`
                    );
                    continue;
                }
            }

            if (beforeDisposal || strategy === PiiDisposalStrategy.MASKING) {
                const records: ObjectLiteral[] = await (entity as typeof BaseEntity).find({ where });
                for (const record of records) {
                    if (beforeDisposal) await beforeDisposal(entity, record);

                    if (strategy === PiiDisposalStrategy.MASKING) {
                        for (let column of columnsMeta)
                            record[column.name] = await PiiComplianceService.transform(
                                record[column.name],
                                column.maskingMethod,
                                this.options?.replaceChar
                            );

                        await record.save();
                    }
                }
            }

            if (strategy === PiiDisposalStrategy.DELETE) await (entity as typeof BaseEntity).delete(where);
        }
    }

    static async transform(value: any, maskingMethod: PiiMaskingMethod, replaceChar: string = '*') {
        if (typeof maskingMethod === 'function') return await maskingMethod(value);

        switch (maskingMethod) {
            case 'null':
                return null;
            case 'zero':
                return 0;
            case 'blank':
                return '';
            case 'date':
                return new Date();
        }

        replaceChar = replaceChar || '*';
        if (value === null || typeof value === 'undefined') value = '';
        value = value.toString();

        switch (maskingMethod) {
            case 'email':
                return value.replace(
                    /(.{0,5})@(.{0,5})/g,
                    (...args: any[]) => replaceChar.repeat(args[1].length) + '@' + replaceChar.repeat(args[2].length)
                );
            default:
                const method: string = maskingMethod;
                switch (method.substr(0, method.length - 1)) {
                    case 'edge': {
                        const maskLen = Number(method.substr(-1));
                        return value.replace(new RegExp(`(^.{0,${maskLen}})|(.{0,${maskLen}}$)`, 'g'), replacer(replaceChar));
                    }
                    case 'center': {
                        const maskLen = Number(method.substr(-1));
                        const len = value.length;
                        if (len <= maskLen) return replaceChar.repeat(len);

                        const center = Math.ceil(len / 2);
                        const left = value.substr(0, center);
                        const right = value.substr(center);
                        return (
                            left.replace(new RegExp(`.{0,${Math.ceil(maskLen / 2)}}$`), replacer(replaceChar)) +
                            (maskLen > 1 ? right.replace(new RegExp(`^.{0,${Math.floor(maskLen / 2)}}`), replacer(replaceChar)) : right)
                        );
                    }
                }
        }
    }
}

function replacer(replaceChar: string) {
    return (substring: string, ...args: any[]): string => {
        return replaceChar.repeat(substring.length);
    };
}

function idArrayize(id: EntityId): EntityId[] {
    return Array.isArray(id) ? id : [id];
}
