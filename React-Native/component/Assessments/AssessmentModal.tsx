import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, SafeAreaView, Modal, StyleSheet, TouchableOpacity, Alert, Switch, TextInput } from 'react-native';
import { CheckSquare, Edit, Plus, Trash2, Calendar, Clock, Eye, Save, BookOpen } from 'lucide-react-native';
import { Assessment, Question, Module } from '../../types/courses';
import InputComponent from '../InputComponent';
import ButtonComponent from '../ButtonComponent';
import BetterPicker from '../courses/BetterPicker';

interface Option {
  id: number;
  text: string;
  isCorrect: boolean;
}

interface QuestionFormProps {
  question: Question;
  onUpdate: (updatedQuestion: Question) => void;
  onDelete: () => void;
}

interface PreviewModalProps {
  visible: boolean;
  onClose: () => void;
  assessment: Assessment;
}

interface AssessmentModalProps {
  showAssessmentModal: boolean;
  setShowAssessmentModal: (show: boolean) => void;
  currentAssessment: Assessment | null;
  setCurrentAssessment: (assessment: Assessment | null) => void;
  assessments: Assessment[];
  setAssessments: (assessments: Assessment[]) => void;
  modules?: Module[];
}

// Question Form Component
const QuestionForm = ({ question, onUpdate, onDelete }: QuestionFormProps) => {
  const [questionText, setQuestionText] = useState(question.text);
  const [questionType, setQuestionType] = useState(question.type);
  const [options, setOptions] = useState<string[]>(question.options || []);
  const [correctAnswer, setCorrectAnswer] = useState<string | number>(question.correctAnswer || '');
  const [points, setPoints] = useState(question.points.toString());

  const questionTypes = [
    { label: 'Multiple Choice', value: 'multiple_choice' },
    { label: 'True/False', value: 'true_false' },
    { label: 'Essay', value: 'essay' }
  ];

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleOptionChange = (text: string, index: number) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleSave = () => {
    const updatedQuestion: Question = {
      ...question,
      text: questionText,
      type: questionType as 'multiple_choice' | 'true_false' | 'essay',
      options: questionType === 'essay' ? undefined : options,
      correctAnswer: questionType === 'essay' ? undefined : correctAnswer,
      points: parseInt(points) || 0
    };
    onUpdate(updatedQuestion);
  };

  useEffect(() => {
    // Initialize true/false options
    if (questionType === 'true_false' && (!options.length || options.length !== 2)) {
      setOptions(['True', 'False']);
    }
  }, [questionType]);

  return (
    <View style={styles.questionForm}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionHeaderText}>Question</Text>
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Trash2 size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <InputComponent
        label="Question Text"
        value={questionText}
        onChangeText={setQuestionText}
        multiline
      />

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Question Type</Text>
        <BetterPicker
          value={questionType}
          onValueChange={(value: string) => setQuestionType(value as 'multiple_choice' | 'true_false' | 'essay')}
          items={questionTypes}
        />
      </View>

      {(questionType === 'multiple_choice' || questionType === 'true_false') && (
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsLabel}>Options</Text>
          {options.map((option, index) => (
            <View key={index} style={styles.optionRow}>
              <TouchableOpacity
                style={[styles.radioButton, correctAnswer === index.toString() && styles.radioButtonSelected]}
                onPress={() => setCorrectAnswer(index.toString())}
              >
                {correctAnswer === index.toString() && <View style={styles.radioButtonInner} />}
              </TouchableOpacity>
              <InputComponent
                label={`Option ${index + 1}`}
                value={option}
                onChangeText={(text) => handleOptionChange(text, index)}
                style={styles.optionInput}
              />
              {questionType !== 'true_false' && (
                <TouchableOpacity onPress={() => handleRemoveOption(index)} style={styles.removeOptionButton}>
                  <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {questionType === 'multiple_choice' && (
            <ButtonComponent
              title="Add Option"
              onPress={handleAddOption}
              style={styles.addOptionButton}
            />
          )}
        </View>
      )}

      <InputComponent
        label="Points"
        value={points}
        onChangeText={setPoints}
        keyboardType="numeric"
      />

      <ButtonComponent
        title="Save Question"
        onPress={handleSave}
        style={styles.saveQuestionButton}
      />
    </View>
  );
};

// Preview Modal Component
const PreviewModal = ({ visible, onClose, assessment }: PreviewModalProps) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.previewModal}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>Assessment Preview</Text>
          <Pressable onPress={onClose} style={styles.closePreviewButton}>
            <Text style={styles.closePreviewText}>Close</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.previewContent}>
          <View style={styles.previewAssessment}>
            <Text style={styles.previewAssessmentTitle}>{assessment.title}</Text>
            <Text style={styles.previewAssessmentDescription}>{assessment.description}</Text>
            
            {assessment.dueDate && (
              <View style={styles.previewDueDate}>
                <Calendar size={16} color="#6b7280" />
                <Text style={styles.previewDueDateText}>
                  Due: {new Date(assessment.dueDate).toLocaleDateString()} at {new Date(assessment.dueDate).toLocaleTimeString()}
                </Text>
              </View>
            )}
            
            <Text style={styles.previewTotalPoints}>Total Points: {assessment.totalPoints}</Text>
            
            {assessment.questions && assessment.questions.length > 0 ? (
              <View style={styles.previewQuestions}>
                <Text style={styles.previewQuestionsTitle}>Questions</Text>
                {assessment.questions.map((question, index) => (
                  <View key={question.id} style={styles.previewQuestion}>
                    <Text style={styles.previewQuestionNumber}>Question {index + 1}</Text>
                    <Text style={styles.previewQuestionText}>{question.text}</Text>
                    
                    {question.type !== 'essay' && question.options && (
                      <View style={styles.previewOptions}>
                        {question.options.map((option, optIndex) => (
                          <View key={optIndex} style={styles.previewOption}>
                            <View style={styles.previewOptionBullet} />
                            <Text style={styles.previewOptionText}>{option}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    <Text style={styles.previewQuestionPoints}>({question.points} points)</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.previewNoQuestions}>No questions added yet.</Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const AssessmentModal = ({
  showAssessmentModal,
  setShowAssessmentModal,
  currentAssessment,
  setCurrentAssessment,
  assessments,
  setAssessments,
  modules = [],
}: AssessmentModalProps) => {
  if (!currentAssessment) return null;

  const [title, setTitle] = useState(currentAssessment.title);
  const [description, setDescription] = useState(currentAssessment.description);
  const [type, setType] = useState(currentAssessment.type);
  const [questions, setQuestions] = useState<Question[]>(currentAssessment.questions || []);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(currentAssessment.dueDate);
  const [totalPoints, setTotalPoints] = useState(currentAssessment.totalPoints.toString());
  const [selectedModule, setSelectedModule] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [autoGrading, setAutoGrading] = useState(true);
  const [feedbackOption, setFeedbackOption] = useState('immediate'); // immediate, delayed, none
  const [isPublished, setIsPublished] = useState(false);

  const assessmentTypes = [
    { label: 'Quiz', value: 'quiz' },
    { label: 'Assignment', value: 'assignment' },
    { label:'Survey', value:'survey'},
  ];

  const moduleOptions = modules.map(module => ({
    label: module.title,
    value: module.id
  }));

  const feedbackOptions = [
    { label: 'Immediate Feedback', value: 'immediate' },
    { label: 'After Due Date', value: 'delayed' },
    { label: 'No Feedback', value: 'none' }
  ];

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: Date.now(),
      text: '',
      type: 'multiple_choice',
      options: ['', ''],
      correctAnswer: '0',
      points: 1
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (updatedQuestion: Question) => {
    setQuestions(questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
  };

  const handleDeleteQuestion = (id: number) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const calculateTotalPoints = () => {
    return questions.reduce((sum, question) => sum + question.points, 0);
  };

  useEffect(() => {
    // Update total points when questions change
    setTotalPoints(calculateTotalPoints().toString());
  }, [questions]);

  const handleSaveAssessment = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Assessment title is required');
      return;
    }

    const updatedAssessment: Assessment = {
      ...currentAssessment,
      title,
      description,
      type,
      questions,
      dueDate,
      totalPoints: parseInt(totalPoints) || calculateTotalPoints(),
    };

    setAssessments(assessments.map(assessment =>
      assessment.id === currentAssessment.id ? updatedAssessment : assessment
    ));
    setShowAssessmentModal(false);
    setCurrentAssessment(null);
  };

  const handlePublishAssessment = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Assessment title is required');
      return;
    }

    if (questions.length === 0) {
      Alert.alert('Error', 'At least one question is required');
      return;
    }

    setIsPublished(true);
    handleSaveAssessment();
  };

  return (
    <>
      <Modal
        visible={showAssessmentModal}
        animationType="slide"
        onRequestClose={() => setShowAssessmentModal(false)}
      >
        <SafeAreaView style={styles.assessmentModal}>
          <View style={styles.assessmentHeader}>
            <Text style={styles.assessmentTitle}>Create Assessment</Text>
            <Pressable
              onPress={() => setShowAssessmentModal(false)}
              style={styles.closeAssessmentButton}
            >
              <Text style={styles.closeAssessmentText}>Close</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.assessmentContent}>
            {/* Assessment Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Assessment Details</Text>
              
              <InputComponent
                label="Assessment Title"
                value={title}
                onChangeText={setTitle}
                placeholder="Enter assessment title"
              />
              
              <InputComponent
                label="Description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholder="Enter assessment description"
              />
              
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Assessment Type</Text>
                <BetterPicker
                  value={type}
                  onValueChange={(value: string) => setType(value as 'quiz' | 'assignment' )}
                  items={assessmentTypes}
                />
              </View>
              
              {/* Due Date Selection */}
              <View style={styles.dueDateContainer}>
                <Text style={styles.pickerLabel}>Due Date</Text>
                <Pressable 
                  style={styles.dueDateButton} 
                  onPress={() => setShowDatePicker(true)}
                >
                  <Calendar size={18} color="#6b7280" />
                  <Text style={styles.dueDateText}>
                    {dueDate ? new Date(dueDate).toLocaleDateString() + ' at ' + new Date(dueDate).toLocaleTimeString() : 'Set due date'}
                  </Text>
                </Pressable>
                {showDatePicker && (
                  <View style={styles.datePickerContainer}>
                    <View style={styles.datePickerHeader}>
                      <Text style={styles.datePickerTitle}>Select Due Date</Text>
                      <Pressable onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.datePickerCloseText}>Done</Text>
                      </Pressable>
                    </View>
                    <View style={styles.datePicker}>
                      <View style={styles.datePickerContent}>
                        <TouchableOpacity
                          style={styles.datePickerButton}
                          onPress={() => {
                            const now = new Date();
                            setDueDate(now);
                            setShowDatePicker(false);
                          }}
                        >
                          <Text style={styles.datePickerButtonText}>Today</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.datePickerButton}
                          onPress={() => {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            setDueDate(tomorrow);
                            setShowDatePicker(false);
                          }}
                        >
                          <Text style={styles.datePickerButtonText}>Tomorrow</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.datePickerButton}
                          onPress={() => {
                            const nextWeek = new Date();
                            nextWeek.setDate(nextWeek.getDate() + 7);
                            setDueDate(nextWeek);
                            setShowDatePicker(false);
                          }}
                        >
                          <Text style={styles.datePickerButtonText}>Next Week</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.datePickerButton}
                          onPress={() => {
                            setDueDate(undefined);
                            setShowDatePicker(false);
                          }}
                        >
                          <Text style={styles.datePickerButtonText}>No Due Date</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
              
              {/* Module Assignment */}
              {moduleOptions.length > 0 && (
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Assign to Module</Text>
                  <BetterPicker
                    value={selectedModule}
                    onValueChange={setSelectedModule}
                    items={moduleOptions}
                    placeholder="Select a module"
                  />
                </View>
              )}
              
              {/* Total Points */}
              <InputComponent
                label="Total Points"
                value={totalPoints}
                onChangeText={setTotalPoints}
                keyboardType="numeric"
              />
            </View>
            
            {/* Grading Options Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Grading Options</Text>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Auto-grading for objective questions</Text>
                <Switch
                  value={autoGrading}
                  onValueChange={setAutoGrading}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor={autoGrading ? '#ffffff' : '#f4f3f4'}
                />
              </View>
              
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Feedback Options</Text>
                <BetterPicker
                  value={feedbackOption}
                  onValueChange={setFeedbackOption}
                  items={feedbackOptions}
                />
              </View>
            </View>
            
            {/* Questions Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Questions</Text>
                <TouchableOpacity 
                  style={styles.addQuestionButton}
                  onPress={handleAddQuestion}
                >
                  <Plus size={18} color="#ffffff" />
                  <Text style={styles.addQuestionButtonText}>Add Question</Text>
                </TouchableOpacity>
              </View>
              
              {questions.length > 0 ? (
                questions.map((question) => (
                  <QuestionForm
                    key={question.id}
                    question={question}
                    onUpdate={handleUpdateQuestion}
                    onDelete={() => handleDeleteQuestion(question.id)}
                  />
                ))
              ) : (
                <View style={styles.noQuestionsContainer}>
                  <Text style={styles.noQuestionsText}>No questions added yet. Click "Add Question" to create your first question.</Text>
                </View>
              )}
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.previewButton}
                onPress={() => setShowPreview(true)}
              >
                <Eye size={18} color="#6b7280" />
                <Text style={styles.previewButtonText}>Preview</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveAssessment}
              >
                <Save size={18} color="#ffffff" />
                <Text style={styles.saveButtonText}>Save Draft</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.publishButton}
                onPress={handlePublishAssessment}
              >
                <BookOpen size={18} color="#ffffff" />
                <Text style={styles.publishButtonText}>Publish</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      
      {/* Preview Modal */}
      <PreviewModal
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        assessment={{
          ...currentAssessment,
          title,
          description,
          type,
          questions,
          dueDate,
          totalPoints: parseInt(totalPoints) || calculateTotalPoints(),
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  assessmentModal: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  assessmentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeAssessmentButton: {
    padding: 8,
  },
  closeAssessmentText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '500',
  },
  assessmentContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  dueDateContainer: {
    marginBottom: 16,
  },
  dueDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  dueDateText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#1f2937',
  },
  datePickerContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  datePickerCloseText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '500',
  },
  datePicker: {
    padding: 12,
  },
  datePickerContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  datePickerButton: {
    width: '48%',
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow:'hidden'
  },
  switchLabel: {
    fontSize: 14,
    color: '#1f2937',
  },
  addQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    padding: 8,
    borderRadius: 8,
  },
  addQuestionButtonText: {
    color: '#ffffff',
    marginLeft: 4,
    fontWeight: '500',
  },
  noQuestionsContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
  },
  noQuestionsText: {
    color: '#6b7280',
    textAlign: 'center',
  },
  questionForm: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  deleteButton: {
    padding: 8,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionsLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#3b82f6',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
  optionInput: {
    flex: 1,
  },
  removeOptionButton: {
    padding: 8,
    marginLeft: 8,
  },
  addOptionButton: {
    marginTop: 8,
    backgroundColor: '#f3f4f6',
  },
  saveQuestionButton: {
    marginTop: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  previewButtonText: {
    color: '#1f2937',
    marginLeft: 4,
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    marginLeft: 4,
    fontWeight: '500',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  publishButtonText: {
    color: '#ffffff',
    marginLeft: 4,
    fontWeight: '500',
  },
  previewModal: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closePreviewButton: {
    padding: 8,
  },
  closePreviewText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '500',
  },
  previewContent: {
    padding: 16,
  },
  previewAssessment: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
  },
  previewAssessmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  previewAssessmentDescription: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 16,
  },
  previewDueDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewDueDateText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  previewTotalPoints: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 16,
  },
  previewQuestions: {
    marginTop: 16,
  },
  previewQuestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  previewQuestion: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  previewQuestionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  previewQuestionText: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 12,
  },
  previewOptions: {
    marginLeft: 16,
    marginBottom: 12,
  },
  previewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewOptionBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6b7280',
    marginRight: 8,
  },
  previewOptionText: {
    fontSize: 14,
    color: '#4b5563',
  },
  previewQuestionPoints: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6b7280',
    textAlign: 'right',
  },
  previewNoQuestions: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    padding: 16,
  },
});

export default AssessmentModal;