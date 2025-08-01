import { useState, useCallback, useMemo } from 'react';

// Hook para gerenciar estados de loading otimizado
export const useOptimizedLoading = (initialStates = {}) => {
  const [loadingStates, setLoadingStates] = useState(initialStates);

  const setLoading = useCallback((key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);

  const isLoading = useCallback((key) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useMemo(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  return { setLoading, isLoading, isAnyLoading, loadingStates };
};

// Hook para debounce otimizado
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook para gerenciar modais de forma otimizada
export const useModalManager = () => {
  const [modals, setModals] = useState({});

  const openModal = useCallback((modalName, data = null) => {
    setModals(prev => ({ ...prev, [modalName]: { open: true, data } }));
  }, []);

  const closeModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: { open: false, data: null } }));
  }, []);

  const getModal = useCallback((modalName) => {
    return modals[modalName] || { open: false, data: null };
  }, [modals]);

  return { openModal, closeModal, getModal, modals };
};

// Hook para paginação otimizada
export const usePagination = (totalItems, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / itemsPerPage);
  }, [totalItems, itemsPerPage]);

  const startIndex = useMemo(() => {
    return (currentPage - 1) * itemsPerPage;
  }, [currentPage, itemsPerPage]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + itemsPerPage - 1, totalItems - 1);
  }, [startIndex, itemsPerPage, totalItems]);

  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};

// Hook para filtros otimizados
export const useFilters = (initialFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilter = useCallback((key) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => 
      filters[key] !== initialFilters[key] && filters[key] !== '' && filters[key] != null
    );
  }, [filters, initialFilters]);

  return {
    filters,
    updateFilter,
    clearFilter,
    clearAllFilters,
    hasActiveFilters
  };
};
