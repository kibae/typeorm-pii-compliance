import { PiiComplianceService } from '../pii-compliance-service';
import { DataSource } from 'typeorm';
import { OrderHistory1, User1 } from './entity/case1';
import { OrderHistory2, User2 } from './entity/case2';

describe('PiiComplianceService', () => {
    it('Case1 - Nullable check error', async () => {
        const dataSource = await new DataSource({
            type: 'sqlite',
            database: ':memory:',
            synchronize: true,
            logging: 'all',
            entities: [User1, OrderHistory1],
        }).initialize();

        const service = new PiiComplianceService();

        const user = await User1.create({
            id: 1,
            firstName: 'Jane',
            lastName: 'Doe',
            age: 10,
            email: 'jane.doe@anon.com',
            address: '747 post st',
            phoneNumber: '+0-111-2222-3333',
        }).save();

        await OrderHistory1.create({
            seq: 1000,
            user: user,
            goodsId: 1000,
            address: '747 post st',
            phoneNumber: '+0-111-2222-3333',
            email: 'jane.doe@anon.com',
        }).save();

        await expect(service.process('case1', 1)).rejects.toThrowError();

        const entity = await User1.findOneBy({ id: 1 });
        expect(entity?.firstName).toBe('Jane');
        expect(entity?.lastName).toBe('Doe');

        //but OrderHistory1 truncated
        expect((await OrderHistory1.find()).length).toBe(0);

        await dataSource.destroy();
    });

    it('Case2', async () => {
        const dataSource = await new DataSource({
            type: 'sqlite',
            database: ':memory:',
            synchronize: true,
            logging: 'all',
            entities: [User2, OrderHistory2],
        }).initialize();

        const service = new PiiComplianceService();

        const user = await User2.create({
            id: 1,
            firstName: 'Jane',
            lastName: 'Doe',
            age: 10,
            email: 'jane.doe@anon.com',
            address: '747 post st',
            phoneNumber: '+0-111-2222-3333',
        }).save();

        await OrderHistory2.create({
            seq: 1000,
            user: user,
            goodsId: 1000,
            address: '747 post st',
            phoneNumber: '+0-111-2222-3333',
            email: 'jane.doe@anon.com',
        }).save();

        await service.process('case2', 1);

        const entity = await User2.findOneBy({ id: 1 });
        expect(entity?.firstName).toBe('');
        expect(entity?.lastName).toBe('*o*');
        expect(entity?.age).toBe(0);
        expect(entity?.email).toBe('jan*****@*****com');
        expect(entity?.address).toBe('747 **** st');
        expect(entity?.phoneNumber).toBe('**-111-2222-33**');

        //but OrderHistory1 truncated
        expect((await OrderHistory2.find()).length).toBe(0);

        await dataSource.destroy();
    });

    it('Case2 - Callback', async () => {
        const dataSource = await new DataSource({
            type: 'sqlite',
            database: ':memory:',
            synchronize: true,
            logging: 'all',
            entities: [User2, OrderHistory2],
        }).initialize();

        const service = new PiiComplianceService();

        const user = await User2.create({
            id: 1,
            firstName: 'Jane',
            lastName: 'Doe',
            age: 10,
            email: 'jane.doe@anon.com',
            address: '747 post st',
            phoneNumber: '+0-111-2222-3333',
        }).save();

        await OrderHistory2.create({
            seq: 1000,
            user: user,
            goodsId: 1000,
            address: '747 post st',
            phoneNumber: '+0-111-2222-3333',
            email: 'jane.doe@anon.com',
        }).save();

        await service.process('case2', 1, (type, entity) => {
            expect(type).toBeDefined();
            expect(entity).toBeDefined();
        });

        const entity = await User2.findOneBy({ id: 1 });
        expect(entity?.firstName).toBe('');
        expect(entity?.lastName).toBe('*o*');
        expect(entity?.age).toBe(0);
        expect(entity?.email).toBe('jan*****@*****com');
        expect(entity?.address).toBe('747 **** st');
        expect(entity?.phoneNumber).toBe('**-111-2222-33**');

        expect((await OrderHistory2.find()).length).toBe(0);

        await dataSource.destroy();
    });
});
