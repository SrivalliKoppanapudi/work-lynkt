import React, { useRef, useCallback, useState } from 'react';
import { StyleSheet, View, Platform, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { Bold, Italic, List, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react-native';

interface RichTextEditorProps {
  initialContent: string;
  onContentChange: (content: string) => void;
}

const RichTextEditorComponent: React.FC<RichTextEditorProps> = ({ 
  initialContent, 
  onContentChange 
}) => {
  const editorRef = useRef<RichEditor>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isBulletList, setIsBulletList] = useState(false);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left');
  const [text, setText] = useState(initialContent || '');
  
  // Handle content change
  const handleChange = useCallback((newText: string) => {
    setText(newText);
    onContentChange(newText);
  }, [onContentChange]);

  // Format text for Android
  const formatText = (type: 'bold' | 'italic' | 'underline' | 'bullet' | 'align') => {
    let currentText = text;
    let formattedText = '';

    switch (type) {
      case 'bold':
        setIsBold(!isBold);
        formattedText = isBold ? 
          currentText.replace(/\*\*(.*?)\*\*/g, '$1') : 
          `**${currentText}**`;
        break;
      case 'italic':
        setIsItalic(!isItalic);
        formattedText = isItalic ? 
          currentText.replace(/\*(.*?)\*/g, '$1') : 
          `*${currentText}*`;
        break;
      case 'underline':
        setIsUnderline(!isUnderline);
        formattedText = isUnderline ? 
          currentText.replace(/__(.*?)__/g, '$1') : 
          `__${currentText}__`;
        break;
      case 'bullet':
        setIsBulletList(!isBulletList);
        formattedText = isBulletList ? 
          currentText.replace(/^\s*[-•]\s*/gm, '') : 
          currentText.split('\n').map(line => `• ${line}`).join('\n');
        break;
      case 'align':
        const alignments = ['left', 'center', 'right'];
        const currentIndex = alignments.indexOf(alignment);
        const nextIndex = (currentIndex + 1) % alignments.length;
        const newAlignment = alignments[nextIndex] as 'left' | 'center' | 'right';
        setAlignment(newAlignment);
        formattedText = currentText;
        break;
    }

    handleChange(formattedText);
  };

  // For Android, we'll use a custom toolbar with formatting options
  if (Platform.OS === 'android') {
    return (
      <View style={styles.container}>
        <View style={styles.toolbar}>
          <View style={styles.toolbarRow}>
            <TouchableOpacity 
              style={[styles.toolbarButton, isBold && styles.toolbarButtonActive]}
              onPress={() => formatText('bold')}
            >
              <Bold size={14} color={isBold ? '#2563eb' : '#4b5563'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toolbarButton, isItalic && styles.toolbarButtonActive]}
              onPress={() => formatText('italic')}
            >
              <Italic size={14} color={isItalic ? '#2563eb' : '#4b5563'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toolbarButton, isUnderline && styles.toolbarButtonActive]}
              onPress={() => formatText('underline')}
            >
              <Underline size={14} color={isUnderline ? '#2563eb' : '#4b5563'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toolbarButton, isBulletList && styles.toolbarButtonActive]}
              onPress={() => formatText('bullet')}
            >
              <List size={14} color={isBulletList ? '#2563eb' : '#4b5563'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toolbarButton, alignment === 'left' && styles.toolbarButtonActive]}
              onPress={() => formatText('align')}
            >
              <AlignLeft size={14} color={alignment === 'left' ? '#2563eb' : '#4b5563'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toolbarButton, alignment === 'center' && styles.toolbarButtonActive]}
              onPress={() => formatText('align')}
            >
              <AlignCenter size={14} color={alignment === 'center' ? '#2563eb' : '#4b5563'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toolbarButton, alignment === 'right' && styles.toolbarButtonActive]}
              onPress={() => formatText('align')}
            >
              <AlignRight size={14} color={alignment === 'right' ? '#2563eb' : '#4b5563'} />
            </TouchableOpacity>
          </View>
        </View>
        <TextInput
          style={[
            styles.androidInput,
            { textAlign: alignment }
          ]}
          multiline
          value={text}
          onChangeText={handleChange}
          placeholder="Enter course description"
          textAlignVertical="top"
        />
      </View>
    );
  }

  // iOS implementation with full rich text editor
  return (
    <View style={styles.container}>
      <RichToolbar
        style={styles.richToolbar}
        editor={editorRef}
        selectedIconTint="#2563eb"
        iconTint="#4b5563"
        iconSize={14}
        actions={[
          actions.setBold,
          actions.setItalic,
          actions.setUnderline,
          actions.insertBulletsList,
          actions.alignLeft,
          actions.alignCenter,
          actions.alignRight,
        ]}
      />
      <ScrollView>
        <RichEditor
          ref={editorRef}
          style={styles.richEditor}
          onChange={handleChange}
          initialContentHTML={text}
          placeholder="Enter course description"
          initialHeight={100}
          useContainer={true}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          mixedContentMode="always"
          scrollEnabled={true}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 4,
  },
  richToolbar: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    height: 28,
  },
  richEditor: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#e5e7eb',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    minHeight: 100,
    paddingHorizontal: 8,
  },
  toolbar: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 2,
    height: 28,
  },
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    height: '100%',
  },
  toolbarButton: {
    padding: 2,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
  toolbarButtonActive: {
    backgroundColor: '#dbeafe',
  },
  androidInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 6,
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
    fontSize: 14,
  }
});

export default React.memo(RichTextEditorComponent);