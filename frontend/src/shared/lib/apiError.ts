export type ApiErrorStatus = 400 | 401 | 403 | 404 | 409 | 413 | 422 | 429 | 500 | number;

const fallbackMessage = 'Đã xảy ra lỗi khi gọi API. Vui lòng thử lại sau.';

export const getApiErrorMessage = (status?: ApiErrorStatus, fallback = fallbackMessage): string => {
  switch (status) {
    case 400:
      return 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại dữ liệu nhập.';
    case 401:
      return 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
    case 403:
      return 'Bạn không có quyền thực hiện thao tác này.';
    case 404:
      return 'Không tìm thấy dữ liệu yêu cầu.';
    case 409:
      return 'Dữ liệu bị trùng hoặc xung đột với hệ thống hiện tại.';
    case 413:
      return 'Tệp tải lên quá lớn. Vui lòng chọn tệp nhỏ hơn giới hạn hệ thống.';
    case 422:
      return 'Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.';
    case 429:
      return 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.';
    case 500:
      return 'Máy chủ gặp lỗi. Vui lòng thử lại sau.';
    default:
      return fallback;
  }
};

export const normalizeApiErrorMessage = (error: any): string => {
  const status = error?.response?.status;
  const serverMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.detail;

  if (typeof serverMessage === 'string' && serverMessage.trim().length > 0) {
    return serverMessage;
  }

  const clientMessage = typeof error?.message === 'string' ? error.message : undefined;
  return getApiErrorMessage(status, clientMessage || fallbackMessage);
};
