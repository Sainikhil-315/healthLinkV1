import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import ambulanceService from '../../services/ambulanceService';
import socketService from '../../services/socketService';
import { COLORS } from '../../utils/constants';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';

const IncomingRequestsScreen = ({ navigation }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRequests();
    setupSocketListeners();

    return () => {
      socketService.off('ambulance:request');
    };
  }, []);

  const loadRequests = async () => {
    // In production, fetch pending requests from API
    // For now, listen via socket
    setLoading(false);
  };

  const setupSocketListeners = () => {
    // Listen for new emergency requests
    socketService.on('ambulance:request', (data) => {
      console.log('🚑 NEW EMERGENCY REQUEST:', data);
      
      // Add to requests list
      setRequests((prev) => {
        const exists = prev.find((r) => r.incidentId === data.incidentId);
        if (exists) return prev;
        return [data, ...prev];
      });

      // Show notification
      Toast.show({
        type: 'error',
        text1: '🚨 Emergency Request',
        text2: `${data.severity} - ${data.distance?.toFixed(1)}km away`,
        visibilityTime: 10000,
        autoHide: false,
        onPress: () => {
          navigation.navigate('IncomingRequests');
        },
      });
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleAccept = async (request) => {
    Alert.alert(
      'Accept Emergency?',
      `Distance: ${request.distance?.toFixed(1)}km\nSeverity: ${request.severity}\nETA: ${request.eta} min`,
      [
        { text: 'Decline', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              const result = await ambulanceService.acceptTrip(
                request.incidentId
              );

              if (result.success) {
                // Remove from list
                setRequests((prev) =>
                  prev.filter((r) => r.incidentId !== request.incidentId)
                );

                Toast.show({
                  type: 'success',
                  text1: 'Trip Accepted',
                  text2: 'Navigate to patient location',
                });

                // Navigate to active emergency
                navigation.navigate('ActiveEmergency');
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Failed to accept',
                  text2: result.error,
                });
              }
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to accept trip',
              });
            }
          },
        },
      ]
    );
  };

  const handleDecline = (request) => {
    Alert.alert('Decline Request?', 'This request will be sent to other ambulances.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: () => {
          setRequests((prev) =>
            prev.filter((r) => r.incidentId !== request.incidentId)
          );
          Toast.show({
            type: 'info',
            text1: 'Request Declined',
          });
        },
      },
    ]);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: COLORS.error,
      high: COLORS.warning,
      medium: COLORS.info,
      low: COLORS.success,
    };
    return colors[severity?.toLowerCase()] || COLORS.textSecondary;
  };

  const renderRequest = ({ item }) => (
    <Card style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View
          style={[
            styles.severityBadge,
            { backgroundColor: getSeverityColor(item.severity) },
          ]}
        >
          <Text style={styles.severityText}>{item.severity}</Text>
        </View>
        <View style={styles.distanceContainer}>
          <Icon name="navigate" size={16} color={COLORS.textSecondary} />
          <Text style={styles.distanceText}>
            {item.distance?.toFixed(1)}km away
          </Text>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Icon name="location" size={18} color={COLORS.primary} />
          <Text style={styles.detailText}>{item.address || 'Unknown location'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="time" size={18} color={COLORS.info} />
          <Text style={styles.detailText}>ETA: {item.eta} min</Text>
        </View>

        {item.bloodRequired && (
          <View style={styles.detailRow}>
            <Icon name="water" size={18} color={COLORS.error} />
            <Text style={styles.detailText}>Blood Required</Text>
          </View>
        )}
      </View>

      <View style={styles.requestActions}>
        <Button
          title="Decline"
          variant="outline"
          onPress={() => handleDecline(item)}
          style={{ flex: 1 }}
        />
        <Button
          title="Accept"
          onPress={() => handleAccept(item)}
          style={{ flex: 1 }}
        />
      </View>
    </Card>
  );

  if (loading) {
    return <Loader fullScreen message="Loading requests..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Requests</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={requests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.incidentId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="notifications-off" size={80} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Pending Requests</Text>
            <Text style={styles.emptyText}>
              Emergency requests will appear here when you're on duty
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  list: { padding: 20 },
  requestCard: { marginBottom: 16 },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: { fontSize: 14, color: COLORS.textSecondary },
  requestDetails: { marginBottom: 16 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: { fontSize: 14, color: COLORS.text, flex: 1 },
  requestActions: { flexDirection: 'row', gap: 12 },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default IncomingRequestsScreen;