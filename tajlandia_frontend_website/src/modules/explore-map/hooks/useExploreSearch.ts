/**
 * useExploreSearch hook
 *
 * Manages search query, suggestions (autocomplete), recent history.
 * Debounces suggestions, auto-loads history on mount.
 */

"use client";

import { useEffect, useState } from "react";
import { isBrowserApiError } from "@/lib/api/client.browser";
import type { RecentSearchItem, SearchResult, Suggestion } from "@/lib/api/explore.schemas";
import {
  clearRecentSearches,
  deleteRecentSearch,
  fetchRecentSearches,
  fetchSearchSuggestions,
  saveRecentSearch,
  searchPlots,
} from "../services/explore.service";

export type UseExploreSearchState = {
  query: string;
  suggestions: Suggestion[];
  results: SearchResult[];
  recentSearches: RecentSearchItem[];
  
  isSearching: boolean;
  isFetchingSuggestions: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  
  setQuery: (q: string) => void;
  performSearch: () => Promise<void>;
  clearSearch: () => void;
  saveSearch: (query: string, type?: "LOCATION" | "ZONE" | "PLOT") => Promise<void>;
  removeRecentSearch: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  refreshHistory: () => void;
};

const SUGGESTION_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export function useExploreSearch(): UseExploreSearchState {
  const [query, setQueryState] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load recent searches on mount
  useEffect(() => {
    let mounted = true;

    fetchRecentSearches()
      .then((history) => {
        if (mounted) {
          setRecentSearches(history);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(
            isBrowserApiError(err) ? err.message : "Failed to load search history",
          );
        }
      })
      .finally(() => {
        if (mounted) setIsLoadingHistory(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Debounced suggestions fetch
  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      return;
    }

    let mounted = true;
    const timer = window.setTimeout(() => {
      setIsFetchingSuggestions(true);

      fetchSearchSuggestions(query)
        .then((data) => {
          if (mounted) {
            setSuggestions(data.suggestions);
            setError(null);
          }
        })
        .catch((err) => {
          if (mounted) {
            setSuggestions([]);
            setError(
              isBrowserApiError(err) ? err.message : "Failed to fetch suggestions",
            );
          }
        })
        .finally(() => {
          if (mounted) setIsFetchingSuggestions(false);
        });
    }, SUGGESTION_DEBOUNCE_MS);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  const setQuery = (q: string) => {
    setQueryState(q);
    if (!q) {
      setResults([]);
      setSuggestions([]);
    }
  };

  const performSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const data = await searchPlots(query);
      setResults(data.results);
      // Backend auto-saves, so refresh history
      const history = await fetchRecentSearches();
      setRecentSearches(history);
    } catch (err) {
      setError(
        isBrowserApiError(err) ? err.message : "Search failed",
      );
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setQueryState("");
    setResults([]);
    setSuggestions([]);
    setError(null);
  };

  const saveSearch = async (q: string, type: "LOCATION" | "ZONE" | "PLOT" = "LOCATION") => {
    try {
      await saveRecentSearch(q, type);
      const history = await fetchRecentSearches();
      setRecentSearches(history);
    } catch (err) {
      console.error("Failed to save search:", err);
    }
  };

  const removeRecentSearch = async (id: string) => {
    try {
      await deleteRecentSearch(id);
      setRecentSearches((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(
        isBrowserApiError(err) ? err.message : "Failed to remove search",
      );
    }
  };

  const clearHistory = async () => {
    try {
      await clearRecentSearches();
      setRecentSearches([]);
    } catch (err) {
      setError(
        isBrowserApiError(err) ? err.message : "Failed to clear history",
      );
    }
  };

  const refreshHistory = () => {
    setIsLoadingHistory(true);
    fetchRecentSearches()
      .then((history) => {
        setRecentSearches(history);
        setError(null);
      })
      .catch((err) => {
        setError(
          isBrowserApiError(err) ? err.message : "Failed to refresh history",
        );
      })
      .finally(() => {
        setIsLoadingHistory(false);
      });
  };

  return {
    query,
    suggestions,
    results,
    recentSearches,
    isSearching,
    isFetchingSuggestions,
    isLoadingHistory,
    error,
    setQuery,
    performSearch,
    clearSearch,
    saveSearch,
    removeRecentSearch,
    clearHistory,
    refreshHistory,
  };
}
