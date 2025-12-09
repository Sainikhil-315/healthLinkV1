import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import hospitalService from '../../services/hospitalService';
import useSocket from '../../hooks/useSocket';
import { COLORS } from '../../utils/constants';
import Loader from '../../components/common/Loader';
import IncomingPatientAlert from '../../components/hospital/IncomingPatientAlert';

const IncomingAlertsScreen = () => {
  const [incomingPatients, setIncomingPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { on, off } = useSocket();

  useEffect(() => {
    loadIncomingPatients();

    // Listen for real-time updates
    const unsubscribeUpdate = on('emergency:updated', handleEmergencyUpdate);
    const unsubscribeNew = on('hospital:assigned', handleNewPatient);

    return () => {
      unsubscribeUpdate();
      unsubscribeNew();
    };
  }, []);

  const loadIncomingPatients = async () => {
    try {
      setLoading(true);
      const result = await hospitalService.getIncomingPatients();
      
      if (result.success) {
        setIncomingPatients(result.data.patients || []);
      }
    } catch (error) {
      console.error('Load incoming patients error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIncomingPatients();
    setRefreshing(false);
  };

  const handleEmergencyUpdate = (data) => {
    setIncomingPatients(prev => 
      prev.map(patient => 
        patient._id === data.incidentId ? { ...patient, ...data } : patient
      )
    );
  };

  const handleNewPatient = (data) => {
    Toast.show({
      type: 'info',
      text1: 'New Incoming Patient',
      text2: `${data.severity} severity case assigned`
    });
    loadIncomingPatients();
  };

  const handleConfirmArrival = async (incidentId) => {
    const result = await hospitalService.confirmPatientArrival(incidentId);
    
    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Patient Arrival Confirmed',
        text2: 'Staff has been notified'
      });
      
      // Remove from incoming list
      setIncomingPatients(prev => prev.filter(p => p._id !== incidentId));
    } else {
      Toast.show({
        type: 'error',
        text1: 'Failed to confirm arrival',
        text2: result.error
      });
    }
  };

  const renderPatientItem = ({ item }) => (
    <IncomingPatientAlert
      incident={item}
      onConfirmArrival={() => handleConfirmArrival(item._id)}
      onViewDetails={() => {
        // TODO: Navigate to patient details
      }}
    />
  );

  if (loading) {
    return <Loader fullScreen message="Loading incoming patients..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Incoming Patients</Text>
        <Text style={styles.headerSubtitle}>
          {incomingPatients.length} patient{incomingPatients.length !== 1 ? 's' : ''} en route
        </Text>
      </View>

      <FlatList
        data={incomingPatients}
        renderItem={renderPatientItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="car-outline" size={80} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Incoming Patients</Text>
            <Text style={styles.emptySubtitle}>
              Ambulances assigned to your hospital will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: COLORS.background },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 }
});

export default IncomingAlertsScreen;