import { readDefaultValue } from './read-default-value';
describe('readDefaultValue', () => {
  it('should return the default value if no description provided', () => {
    const val = readDefaultValue({
      type: 'string',
      default: 'default',
    });
    expect(val).toEqual(['default', undefined]);
  });

  it('should return the default value with description', () => {
    const val = readDefaultValue({
      type: 'string',
      default: {
        value: 'default',
        description: 'description',
      },
    });
    expect(val).toEqual(['default', 'description']);
  });

  it('should return the default value with description from factory', () => {
    const val = readDefaultValue({
      type: 'string',
      default: {
        factory: () => 'default',
        description: 'description',
      },
    });
    expect(val).toEqual(['default', 'description']);
  });
});
