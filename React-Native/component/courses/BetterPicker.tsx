// components/BetterPicker.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, Platform } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

interface BetterPickerProps {
  value: string;
  onValueChange: (value: string) => void;
  items: { label: string; value: string }[];
  placeholder?: string;
}

const BetterPicker = ({ value, onValueChange, items, placeholder = "Select an option" }: BetterPickerProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const selectedItem = items.find(item => item.value === value) || { label: placeholder, value: '' };

  const togglePicker = () => setShowPicker(!showPicker);
  const handleSelect = (item: { label: string; value: string }) => {
    onValueChange(item.value);
    setShowPicker(false);
  };

  const renderDropdown = () => {
    if (!showPicker) return null;
    
    // Use Modal for both Android and iOS for consistent behavior
    return (
      <Modal transparent={true} visible={showPicker} onRequestClose={() => setShowPicker(false)}>
        <TouchableOpacity 
          style={styles.pickerModalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.pickerModalContent}>
            <ScrollView>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.betterPickerItem, value === item.value && styles.betterPickerItemSelected]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={[styles.betterPickerItemText, value === item.value && styles.betterPickerItemTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View style={styles.betterPickerContainer}>
      <TouchableOpacity 
        onPress={togglePicker} 
        style={styles.betterPickerButton}
      >
        <Text style={styles.betterPickerText}>{selectedItem.label}</Text>
        <ChevronDown size={20} color="#6b7280" />
      </TouchableOpacity>
      
      {renderDropdown()}
    </View>
  );
};

const styles = StyleSheet.create({
  betterPickerContainer: {
    position: 'relative',
    zIndex: Platform.OS === 'ios' ? 10 : 1,
    marginBottom: 8,
  },
  betterPickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
  },
  betterPickerText: {
    fontSize: 16,
    color: '#1f2937',
  },
  betterPickerDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: Platform.OS === 'ios' ? 20 : 1,
  },
  betterPickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  betterPickerItemSelected: {
    backgroundColor: '#f3f4f6',
  },
  betterPickerItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
  betterPickerItemTextSelected: {
    fontWeight: '500',
    color: '#3b82f6',
  },
  pickerModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerModalContent: {
    width: '80%',
    maxHeight: 300,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default BetterPicker;