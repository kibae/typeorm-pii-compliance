import { BaseEntity, Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PiiColumn } from '../../decorators/pii-column.decorator';
import { PiiHierarchyLevel, PiiId } from '../../decorators/pii-id.decorator';
import { PiiDisposalStrategy } from '../../types/pii.type';

@Entity()
export class User2 extends BaseEntity {
    @PrimaryGeneratedColumn()
    @PiiId({ hierarchyLevel: PiiHierarchyLevel.TOP, group: 'case2' })
    id!: number;

    @Column()
    @PiiColumn({ maskingMethod: 'blank' })
    firstName!: string;

    @Column()
    @PiiColumn({ maskingMethod: 'edge1' })
    lastName!: string;

    @Column()
    @PiiColumn({ maskingMethod: 'zero' })
    age!: number;

    @Column()
    @PiiColumn({ maskingMethod: 'center4' })
    address!: string;

    @Column()
    @PiiColumn({ maskingMethod: 'edge2' })
    phoneNumber!: string;

    @Column()
    @PiiColumn({ maskingMethod: 'email' })
    email!: string;
}

@Entity()
export class OrderHistory2 extends BaseEntity {
    @PrimaryGeneratedColumn()
    seq!: number;

    @Index()
    @ManyToOne((type) => User2, (parent) => parent.id, { cascade: true })
    @PiiId({ strategy: PiiDisposalStrategy.DELETE, hierarchyLevel: PiiHierarchyLevel.LEAF, group: 'case2' })
    user!: User2;

    @Column()
    //@ManyToOne(...)
    goodsId!: number;

    @Column()
    address!: string;

    @Column()
    phoneNumber!: string;

    @Column()
    email!: string;

    @CreateDateColumn()
    createdAt!: Date;
}
