import { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/lib/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/lib/ui/dialog';
import { Input } from '@/lib/ui/input';

interface CredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  password: string;
}

/**
 * Popup hiển thị credentials chỉ 1 lần duy nhất — backend không trả lại lần hai.
 */
export function CredentialsDialog({ open, onOpenChange, username, password }: CredentialsDialogProps) {
  // Key theo open để reset trạng thái nội bộ mỗi lần mở lại.
  return (
    <CredentialsDialogBody
      key={open ? 'open' : 'closed'}
      open={open}
      onOpenChange={onOpenChange}
      username={username}
      password={password}
    />
  );
}

function CredentialsDialogBody({
  open,
  onOpenChange,
  username,
  password,
}: CredentialsDialogProps) {
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState<'username' | 'password' | null>(null);

  const copy = async (value: string, field: 'username' | 'password') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Trình duyệt không cho sao chép tự động. Hãy bôi đen và copy thủ công.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thông tin đăng nhập của học sinh</DialogTitle>
          <DialogDescription>
            Tên đăng nhập và mật khẩu chỉ hiển thị đúng một lần. Ghi lại và đưa cho học sinh trước khi đóng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <CredentialRow
            label="Tên đăng nhập"
            value={username}
            copied={copied === 'username'}
            onCopy={() => copy(username, 'username')}
          />
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-ink">Mật khẩu</p>
            <div className="flex items-center gap-2">
              {/* type="password" khi ẩn để không lộ mật khẩu trên màn hình
                  (screenshot, chia sẻ màn hình) — vẫn copy được bình thường. */}
              <Input
                readOnly
                type={showPassword ? 'text' : 'password'}
                value={password}
                className="tabular"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Sao chép mật khẩu"
                onClick={() => copy(password, 'password')}
              >
                {copied === 'password' ? (
                  <Check className="size-4 text-jade" aria-hidden="true" />
                ) : (
                  <Copy className="size-4" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Tôi đã ghi lại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CredentialRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-ink">{label}</p>
      <div className="flex items-center gap-2">
        <Input readOnly value={value} className="tabular" />
        <Button type="button" variant="outline" size="icon" aria-label={`Sao chép ${label}`} onClick={onCopy}>
          {copied ? (
            <Check className="size-4 text-jade" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
}
