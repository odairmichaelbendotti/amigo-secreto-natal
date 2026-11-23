import {
  generateGroupInviteCode,
  validateWishlistItems,
} from '@/lib/utils';

const ALLOWED_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const EXCLUDED_CHARS = ['I', 'O', '0', '1'];

describe('generateGroupInviteCode', () => {
  it('returns a 6-character string', () => {
    const code = generateGroupInviteCode();
    expect(code).toHaveLength(6);
  });

  it('only contains allowed characters', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateGroupInviteCode();
      for (const char of code) {
        expect(ALLOWED_CHARS).toContain(char);
      }
    }
  });

  it('does not contain excluded characters (I, O, 0, 1, L)', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateGroupInviteCode();
      for (const excluded of EXCLUDED_CHARS) {
        expect(code).not.toContain(excluded);
      }
    }
  });

  it('multiple calls usually generate different codes', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 20; i++) {
      codes.add(generateGroupInviteCode());
    }
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe('validateWishlistItems', () => {
  const validItem = { title: 'Cool Gadget', link: 'https://example.com/gadget' };

  describe('valid cases', () => {
    it('accepts wishes with only a title', () => {
      expect(validateWishlistItems([{ title: 'Chocolate' }, { title: 'Camiseta tamanho M' }])).toEqual({ valid: true });
    });
    it('returns valid for 1 valid item', () => {
      const result = validateWishlistItems([validItem]);
      expect(result).toEqual({ valid: true });
    });

    it('returns valid for 5 valid items', () => {
      const items = Array.from({ length: 5 }, (_, i) => ({
        title: `Item ${i}`,
        link: `https://example.com/item-${i}`,
      }));
      const result = validateWishlistItems(items);
      expect(result).toEqual({ valid: true });
    });

    it('accepts various valid URL formats', () => {
      const urls = [
        'https://example.com',
        'http://example.com/path?q=1',
        'https://sub.domain.co.uk/a/b/c',
        'https://example.com/path#fragment',
      ];
      for (const link of urls) {
        const result = validateWishlistItems([{ title: 'Test', link }]);
        expect(result).toEqual({ valid: true });
      }
    });
  });

  describe('invalid item counts', () => {
    it('accepts 0 items to clear the list', () => {
      const result = validateWishlistItems([]);
      expect(result).toEqual({ valid: true });
    });

    it('returns error for 6 items', () => {
      const items = Array.from({ length: 6 }, (_, i) => ({
        title: `Item ${i}`,
        link: `https://example.com/item-${i}`,
      }));
      const result = validateWishlistItems(items);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/máximo.*5/i);
    });

    it('returns error for more than 6 items', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        title: `Item ${i}`,
        link: `https://example.com/item-${i}`,
      }));
      const result = validateWishlistItems(items);
      expect(result.valid).toBe(false);
    });
  });

  describe('invalid titles', () => {
    it('rejects titles longer than 200 characters', () => {
      expect(validateWishlistItems([{ title: 'a'.repeat(201) }]).valid).toBe(false);
    });
    it('returns error for empty title', () => {
      const result = validateWishlistItems([{ title: '', link: 'https://example.com' }]);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/título/i);
    });

    it('returns error for whitespace-only title', () => {
      const result = validateWishlistItems([{ title: '   ', link: 'https://example.com' }]);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/título/i);
    });
  });

  describe('invalid links', () => {
    it.each(['javascript:alert(1)', 'data:text/html,test', 'ftp://example.com/file'])('rejects unsafe or unsupported product links: %s', link => {
      expect(validateWishlistItems([{ title: 'Presente', link }]).valid).toBe(false);
    });
    it('accepts an empty optional link', () => {
      const result = validateWishlistItems([{ title: 'Test', link: '' }]);
      expect(result).toEqual({ valid: true });
    });

    it('accepts a whitespace-only optional link', () => {
      const result = validateWishlistItems([{ title: 'Test', link: '   ' }]);
      expect(result).toEqual({ valid: true });
    });

    it('returns error for invalid URL', () => {
      const result = validateWishlistItems([{ title: 'Test', link: 'not-a-url' }]);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/URL inválida/i);
    });

    it('returns error for partial URL', () => {
      const result = validateWishlistItems([{ title: 'Test', link: 'example.com' }]);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/URL inválida/i);
    });
  });

  describe('mixed valid and invalid items', () => {
    it('returns error if any item has empty title', () => {
      const items = [
        { title: 'Good', link: 'https://example.com' },
        { title: '', link: 'https://example.com/two' },
      ];
      const result = validateWishlistItems(items);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/título/i);
    });

    it('returns error if any item has invalid URL', () => {
      const items = [
        { title: 'Good', link: 'https://example.com' },
        { title: 'Bad URL', link: 'nope' },
      ];
      const result = validateWishlistItems(items);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/URL inválida/i);
    });
  });
});
