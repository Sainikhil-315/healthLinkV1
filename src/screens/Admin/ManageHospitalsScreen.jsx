import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import axios from 'axios';

import { COLORS, API_URL } from '../../utils/constants';
import Header from '../../components/common/Header';
import Loader from '../../components/common/Loader';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';

const ManageHospitalsScreen = ({ navigation }) => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, verified, unverified

  useEffect(() => {
    loadHospitals();
  }, [filter]);

  const loadHospitals = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter === 'verified') params.verified = 'true';
      if (filter === 'unverified') params.verified = 'false';

      const response = await axios.get(`${API_URL}/admin/hospitals`, { params });
      
      if (response.data.success) {
        setHospitals(response.data.data.hospitals);
      }
    } catch (error) {
      console.error('Load hospitals error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load hospitals'
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHospitals();
    setRefreshing(false);
  };

  const handleVerify = (hospitalId) => {
    Alert.alert(
      'Verify Hospital',
      'Are you sure you want to verify this hospital?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          onPress: async () => {
            try {
              const response = await axios.put(`${API_URL}/admin/hospitals/${hospitalId}/verify`);
              
              if (response.data.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Hospital Verified',
                  text2: 'Hospital can now accept emergencies'
                });
                loadHospitals();
              }
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Failed to verify hospital'
              });
            }
          }
        }
      ]
    );
  };

  const handleToggleStatus = (hospitalId, isActive) => {
    Alert.alert(
      `${isActive ? 'Suspend' : 'Activate'} Hospital`,
      `Are you sure you want to ${isActive ? 'suspend' : 'activate'} this hospital?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isActive ? 'Suspend' : 'Activate',
          style: isActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const response = await axios.put(
                `${API_URL}/admin/hospitals/${hospitalId}/status`,
                { isActive: !isActive }
              );
              
              if (response.data.success) {
                Toast.show({
                  type: 'success',
                  text1: `Hospital ${isActive ? 'Suspended' : 'Activated'}`
                });
                loadHospitals();
              }
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Failed to update status'
              });
            }
          }
        }
      ]
    );
  };

  const filteredHospitals = hospitals.filter(hospital =>
    hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hospital.location?.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderHospital = ({ item }) => (
    <Card style={styles.hospitalCard}>
      <View style={styles.hospitalHeader}>
        <View style={styles.iconContainer}>
          <Icon name="business" size={28} color={COLORS.info} />
        </View>
        <View style={styles.hospitalInfo}>
          <Text style={styles.hospitalName}>{item.name}</Text>
          <Text style={styles.hospitalType}>{item.type} Hospital</Text>
          <Text style={styles.hospitalLocation} numberOfLines={1}>
            {item.location?.city}, {item.location?.state}
          </Text>
        </View>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Registration:</Text>
          <Text style={styles.detailValue}>{item.registrationNumber}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Emergency Phone:</Text>
          <Text style={styles.detailValue}>{item.emergencyPhone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Beds:</Text>
          <Text style={styles.detailValue}>
            {(item.bedAvailability?.general?.total || 0) + 
             (item.bedAvailability?.icu?.total || 0) + 
             (item.bedAvailability?.emergency?.total || 0)} total
          </Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={styles.badges}>
          {item.isVerified ? (
            <View style={[styles.badge, { backgroundColor: COLORS.success }]}>
              <Icon name="checkmark-circle" size={12} color="#FFFFFF" />
              <Text style={styles.badgeText}>Verified</Text>
            </View>
          ) : (
            <View style={[styles.badge, { backgroundColor: COLORS.warning }]}>
              <Icon name="time" size={12} color="#FFFFFF" />
              <Text style={styles.badgeText}>Pending</Text>
            </View>
          )}
          
          <View style={[
            styles.badge, 
            { backgroundColor: item.isActive ? COLORS.success : COLORS.error }
          ]}>
            <Text style={styles.badgeText}>
              {item.isActive ? 'Active' : 'Suspended'}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {!item.isVerified && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleVerify(item._id)}
            >
              <Icon name="checkmark-done" size={20} color={COLORS.success} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleToggleStatus(item._id, item.isActive)}
          >
            <Icon 
              name={item.isActive ? 'pause' : 'play'} 
              size={20} 
              color={item.isActive ? COLORS.warning : COLORS.success} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  const FilterButton = ({ value, label }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <Loader fullScreen message="Loading hospitals..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Manage Hospitals"
        subtitle={`${hospitals.length} hospitals`}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.searchContainer}>
        <Input
          placeholder="Search hospitals..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterContainer}>
        <FilterButton value="all" label="All" />
        <FilterButton value="verified" label="Verified" />
        <FilterButton value="unverified" label="Pending" />
      </View>

      <FlatList
        data={filteredHospitals}
        renderItem={renderHospital}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="business-outline" size={80} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Hospitals Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try adjusting your search' : 'No hospitals in this category'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  searchInput: { marginBottom: 0 },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  filterTextActive: { color: '#FFFFFF' },
  list: { padding: 20 },
  hospitalCard: { marginBottom: 12 },
  hospitalHeader: { flexDirection: 'row', marginBottom: 12 },
  iconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.info + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  hospitalInfo: { flex: 1 },
  hospitalName: { fontSize: 17, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  hospitalType: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
  hospitalLocation: { fontSize: 13, color: COLORS.textSecondary },
  detailsSection: { backgroundColor: COLORS.background, padding: 12, borderRadius: 8, marginBottom: 12, gap: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: 13, color: COLORS.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 3 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
  actions: { flexDirection: 'row', gap: 8 },
  actionButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 16 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 }
});

export default ManageHospitalsScreen;