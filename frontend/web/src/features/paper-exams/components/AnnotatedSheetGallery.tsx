import { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/lib/ui/dialog';
import { resolveUploadUrl } from '@/shared/lib/upload-url';
import { cn } from '@/shared/utils/cn';

interface AnnotatedSheetGalleryProps {
  /** Đường dẫn ảnh đã khoanh, nhiều trang nối bằng dấu phẩy. */
  annotatedImagePath: string | null;
}

/**
 * Hiển thị ảnh phiếu đã chấm (khoanh xanh/đỏ).
 *
 * Ảnh do engine OMR dựng sau khi đã căn chỉnh về trang chuẩn, nên vòng khoanh
 * luôn khớp đúng ô thí sinh đã tô — khác với ảnh chụp thô vốn bị nghiêng.
 *
 * Ảnh chỉ khoanh ở những ô thí sinh đã tô, không khoanh ô đáp án đúng mà thí sinh
 * bỏ trống, nên ảnh không tiết lộ đáp án.
 */
export function AnnotatedSheetGallery({ annotatedImagePath }: AnnotatedSheetGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const paths = (annotatedImagePath ?? '')
    .split(',')
    .map((path) => path.trim())
    .filter((path) => path.length > 0);
  const urls = paths.map((path) => resolveUploadUrl(path)).filter((url): url is string => url !== null);

  // Không có ảnh thì không dựng khung rỗng.
  if (urls.length === 0) return null;

  const activeUrl = activeIndex !== null ? urls[activeIndex] : null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">Phiếu đã chấm</h2>
        <AnnotatedLegend />
      </div>

      {urls.length === 1 ? (
        <AnnotatedThumbnail
          url={urls[0]}
          label="Phiếu trả lời đã chấm — vòng xanh là ô đã tô đúng, vòng đỏ là ô đã tô sai"
          onOpen={() => setActiveIndex(0)}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {urls.map((url, index) => (
            <AnnotatedThumbnail
              key={url}
              url={url}
              label={`Phiếu trả lời đã chấm — trang ${index + 1}. Vòng xanh là ô đã tô đúng, vòng đỏ là ô đã tô sai`}
              onOpen={() => setActiveIndex(index)}
            />
          ))}
        </div>
      )}

      <Dialog open={activeUrl !== null} onOpenChange={(open) => !open && setActiveIndex(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {urls.length > 1 && activeIndex !== null ? `Phiếu đã chấm — trang ${activeIndex + 1}` : 'Phiếu đã chấm'}
            </DialogTitle>
          </DialogHeader>
          {activeUrl ? (
            <img
              src={activeUrl}
              alt="Phiếu trả lời đã chấm — vòng xanh là ô đã tô đúng, vòng đỏ là ô đã tô sai"
              className="max-h-[75vh] w-full rounded border border-rule bg-paper object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function AnnotatedThumbnail({ url, label, onOpen }: { url: string; label: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'group relative overflow-hidden rounded-md border border-rule bg-paper-raised transition hover:border-chalk/60 focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-chalk focus-visible:ring-offset-2',
      )}
    >
      <img src={url} alt={label} className="h-auto w-full object-contain" />
      <span className="absolute right-2 top-2 rounded bg-ink/70 p-1.5 text-paper opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
        <Maximize2 className="h-4 w-4" aria-hidden="true" />
      </span>
    </button>
  );
}

/** Chú giải màu của ảnh khoanh. */
function AnnotatedLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-2 text-xs">
      <LegendChip tone="jade" label="Xanh: ô đã tô đúng" />
      <LegendChip tone="pen" label="Đỏ: ô đã tô sai" />
      <LegendChip tone="chalk" label="Vàng: cần xem lại" />
    </ul>
  );
}

function LegendChip({ tone, label }: { tone: 'jade' | 'pen' | 'chalk'; label: string }) {
  const dotClass = {
    jade: 'bg-jade',
    pen: 'bg-pen',
    chalk: 'bg-chalk',
  }[tone];

  return (
    <li className="inline-flex items-center gap-1.5 rounded border border-rule bg-paper-raised px-2 py-1 text-slate">
      <span className={cn('h-2.5 w-2.5 rounded-full', dotClass)} aria-hidden="true" />
      {label}
    </li>
  );
}
