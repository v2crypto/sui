import { decimalDivide, decimalMul, decimalPow } from "../utils";



describe('divide', () => {
  it('should return the correct division result', () => {
    expect(decimalDivide(10, 2)).toBe(5);
    expect(decimalDivide(100, 20)).toBe(5);
    expect(decimalDivide(7, 3)).toBeCloseTo(2.333, 3);
  });

  it('should handle dividing by zero', () => {
    expect(decimalDivide(10, 0)).toBe(Infinity);
    expect(decimalDivide(0, 5)).toBe(0);
  });
});


describe('decimalPow', () => {
  it('should return the correct power result', () => {
    expect(decimalPow(2, 3)).toBe(8);
    expect(decimalPow(3, 2)).toBe(9);
    expect(decimalPow(5, 0)).toBe(1);
    expect(decimalPow(10, 10)).toBe(10000000000);
  });

  it('should handle negative exponents', () => {
    expect(decimalPow(2, -2)).toBe(0.25);
    expect(decimalPow(3, -3)).toBe(0.037037037037037035);
    expect(decimalPow(10, -1)).toBe(0.1);
  });
});


describe('decimalMul', () => {
  it('should return the correct multiplication result', () => {
    expect(decimalMul(2, 3)).toBe(6);
    expect(decimalMul(3, 4)).toBe(12);
    expect(decimalMul(0, 5)).toBe(0);
    expect(decimalMul(-2, 5)).toBe(-10);
  });

  it('should handle decimal numbers', () => {
    expect(decimalMul(2.5, 2)).toBe(5);
    expect(decimalMul(0.1, 0.2)).toBeCloseTo(0.02, 2);
    expect(decimalMul(-1.5, 3)).toBeCloseTo(-4.5, 1);
  });
});