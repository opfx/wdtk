import { helloWorldMessage } from './sample';
describe('sample', () => {
  it('should work', () => {
    const actual = helloWorldMessage();
    const expected = 'Hello world';
    expect(actual).toBe(expected);
  });
});
