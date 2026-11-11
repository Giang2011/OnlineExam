import { describe, expect, it } from 'vitest';
import { resolveUploadUrl } from '@/shared/lib/upload-url';

describe('resolveUploadUrl', () => {
  it('trả về null cho giá trị rỗng', () => {
    expect(resolveUploadUrl(null)).toBeNull();
    expect(resolveUploadUrl(undefined)).toBeNull();
    expect(resolveUploadUrl('')).toBeNull();
    expect(resolveUploadUrl('   ')).toBeNull();
  });

  it('giữ nguyên URL tuyệt đối', () => {
    expect(resolveUploadUrl('http://example.com/a.png')).toBe('http://example.com/a.png');
    expect(resolveUploadUrl('https://example.com/a.png')).toBe('https://example.com/a.png');
  });

  it('giữ nguyên data URI', () => {
    const dataUri = 'data:image/png;base64,AAAA';
    expect(resolveUploadUrl(dataUri)).toBe(dataUri);
  });

  it('thêm base URL cho đường dẫn đã có prefix /uploads', () => {
    expect(resolveUploadUrl('/uploads/questions/a.png')).toBe('/api/v1/uploads/questions/a.png');
  });

  it('thêm base URL cho đường dẫn không có dấu gạch chéo đầu', () => {
    expect(resolveUploadUrl('uploads/questions/a.png')).toBe('/api/v1/uploads/questions/a.png');
  });

  it('cắt bỏ tiền tố thư mục trước "uploads/"', () => {
    expect(resolveUploadUrl('/some/prefix/uploads/questions/a.png')).toBe(
      '/api/v1/uploads/questions/a.png',
    );
  });

  it('không lặp dấu gạch chéo khi đường dẫn bắt đầu bằng nhiều dấu', () => {
    expect(resolveUploadUrl('///uploads/questions/a.png')).toBe('/api/v1/uploads/questions/a.png');
  });
});
