import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';


const frames = [
  {
    title: 'Learning Impact',
    questions: [
      'My students demonstrate the ability to apply what I\'ve taught them',
      'My students demonstrate learning in various contexts',
      'I consistently check learning through verbal/non-verbal signals',
      'I spend time with struggling students',
      'Students speak 50% of class time'
    ]
  },
  {
    title: 'Engagement with my learners',
    questions: [
      'Students love my classes',
      'I care for students beyond academics',
      'I am always respectful',
      'Make classes creative and interesting',
      'Use all students\' names'
    ]
  },
  {
    title: 'Attitudes to accelerate effectiveness',
    questions: [
      'Create no-fear classroom',
      'Smile and provide encouragement',
      'Enjoy teaching beyond job',
      'Treat all students equally',
      'Consistent attendance and punctuality'
    ]
  },
  {
    title: 'Personal Growth, Planning and Preparation',
    questions: [
      'Invest 1hr/week in personal learning',
      'Prepare meaningful lesson plans',
      'Plan and update classes regularly',
      'Take constructive feedback',
      'Collaborate with colleagues'
    ]
  }
];

const scoring = {
  'Always': 10,
  'Almost Always': 8,
  'Frequently': 5,
  'Occasionally': 3,
  'Rarely': 1,
  'Never': 0
};


interface DiagnosticResultsCardProps {
  expanded: boolean;
  onToggle: () => void;
}

const DiagnosticResultsCard: React.FC<DiagnosticResultsCardProps> = ({ expanded, onToggle }) => {
  return (
    <View>
      <TouchableOpacity onPress={onToggle}>
        <Text>{expanded ? 'Collapse' : 'Expand'}</Text>
      </TouchableOpacity>
      {expanded && <Text>Diagnostic Results Content</Text>}
    </View>
  );
};

