import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform, Text } from 'react-native';
import { Search, X, Filter, SortAsc } from 'lucide-react-native';
import { supabase } from '../../lib/Superbase';
import Colors from '../../constant/Colors';

interface CourseSearchBarProps {
  onSearch: (results: any[]) => void;
  onFilterSortToggle?: (show: boolean) => void;
}

const CourseSearchBar = ({ onSearch, onFilterSortToggle }: CourseSearchBarProps) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState<string | null>(null);

  const statusOptions = [
    { label: 'All', value: null },
    { label: 'Published', value: 'published' },
    { label: 'Draft', value: 'draft' },
    { label: 'Archived', value: 'archived' },
  ];

  const sortOptions = [
    { label: 'Newest', value: 'date' },
    { label: 'Popular', value: 'popularity' },
    { label: 'Completion', value: 'completion' },
  ];

  const toggleFilterSort = (show: boolean) => {
    if (onFilterSortToggle) {
      onFilterSortToggle(show);
    }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    setIsSearching(!!text);
  };

  const handleSearch = async () => {
    if (query.trim() === '') {
      onSearch([]);
      setIsSearching(false);
      toggleFilterSort(false);
      return;
    }

    try {
      let queryBuilder = supabase
        .from('courses')
        .select('*')
        .ilike('title', `%${query}%`);

      // Apply status filter if selected
      if (selectedStatus) {
        queryBuilder = queryBuilder.eq('status', selectedStatus);
      }

      // Apply sorting if selected
      if (selectedSort) {
        if (selectedSort === 'date') {
          queryBuilder = queryBuilder.order('created_at', { ascending: false });
        } else if (selectedSort === 'popularity') {
          queryBuilder = queryBuilder.order('enrollment_count', { ascending: false });
        } else if (selectedSort === 'completion') {
          queryBuilder = queryBuilder.order('completion_rate', { ascending: false });
        }
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      onSearch(data || []);
    } catch (error) {
      console.error('Error searching courses:', error);
      onSearch([]);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setIsSearching(false);
    toggleFilterSort(false);
    onSearch([]);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleStatusSelection = (value: string | null) => {
    setSelectedStatus(value);
  };

  const handleSortSelection = (value: string | null) => {
    setSelectedSort(value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.PRIMARY} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search courses..."
            value={query}
            onChangeText={handleQueryChange}
            placeholderTextColor="#999"
            returnKeyType="search"
          />
          {isSearching && (
            <TouchableOpacity 
              onPress={clearSearch} 
              style={styles.clearButton}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <X size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={toggleFilters}
        >
          <Filter size={20} color={Colors.PRIMARY} />
        </TouchableOpacity>
        
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          {/* Status Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Status:</Text>
            <View style={styles.optionsRow}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value || 'all'}
                  style={[
                    styles.chip,
                    selectedStatus === option.value && styles.chipSelected
                  ]}
                  onPress={() => handleStatusSelection(option.value)}
                >
                  <Text 
                    style={[
                      styles.chipText,
                      selectedStatus === option.value && styles.chipTextSelected
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Sort By:</Text>
            <View style={styles.optionsRow}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.chip,
                    selectedSort === option.value && styles.chipSelected
                  ]}
                  onPress={() => handleSortSelection(option.value)}
                >
                  <Text 
                    style={[
                      styles.chipText,
                      selectedSort === option.value && styles.chipTextSelected
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity 
        style={styles.searchButton}
        onPress={handleSearch}
      >
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Colors.WHITE,
    padding: Platform.OS === 'ios' ? 16 : 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    flex: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 2,
    fontSize: 16,
    color: '#333',
    height: '100%',
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    backgroundColor: '#f5f7fa',
    marginLeft: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  sortButton: {
    backgroundColor: '#f5f7fa',
    marginLeft: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  filtersContainer: {
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  filterSection: {
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.PRIMARY,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  chipSelected: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  chipText: {
    fontSize: 12,
    color: '#333',
  },
  chipTextSelected: {
    color: Colors.WHITE,
    fontWeight: '500',
  },
  searchButton: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  searchButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CourseSearchBar;