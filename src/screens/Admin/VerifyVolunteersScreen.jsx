import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Modal, Image, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import axios from 'axios';

import { COLORS } from '../../utils/constants';
import { apiService } from '../../services/api';
import Header from '../../components/common/Header';
import Loader from '../../components/common/Loader';
import AdminVerificationCard from '../../components/admin/AdminVerificationCard';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const VerifyVolunteersScreen = ({ navigation }) => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadVolunteers();
  }, []);

  const loadVolunteers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllVolunteers({ status: 'pending' });
      
      if (response.success) {
        setVolunteers(response.data.volunteers);
      }
    } catch (error) {
      console.error('Load volunteers error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load volunteers'
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVolunteers();
    setRefreshing(false);
  };

  const handleApprove = (volunteerId) => {
    Alert.alert(
      'Approve Volunteer',
      'Are you sure you want to approve this volunteer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              const response = await apiService.verifyVolunteer(volunteerId);
              
              if (response.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Volunteer Approved',
                  text2: 'They can now respond to emergencies'
                });
                loadVolunteers();
              }
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Failed to approve volunteer'
              });
            }
          }
        }
      ]
    );
  };

  const handleReject = async (volunteerId) => {
    if (!rejectReason.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Please provide rejection reason'
      });
      return;
    }

    try {
      const response = await apiService.rejectVolunteer(volunteerId, {
        reason: rejectReason
      });
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Volunteer Rejected'
        });
        setShowRejectModal(null);
        setRejectReason('');
        loadVolunteers();
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to reject volunteer'
      });
    }
  };

  const renderVolunteer = ({ item }) => (
    <AdminVerificationCard
      item={item}
      type="volunteer"
      onApprove={() => handleApprove(item._id)}
      onReject={() => setShowRejectModal(item._id)}
      onViewCertificate={() => setSelectedCertificate(item.certification?.certificateImage)}
    />
  );

  if (loading) {
    return <Loader fullScreen message="Loading volunteers..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Verify Volunteers"
        subtitle={`${volunteers.length} pending verification`}
        onBackPress={() => navigation.goBack()}
      />

      <FlatList
        data={volunteers}
        renderItem={renderVolunteer}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="checkmark-done-circle-outline" size={80} color={COLORS.success} />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyText}>No pending volunteer verifications</Text>
          </View>
        }
      />

      {/* Certificate Viewer Modal */}
      <Modal
        visible={!!selectedCertificate}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCertificate(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.certificateModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Certificate</Text>
              <TouchableOpacity onPress={() => setSelectedCertificate(null)}>
                <Icon name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            {selectedCertificate && (
              <Image
                source={{ uri: selectedCertificate }}
                style={styles.certificateImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        visible={!!showRejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rejectModal}>
            <Text style={styles.modalTitle}>Reject Volunteer</Text>
            <Text style={styles.modalSubtitle}>Please provide a reason for rejection</Text>
            
            <Input
              label="Rejection Reason"
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Certificate expired, unclear image, etc."
              multiline
              numberOfLines={4}
              style={{ marginVertical: 16 }}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setShowRejectModal(null);
                  setRejectReason('');
                }}
                style={{ flex: 1 }}
              />
              <Button
                title="Reject"
                variant="danger"
                onPress={() => handleReject(showRejectModal)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 20 },
  emptyState: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginTop: 16 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  certificateModal: {
    backgroundColor: COLORS.background,
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  certificateImage: { width: '100%', height: 500 },
  rejectModal: {
    backgroundColor: COLORS.background,
    width: '90%',
    borderRadius: 16,
    padding: 20
  },
  modalSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 }
});

export default VerifyVolunteersScreen;