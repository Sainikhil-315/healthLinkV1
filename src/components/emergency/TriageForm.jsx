import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, TRIAGE_QUESTIONS } from '../../utils/constants';

const TriageForm = ({ onComplete }) => {
  const [answers, setAnswers] = useState({});

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const isComplete = () => {
    return TRIAGE_QUESTIONS.every(q => answers.hasOwnProperty(q.id));
  };

  const handleSubmit = () => {
    if (isComplete()) {
      onComplete(answers);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Assessment</Text>
      <Text style={styles.subtitle}>
        Answer these questions about the victim:
      </Text>

      {TRIAGE_QUESTIONS.map((question, index) => (
        <View key={question.id} style={styles.questionContainer}>
          <Text style={styles.questionNumber}>Q{index + 1}</Text>
          <Text style={styles.questionText}>{question.question}</Text>
          
          <View style={styles.answerButtons}>
            <TouchableOpacity
              style={[
                styles.answerButton,
                answers[question.id] === true && styles.answerButtonSelected
              ]}
              onPress={() => handleAnswer(question.id, true)}
            >
              <Text
                style={[
                  styles.answerButtonText,
                  answers[question.id] === true && styles.answerButtonTextSelected
                ]}
              >
                Yes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.answerButton,
                answers[question.id] === false && styles.answerButtonSelected
              ]}
              onPress={() => handleAnswer(question.id, false)}
            >
              <Text
                style={[
                  styles.answerButtonText,
                  answers[question.id] === false && styles.answerButtonTextSelected
                ]}
              >
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.submitButton, !isComplete() && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!isComplete()}
      >
        <Text style={styles.submitButtonText}>
          Submit & Call Ambulance
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24
  },
  questionContainer: {
    marginBottom: 24
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12
  },
  answerButtons: {
    flexDirection: 'row',
    gap: 12
  },
  answerButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surface
  },
  answerButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  answerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text
  },
  answerButtonTextSelected: {
    color: '#FFFFFF'
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.disabled
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  }
});

export default TriageForm;