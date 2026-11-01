import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Huỷ',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) => (
  <Modal
    open={open}
    title={title}
    onClose={onCancel}
    footer={
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} isLoading={loading}>
          {confirmText}
        </Button>
      </div>
    }
  >
    <div className="space-y-3">
      <p className="text-sm text-slate-600 leading-6">{description}</p>
      {danger ? <p className="text-xs font-medium text-red-600">Hành động này không thể hoàn tác.</p> : null}
    </div>
  </Modal>
);

export default ConfirmDialog;
