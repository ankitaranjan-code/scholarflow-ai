/**
 * StudentContext — Global state for the logged-in student's profile,
 * points, streak, and ML predictions. Provides real-time data to all components.
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch the student profile from the backend.
   */
  const fetchStudent = useCallback(async (id) => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getStudent(id);
      setStudent(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchStudent(user.id);
    } else {
      setStudent(null);
    }
  }, [user, fetchStudent]);

  /**
   * Run ML prediction with the given features.
   */
  const runPrediction = useCallback(async (features) => {
    try {
      setLoading(true);
      const result = await api.predictPerformance(features);
      setPrediction(result);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update local student points/streak after a task completion.
   */
  const updatePoints = useCallback((pointsEarned) => {
    setStudent(prev => prev ? {
      ...prev,
      total_points: (prev.total_points || 0) + pointsEarned,
    } : prev);
  }, []);

  const value = {
    student,
    prediction,
    loading,
    error,
    studentId: student?.id,
    fetchStudent,
    runPrediction,
    updatePoints,
    setStudent,
  };

  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (!context) throw new Error('useStudent must be used within a StudentProvider');
  return context;
}
