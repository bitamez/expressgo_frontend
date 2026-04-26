import { useState, useEffect, useCallback } from 'react';
import aiService from './aiService';

export const useAI = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // aiService.getRecommendations() never throws — returns live or fallback data
      const data = await aiService.getRecommendations();
      setRecommendations(Array.isArray(data) ? data : []);
    } catch (err) {
      // Shouldn't reach here, but kept as a safety net
      console.warn('Unexpected error in useAI:', err.message);
      setError(null); // Don't show error banner; fallback data is already shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return { recommendations, loading, error, refresh: fetchRecommendations };
};
