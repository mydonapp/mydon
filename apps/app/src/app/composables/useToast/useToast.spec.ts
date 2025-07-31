import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useToast } from '../useToast';

describe('useToast', () => {
  beforeEach(() => {
    // Clear all toasts before each test
    const { clearAll } = useToast();
    clearAll();

    // Clear all timers
    vi.clearAllTimers();
  });

  it('should initialize with empty toasts array', () => {
    const { toasts } = useToast();
    expect(toasts.value).toEqual([]);
  });

  it('should add a toast with default type info', () => {
    const { showToast, toasts } = useToast();

    showToast('Test message');

    expect(toasts.value).toHaveLength(1);
    expect(toasts.value[0]).toMatchObject({
      message: 'Test message',
      type: 'info',
      duration: 4000,
    });
    expect(toasts.value[0].id).toBeDefined();
  });

  it('should add toast with specific type', () => {
    const { showToast, toasts } = useToast();

    showToast('Success message', 'success');

    expect(toasts.value).toHaveLength(1);
    expect(toasts.value[0]).toMatchObject({
      message: 'Success message',
      type: 'success',
      duration: 4000,
    });
  });

  it('should add toast with custom duration', () => {
    const { showToast, toasts } = useToast();

    showToast('Custom duration', 'warning', 2000);

    expect(toasts.value).toHaveLength(1);
    expect(toasts.value[0]).toMatchObject({
      message: 'Custom duration',
      type: 'warning',
      duration: 2000,
    });
  });

  it('should remove toast by id', () => {
    const { showToast, removeToast, toasts } = useToast();

    const id = showToast('Test message');
    expect(toasts.value).toHaveLength(1);

    removeToast(id);
    expect(toasts.value).toHaveLength(0);
  });

  it('should handle removing non-existent toast gracefully', () => {
    const { removeToast, toasts } = useToast();

    expect(() => removeToast('non-existent-id')).not.toThrow();
    expect(toasts.value).toHaveLength(0);
  });

  it('should clear all toasts', () => {
    const { showToast, clearAll, toasts } = useToast();

    showToast('Message 1');
    showToast('Message 2');
    showToast('Message 3');

    expect(toasts.value).toHaveLength(3);

    clearAll();
    expect(toasts.value).toHaveLength(0);
  });

  it('should provide convenience methods', () => {
    const { success, error, warning, info, toasts } = useToast();

    success('Success message');
    error('Error message');
    warning('Warning message');
    info('Info message');

    expect(toasts.value).toHaveLength(4);
    expect(toasts.value[0].type).toBe('success');
    expect(toasts.value[1].type).toBe('error');
    expect(toasts.value[2].type).toBe('warning');
    expect(toasts.value[3].type).toBe('info');
  });

  it('should auto-remove toasts after duration', () => {
    vi.useFakeTimers();

    const { showToast, toasts } = useToast();

    showToast('Auto remove message', 'info', 1000);
    expect(toasts.value).toHaveLength(1);

    // Fast-forward time by 1000ms
    vi.advanceTimersByTime(1000);

    expect(toasts.value).toHaveLength(0);

    vi.useRealTimers();
  });

  it('should not auto-remove toasts with duration 0', () => {
    vi.useFakeTimers();

    const { showToast, toasts } = useToast();

    showToast('Persistent message', 'info', 0);
    expect(toasts.value).toHaveLength(1);

    // Fast-forward time significantly
    vi.advanceTimersByTime(10000);

    expect(toasts.value).toHaveLength(1);

    vi.useRealTimers();
  });

  it('should handle multiple toasts with different durations', () => {
    vi.useFakeTimers();

    const { showToast, toasts } = useToast();

    showToast('Message 1', 'info', 1000);
    showToast('Message 2', 'info', 2000);
    showToast('Message 3', 'info', 3000);

    expect(toasts.value).toHaveLength(3);

    // After 1000ms, first toast should be removed
    vi.advanceTimersByTime(1000);
    expect(toasts.value).toHaveLength(2);

    // After another 1000ms (2000ms total), second toast should be removed
    vi.advanceTimersByTime(1000);
    expect(toasts.value).toHaveLength(1);

    // After another 1000ms (3000ms total), third toast should be removed
    vi.advanceTimersByTime(1000);
    expect(toasts.value).toHaveLength(0);

    vi.useRealTimers();
  });

  it('should return unique ids for each toast', () => {
    const { showToast, toasts } = useToast();

    const id1 = showToast('Message 1');
    const id2 = showToast('Message 2');
    const id3 = showToast('Message 3');

    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);

    expect(toasts.value[0].id).toBe(id1);
    expect(toasts.value[1].id).toBe(id2);
    expect(toasts.value[2].id).toBe(id3);
  });
});
