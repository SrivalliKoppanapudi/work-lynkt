import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Searchbar, Menu, Button, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { EnrollmentFilters as FilterTypes, EnrollmentStatus } from '../../types/enrollment';
import Colors from '../../constant/Colors';

interface EnrollmentFiltersProps {
  filters: FilterTypes;
  onFilterChange: (filters: Partial<FilterTypes>) => void;
  onClearFilters: () => void;
}

const statusOptions = [
  { label: 'All Students', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Completed', value: 'completed' },
  { label: 'Dropped', value: 'dropped' },
];

const sortOptions = [
  { label: 'Name', value: 'name' },
  { label: 'Enrollment Date', value: 'enrollmentDate' },
  { label: 'Progress', value: 'progress' },
  { label: 'Last Active', value: 'lastActive' },
];

const EnrollmentFilters: React.FC<EnrollmentFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [orderMenuVisible, setOrderMenuVisible] = useState(false);

  const getStatusLabel = () => {
    const option = statusOptions.find(opt => opt.value === filters.status);
    return option ? option.label : 'All Students';
  };

  const getSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === filters.sortBy);
    return option ? option.label : 'Enrollment Date';
  };

  const getOrderLabel = () => {
    return filters.sortOrder === 'asc' ? 'Ascending' : 'Descending';
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search students..."
        onChangeText={(query) => onFilterChange({ searchQuery: query })}
        value={filters.searchQuery || ''}
        style={styles.searchBar}
        iconColor={Colors.PRIMARY}
      />
      
      <View style={styles.filtersRow}>
        <View style={styles.filterItem}>
          <Menu
            visible={statusMenuVisible}
            onDismiss={() => setStatusMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setStatusMenuVisible(true)}
                icon="filter-variant"
                style={styles.filterButton}
                labelStyle={styles.filterButtonLabel}
              >
                {getStatusLabel()}
              </Button>
            }
          >
            {statusOptions.map((option) => (
              <Menu.Item
                key={option.value}
                onPress={() => {
                  onFilterChange({ status: option.value as EnrollmentStatus | 'all' });
                  setStatusMenuVisible(false);
                }}
                title={option.label}
              />
            ))}
          </Menu>
        </View>

        <View style={styles.filterItem}>
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setSortMenuVisible(true)}
                icon="sort"
                style={styles.filterButton}
                labelStyle={styles.filterButtonLabel}
              >
                {getSortLabel()}
              </Button>
            }
          >
            {sortOptions.map((option) => (
              <Menu.Item
                key={option.value}
                onPress={() => {
                  onFilterChange({ sortBy: option.value as 'name' | 'enrollmentDate' | 'progress' | 'lastActive' });
                  setSortMenuVisible(false);
                }}
                title={option.label}
              />
            ))}
          </Menu>
        </View>

        <View style={styles.filterItem}>
          <Menu
            visible={orderMenuVisible}
            onDismiss={() => setOrderMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setOrderMenuVisible(true)}
                icon={filters.sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                style={styles.filterButton}
                labelStyle={styles.filterButtonLabel}
              >
                {getOrderLabel()}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                onFilterChange({ sortOrder: 'asc' });
                setOrderMenuVisible(false);
              }}
              title="Ascending"
            />
            <Menu.Item
              onPress={() => {
                onFilterChange({ sortOrder: 'desc' });
                setOrderMenuVisible(false);
              }}
              title="Descending"
            />
          </Menu>
        </View>

        <TouchableOpacity
          style={styles.clearButton}
          onPress={onClearFilters}
        >
          <MaterialIcons name="clear" size={20} color={Colors.ERROR} />
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  searchBar: {
    marginBottom: 10,
    backgroundColor: Colors.WHITE,
    elevation: 2,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterItem: {
    marginRight: 8,
    marginBottom: 8,
  },
  filterButton: {
    borderColor: Colors.PRIMARY,
    borderWidth: 1,
    height: 36,
  },
  filterButtonLabel: {
    fontSize: 12,
    marginVertical: 0,
    color: Colors.PRIMARY,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  clearButtonText: {
    color: Colors.ERROR,
    marginLeft: 4,
    fontSize: 12,
  },
});

export default EnrollmentFilters;