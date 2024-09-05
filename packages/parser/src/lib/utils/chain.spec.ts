import { chain } from './chain';

function addB<T>(a: T) {
  return {
    ...a,
    b: 'b',
  };
}

function addC<T>(a: T) {
  return {
    ...a,
    c: 'c',
  };
}

describe('chain', () => {
  it('should correctly type values', () => {
    const v = chain(
      {
        a: 'a',
      },
      addB,
      addC
    );
    v.a;
    v.b;
    v.c;
  });

  it('should be able to combine chains', () => {
    const v = chain(
      {
        a: 'a',
      },
      addB,
      (iv) => chain(iv, addC)
    );
    expect(v).toEqual({
      a: 'a',
      b: 'b',
      c: 'c',
    });
  });
});
