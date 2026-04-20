import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return a function', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 300));
    expect(typeof result.current).toBe('function');
  });

  it('should not call callback immediately', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 300));

    act(() => {
      result.current('test');
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should call callback after delay', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 300));

    act(() => {
      result.current('test');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith('test');
  });

  it('should cancel previous call when invoked again within delay', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 300));

    act(() => {
      result.current('first');
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current('second');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith('second');
  });

  it('should handle rapid successive calls', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 200));

    act(() => {
      result.current('a');
      result.current('b');
      result.current('c');
      result.current('d');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith('d');
  });

  it('should forward multiple arguments', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 100));

    act(() => {
      result.current('arg1', 42, true);
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(callback).toHaveBeenCalledWith('arg1', 42, true);
  });

  it('should respect different delay values', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 500));

    act(() => {
      result.current();
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(callback).toHaveBeenCalledOnce();
  });

  it('should allow multiple separate debounced calls after delay', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 100));

    act(() => {
      result.current('first');
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('first');

    act(() => {
      result.current('second');
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('second');
  });
});
