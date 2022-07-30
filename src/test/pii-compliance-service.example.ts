import { DataSource } from 'typeorm';
import { OrderHistory2, User2 } from './entity/case2';
import { PiiComplianceService } from '../pii-compliance-service';

export const AppDataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    synchronize: true,
    logging: 'all',
    entities: [User2, OrderHistory2],
});

AppDataSource.initialize()
    .then(async (dataSource) => {
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
            console.log(type, entity);
        });
    })
    .catch((error) => console.log(error));
