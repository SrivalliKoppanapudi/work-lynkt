// components/CategorySelector.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { Tag } from 'lucide-react-native';

interface CategorySelectorProps {
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  categories: string[];
}

const CategorySelector = ({ selectedCategories, setSelectedCategories, categories }: CategorySelectorProps) => {
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  return (
    <View style={styles.inputGroup}>
      <View style={styles.inputHeader}>
        <Tag size={20} color="#4b5563" />
        <Text style={styles.label}>Categories</Text>
      </View>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        keyExtractor={(category) => category}
        renderItem={({ item: category }) => (
          <Pressable
            style={[styles.categoryChip, selectedCategories.includes(category) && styles.categoryChipSelected]}
            onPress={() => toggleCategory(category)}
          >
            <Text style={[styles.categoryChipText, selectedCategories.includes(category) && styles.categoryChipTextSelected]}>
              {category}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    gap: 8,
    marginBottom: 24,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4b5563',
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  categoryChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#3b82f6',
  },
  categoryChipText: {
    color: '#4b5563',
    fontSize: 14,
  },
  categoryChipTextSelected: {
    color: '#ffffff',
  },
});

export default CategorySelector;