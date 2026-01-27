import { renderHook, act } from '@testing-library/react';
import { useStore } from './useStore';

describe('useStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useStore());
    act(() => {
      result.current.reset();
    });
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useStore());

    expect(result.current.tableData).toBeNull();
    expect(result.current.selectedTheme).toBe('dark');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.creditsRemaining).toBe(5);
  });

  it('should set table data', () => {
    const { result } = renderHook(() => useStore());
    const testData = {
      headers: ['Name', 'Age'],
      rows: [['John', '30'], ['Jane', '25']]
    };

    act(() => {
      result.current.setTableData(testData);
    });

    expect(result.current.tableData).toEqual(testData);
  });

  it('should set theme', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.selectedTheme).toBe('light');
  });

  it('should set loading state', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('should set error', () => {
    const { result } = renderHook(() => useStore());
    const errorMessage = 'Test error';

    act(() => {
      result.current.setError(errorMessage);
    });

    expect(result.current.error).toBe(errorMessage);
  });

  it('should clear error when set to null', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.setError('Error');
    });
    expect(result.current.error).toBe('Error');

    act(() => {
      result.current.setError(null);
    });
    expect(result.current.error).toBeNull();
  });

  it('should decrement credits', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.decrementCredits();
    });

    expect(result.current.creditsRemaining).toBe(4);
  });

  it('should not decrement credits below zero', () => {
    const { result } = renderHook(() => useStore());

    // Set to 1 first
    act(() => {
      result.current.setCredits(1);
    });

    act(() => {
      result.current.decrementCredits();
    });

    expect(result.current.creditsRemaining).toBe(0);

    act(() => {
      result.current.decrementCredits();
    });

    expect(result.current.creditsRemaining).toBe(0);
  });

  it('should set credits directly', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.setCredits(10);
    });

    expect(result.current.creditsRemaining).toBe(10);
  });

  it('should reset all state', () => {
    const { result } = renderHook(() => useStore());
    const testData = {
      headers: ['Name'],
      rows: [['John']]
    };

    act(() => {
      result.current.setTableData(testData);
      result.current.setTheme('business');
      result.current.setLoading(true);
      result.current.setError('Error');
      result.current.setCredits(3);
    });

    expect(result.current.tableData).toEqual(testData);
    expect(result.current.selectedTheme).toBe('business');
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe('Error');
    expect(result.current.creditsRemaining).toBe(3);

    act(() => {
      result.current.reset();
    });

    expect(result.current.tableData).toBeNull();
    expect(result.current.selectedTheme).toBe('dark');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.creditsRemaining).toBe(5);
  });

  it('should have no credits when creditsRemaining is 0', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.setCredits(0);
    });

    expect(result.current.hasCredits).toBe(false);
  });

  it('should have credits when creditsRemaining is greater than 0', () => {
    const { result } = renderHook(() => useStore());

    expect(result.current.hasCredits).toBe(true);

    act(() => {
      result.current.setCredits(5);
    });

    expect(result.current.hasCredits).toBe(true);
  });
});