const DiagnosticTool = () => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [answers, setAnswers] = useState(Array(20).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [showIntroduction, setShowIntroduction] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load saved state on mount
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        // Check if this is a new user who just signed up
        const isNewUser = await AsyncStorage.getItem('@new_user');
        
        // Get any saved diagnostic results
        const savedData = await AsyncStorage.getItem('@diagnostic_results');
        
        if (isNewUser === 'true') {
          // For new users, show the introduction and test, not results
          setShowIntroduction(true);
          setShowResults(false);
          // Clear the new user flag so they're not treated as new on next visit
          await AsyncStorage.removeItem('@new_user');
        } else if (savedData) {
          // For returning users with saved data, load their previous results
          const { answers: savedAnswers, completed } = JSON.parse(savedData);
          setAnswers(savedAnswers);
          setHasCompleted(completed);
          if (completed) {
            setShowIntroduction(false);
            setShowResults(true);
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load saved data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedState();
  }, []);

  const handleAnswer = (questionIndex, value) => {
    const newAnswers = [...answers];
    newAnswers[currentFrame * 5 + questionIndex] = value;
    setAnswers(newAnswers);
  };

  const calculateScores = () => {
    const frameScores = frames.map((_, i) => 
      answers.slice(i*5, (i+1)*5).reduce((acc, val) => 
        acc + (val ? scoring[val] : 0), 0)
    );
    const total = frameScores.reduce((a, b) => a + b, 0);
    return { frameScores, total };
  };

  const getRating = (total) => {
    if (total < 50) return 'Novice';
    if (total < 100) return 'Improving';
    if (total < 130) return 'Developing';
    if (total < 170) return 'Proficient';
    return 'Star';
  };

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'Star': return { backgroundColor: '#bbf7d0', color: '#166534' };
      case 'Proficient': return { backgroundColor: '#bfdbfe', color: '#1e40af' };
      case 'Developing': return { backgroundColor: '#fef08a', color: '#854d0e' };
      case 'Improving': return { backgroundColor: '#fed7aa', color: '#9a3412' };
      default: return { backgroundColor: '#fecaca', color: '#991b1b' };
    }
  };

  const handleSubmit = async () => {
    try {
      await AsyncStorage.setItem('@diagnostic_results', 
        JSON.stringify({
          answers,
          completed: true
        })
      );
      setHasCompleted(true);
      setShowResults(false);
      
      // Show popup message and navigate to home
      Alert.alert(
        "Diagnostic Complete",
        "Thank you for completing the diagnostic. You can view your results in the Course Analytics section.",
        [
          { 
            text: "OK", 
            onPress: () => router.push('/(screens)/Home')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save results');
      console.error(error);
    }
  };

  const handleRetakeTest = async () => {
    try {
      await AsyncStorage.removeItem('@diagnostic_results');
      setAnswers(Array(20).fill(null));
      setHasCompleted(false);
      setShowResults(false);
      setShowIntroduction(true);
      setCurrentFrame(0);
    } catch (error) {
      Alert.alert('Error', 'Failed to reset test');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e40af" />
      </SafeAreaView>
    );
  }

  if (showIntroduction) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.introContainer}>
          <View style={styles.introContent}>
            <Text style={styles.introTitle}>Welcome to the Teacher Self-Diagnostic Tool</Text>
            
            <View style={styles.introTextContainer}>
              <Text style={styles.introText}>
                This self-assessment tool is designed to help you reflect on your teaching practice 
                through the LEAP framework. By identifying your strengths and areas for growth, 
                you can continue to develop as an educator in our rapidly changing educational landscape.
              </Text>

              <Text style={styles.sectionTitle}>What to expect:</Text>
              <View style={styles.listContainer}>
                <Text style={styles.listItem}>• A 20-question assessment across 4 key dimensions of teaching</Text>
                <Text style={styles.listItem}>• Immediate feedback with visual progress indicators</Text>
                <Text style={styles.listItem}>• Personalized rating and actionable insights</Text>
                <Text style={styles.listItem}>• Completely confidential - your results are for your eyes only</Text>
              </View>

              <Text style={styles.sectionTitle}>How it works:</Text>
              <View style={styles.listContainer}>
                <Text style={styles.listItem}>1. Answer each question honestly based on your current practice</Text>
                <Text style={styles.listItem}>2. Progress through 4 sections (about 5 minutes total)</Text>
                <Text style={styles.listItem}>3. Receive your personalized results instantly</Text>
                <Text style={styles.listItem}>4. Use insights to guide your professional development</Text>
              </View>

              <View style={styles.noteBox}>
                <Text style={styles.noteTitle}>Remember:</Text>
                <Text style={styles.noteText}>
                  This is not a test, but a mirror for reflection. There are no wrong answers - 
                  only opportunities for growth. Be as objective as possible, and consider 
                  asking a trusted colleague to review your results with you.
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  if (hasCompleted) {
                    setShowIntroduction(false);
                    setShowResults(true);
                  } else {
                    setShowIntroduction(false);
                  }
                }}
                style={styles.startButton}
              >
                <Text style={styles.startButtonText}>
                  {hasCompleted ? 'View My Results' : 'Start Your Self-Assessment →'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (showResults) {
    const { frameScores, total } = calculateScores();
    const rating = getRating(total);
    const ratingStyle = getRatingColor(rating);
    
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.resultsContainer}>
        <View style={styles.resultsCard}>
          <Text style={styles.resultsTitle}>Diagnostic Results</Text>
            <Text style={styles.overallScore}>
              Overall Score: {total}/200
              <Text style={[styles.ratingBadge, ratingStyle]}> {rating}</Text>
            </Text>
            
            <View style={styles.scoreGrid}>
              {frameScores.map((score, i) => (
                <View key={i} style={styles.scoreCard}>
                  <Text style={styles.scoreTitle}>{frames[i].title}</Text>
                  <View style={styles.progressBarBackground}>
                    <View 
                      style={[styles.progressBarFill, { width: `${(score/50)*100}%` }]}
                    ></View>
                  </View>
                  <Text style={styles.scoreText}>{score}/50</Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={handleRetakeTest}
              style={styles.retakeButton}
            >
              <Text style={styles.retakeButtonText}>Retake Test</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Teacher Self-Diagnostic</Text>
        
        <View style={styles.card}>
          <Text style={styles.frameTitle}>{frames[currentFrame].title}</Text>
          
          <View style={styles.questionsContainer}>
            {frames[currentFrame].questions.map((question, qIndex) => (
              <View key={qIndex} style={styles.questionItem}>
                <Text style={styles.questionText}>{question}</Text>
                <View style={styles.optionsGrid}>
                  {Object.keys(scoring).map((option) => (
                    <Pressable
                      key={option}
                      style={[
                        styles.optionButton,
                        answers[currentFrame*5 + qIndex] === option 
                          ? styles.optionSelected 
                          : styles.optionDefault
                      ]}
                      onPress={() => handleAnswer(qIndex, option)}
                    >
                      <Text style={styles.optionText}>{option}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.navigation}>
            <Pressable
              onPress={() => setCurrentFrame(Math.max(0, currentFrame - 1))}
              disabled={currentFrame === 0}
              style={[styles.navButton, currentFrame === 0 && styles.navButtonDisabled]}
            >
              <Text style={styles.navButtonText}>Previous</Text>
            </Pressable>
            
            {currentFrame < frames.length - 1 ? (
              <Pressable
                onPress={() => setCurrentFrame(currentFrame + 1)}
                disabled={answers.slice(currentFrame*5, (currentFrame+1)*5).includes(null)}
                style={[
                  styles.navButton,
                  styles.nextButton,
                  answers.slice(currentFrame*5, (currentFrame+1)*5).includes(null) && 
                    styles.navButtonDisabled
                ]}
              >
                <Text style={[styles.navButtonText, styles.nextButtonText]}>Next</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleSubmit}
                disabled={answers.slice(currentFrame*5).includes(null)}
                style={[
                  styles.navButton,
                  styles.submitButton,
                  answers.slice(currentFrame*5).includes(null) && 
                    styles.navButtonDisabled
                ]}
              >
                <Text style={[styles.navButtonText, styles.submitButtonText]}>Submit</Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    padding: 16,
    paddingBottom: 32
  },
  introContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32
  },
  introContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 24,
    textAlign: 'center'
  },
  introTextContainer: {
    gap: 16
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#111827'
  },
  listContainer: {
    gap: 8,
    paddingLeft: 8
  },
  listItem: {
    fontSize: 16,
    lineHeight: 22,
    color: '#374151'
  },
  noteBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16
  },
  noteTitle: {
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8
  },
  noteText: {
    color: '#374151',
    lineHeight: 22
  },
  startButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 32
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 16
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  frameTitle: {
    fontSize: 24,
    color: '#16a34a',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center'
  },
  questionsContainer: {
    gap: 24
  },
  questionItem: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  questionText: {
    fontWeight: '500',
    marginBottom: 12,
    fontSize: 16,
    color: '#111827'
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1
  },
  optionDefault: {
    backgroundColor: 'white',
    borderColor: '#e5e7eb'
  },
  optionSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6'
  },
  optionText: {
    fontSize: 14
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4
  },
  navButtonDisabled: {
    backgroundColor: '#e5e7eb',
    opacity: 0.7
  },
  nextButton: {
    backgroundColor: '#2563eb'
  },
  submitButton: {
    backgroundColor: '#16a34a'
  },
  navButtonText: {
    color: '#111827',
    fontWeight: '500'
  },
  nextButtonText: {
    color: 'white'
  },
  submitButtonText: {
    color: 'white'
  },
  resultsContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 16
  },
  resultsCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
    marginHorizontal: -25,
  },
  overallScore: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827'
  },
  ratingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8
  },
  scoreGrid: {
    gap: 16
  },
  scoreCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8
  },
  scoreTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#111827'
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 4
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4
  },
  scoreText: {
    fontSize: 14,
    color: '#6b7280'
  },
  retakeButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default DiagnosticTool;
