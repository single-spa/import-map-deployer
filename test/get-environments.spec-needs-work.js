const api = require('./http-api.js');

describe('GET /environments', () => {
  it('returns just the default environment if no other is specified', async () => {
    const response = await api.getEnvironments()
    expect(response.environments).toEqual([{
      name: 'default',
      isDefault: true,
      aliases: []
    }]);
  });

  it('returns all the envs in the config, including default if present', () => {
    configHelper.setConfig({
      locations: {
        default: '1',
        prod: '1',
        stage: '2',
      }
    });

    return api.getEnvironments()
      .then((response) => {
        expect(response.environments).toEqual([
          {
            name: 'default',
            isDefault: true,
            aliases: ['prod']
          },
          {
            name: 'prod',
            isDefault: true,
            aliases: ['default']
          },
          {
            name: 'stage',
            isDefault: false,
            aliases: []
          },
        ]);
      })
  });

  it(`does not return "default" if it's not in the config`, () => {
    configHelper.setConfig({
      locations: {
        prod: '1',
        stage: '2',
      }
    });

    return api.getEnvironments()
      .then((response) => {
        expect(response.environments).toEqual([
          {
            name: 'prod',
            isDefault: false,
            aliases: []
          },
          {
            name: 'stage',
            isDefault: false,
            aliases: []
          },
        ]);
      })
  })
});
