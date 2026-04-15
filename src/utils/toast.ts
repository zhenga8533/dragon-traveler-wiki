import { notifications } from '@mantine/notifications';

interface ToastInput {
  title: string;
  message: string;
  autoClose?: number;
  id?: string;
}

function showToast(
  color: 'teal' | 'yellow' | 'gray' | 'red',
  { title, message, autoClose = 3000, id }: ToastInput
) {
  notifications.show({
    color,
    title,
    message,
    autoClose,
    withBorder: true,
    ...(id ? { id } : {}),
  });
}

export function showSuccessToast(input: ToastInput) {
  showToast('teal', input);
}

export function showWarningToast(input: ToastInput) {
  showToast('yellow', input);
}

export function showInfoToast(input: ToastInput) {
  showToast('gray', input);
}

export function showErrorToast(input: ToastInput) {
  showToast('red', input);
}
