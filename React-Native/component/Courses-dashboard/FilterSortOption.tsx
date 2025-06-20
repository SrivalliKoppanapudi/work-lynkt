import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Filter, SortAsc } from 'lucide-react-native';
import Colors from '../../constant/Colors';

interface FilterSortOptionProps {
  onFilterChange: (status: string | null) => void;
  onSortChange: (sortBy: string | null) => void;
  onApply: () => void;
}

const FilterSortOption = ({ onFilterChange, onSortChange, onApply }: FilterSortOptionProps) => {
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

  const handleStatusSelection = (value: string | null) => {
    setSelectedStatus(value);
  };

  const handleSortSelection = (value: string | null) => {
    setSelectedSort(value);
  };

  const handleApply = () => {
    onFilterChange(selectedStatus);
    onSortChange(selectedSort);
    onApply();
  };

  const handleReset = () => {
    setSelectedStatus(null);
    setSelectedSort(null);
  };

  return (
    <View style={styles.container}>
      {/* Status Filter Section */}
      <View style={styles.sectionHeader}>
        <Filter size={18} color={Colors.PRIMARY} style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>Filter by Status</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
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
      </ScrollView>

      {/* Sort Section */}
      <View style={styles.sectionHeader}>
        <SortAsc size={18} color={Colors.PRIMARY} style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>Sort By</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
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
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={handleReset}
        >
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.applyButton}
          onPress={handleApply}
        >
          <Text style={styles.applyButtonText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WHITE,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionIcon: {
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.PRIMARY,
  },
  optionsScroll: {
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  chip: {
    backgroundColor: '#f5f7fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    minWidth: 80,
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  chipTextSelected: {
    color: Colors.WHITE,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  applyButton: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: Colors.WHITE,
    fontWeight: 'bold',
  },
});

export default FilterSortOption;