import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';
import Card from '../common/Card';

const DonationHistory = ({ donations }) => {
  const renderDonationItem = ({ item }) => (
    <Card style={styles.donationCard}>
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Icon name="calendar" size={20} color={COLORS.primary} />
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Icon name="checkmark-circle" size={16} color={COLORS.success} />
          <Text style={styles.statusText}>Completed</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        {item.hospital && (
          <View style={styles.infoRow}>
            <Icon name="business" size={18} color={COLORS.textSecondary} />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.hospital.name}
            </Text>
          </View>
        )}

        {item.hospital?.location?.address && (
          <View style={styles.infoRow}>
            <Icon name="location" size={18} color={COLORS.textSecondary} />
            <Text style={styles.infoText} numberOfLines={2}>
              {item.hospital.location.address}
            </Text>
          </View>
        )}

        {item.patient?.bloodType && (
          <View style={styles.infoRow}>
            <Icon name="water" size={18} color={COLORS.error} />
            <View style={styles.bloodTypeBadge}>
              <Text style={styles.bloodTypeText}>{item.patient.bloodType}</Text>
            </View>
          </View>
        )}
      </View>

      {item.ratings?.donor && (
        <View style={styles.ratingContainer}>
          <Icon name="star" size={16} color={COLORS.warning} />
          <Text style={styles.ratingText}>
            {item.ratings.donor.rating.toFixed(1)}
          </Text>
        </View>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Donation History</Text>
        <Text style={styles.subtitle}>
          {donations.length} total donation{donations.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {donations.length > 0 ? (
        <FlatList
          data={donations}
          renderItem={renderDonationItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Icon name="water-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No Donations Yet</Text>
          <Text style={styles.emptyText}>
            Your donation history will appear here once you complete your first donation
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 16 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary
  },
  list: { paddingBottom: 20 },
  donationCard: { marginBottom: 12 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success
  },
  cardBody: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    gap: 10
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text
  },
  bloodTypeBadge: {
    backgroundColor: COLORS.error + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  bloodTypeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.error
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20
  }
});

export default DonationHistory;