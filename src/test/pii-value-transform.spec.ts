import { PiiComplianceService } from '../pii-compliance-service';

describe('PiiValueTransform', () => {
    it('Transform - Misc', async () => {
        expect(await PiiComplianceService.transform(null, 'null')).toBeNull();
        expect(await PiiComplianceService.transform(undefined, 'null')).toBeNull();

        expect(await PiiComplianceService.transform(null, 'blank')).toBe('');
        expect(await PiiComplianceService.transform(undefined, 'blank')).toBe('');

        expect(await PiiComplianceService.transform(null, 'zero')).toBe(0);
        expect(await PiiComplianceService.transform(undefined, 'zero')).toBe(0);

        expect(await PiiComplianceService.transform('some value', 'null')).toBeNull();
        expect(await PiiComplianceService.transform('some value', 'zero')).toBe(0);
        expect(await PiiComplianceService.transform('some value', 'blank')).toBe('');
        expect(await PiiComplianceService.transform('jane.doe@anon.com', 'email')).toBe('jan*****@*****com');
    });

    it('Transform - Edge', async () => {
        expect(await PiiComplianceService.transform('some value', 'edge1')).toBe('*ome valu*');
        expect(await PiiComplianceService.transform('some value', 'edge2')).toBe('**me val**');
        expect(await PiiComplianceService.transform('some value', 'edge3')).toBe('***e va***');
        expect(await PiiComplianceService.transform('some value', 'edge4')).toBe('**** v****');
        expect(await PiiComplianceService.transform('some value', 'edge5')).toBe('**********');
        expect(await PiiComplianceService.transform('some value', 'edge6')).toBe('**********');
        expect(await PiiComplianceService.transform('some value', 'edge7')).toBe('**********');
        expect(await PiiComplianceService.transform('some value', 'edge8')).toBe('**********');
    });

    it('Transform - Center', async () => {
        expect(await PiiComplianceService.transform('some value', 'center1')).toBe('some*value');
        expect(await PiiComplianceService.transform('some value', 'center2')).toBe('some**alue');
        expect(await PiiComplianceService.transform('some value', 'center3')).toBe('som***alue');
        expect(await PiiComplianceService.transform('some value', 'center4')).toBe('som****lue');
        expect(await PiiComplianceService.transform('some value', 'center5')).toBe('so*****lue');
        expect(await PiiComplianceService.transform('some value', 'center6')).toBe('so******ue');
        expect(await PiiComplianceService.transform('some value', 'center7')).toBe('s*******ue');
        expect(await PiiComplianceService.transform('some value', 'center8')).toBe('s********e');
    });
});
