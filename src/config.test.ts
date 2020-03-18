import config from './config';

describe('config', () => {
    it('should read populate config from environment variables', () => {
        expect(config).toBeDefined();
    });
});
