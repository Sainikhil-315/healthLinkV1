import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';
import Card from '../common/Card';

const VolunteerStats = ({ stats, badges }) => {
  const StatCard = ({ icon, label, value, color }) => (
    <Card style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={28} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );

  const BadgeItem = ({ badge }) => (
    <View style={styles.badgeItem}>
      <View style={[styles.badgeIcon, { backgroundColor: badge.color + '20' }]}>
        <Icon name={badge.icon} size={32} color={badge.color} />
      </View>
      <Text style={styles.badgeName}>{badge.name}</Text>
      <Text style={styles.badgeDescription}>{badge.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Stats Grid */}
      <Text style={styles.sectionTitle}>Your Impact</Text>
      <View style={styles.statsGrid}>
        <StatCard
          icon="heart"
          label="Lives Saved"
          value={stats?.livesSaved || 0}
          color={COLORS.error}
        />
        <StatCard
          icon="checkmark-done"
          label="Missions"
          value={stats?.totalMissions || 0}
          color={COLORS.success}
        />
        <StatCard
          icon="time"
          label="Avg Response"
          value={stats?.averageResponseTime ? `${stats.averageResponseTime}m` : '--'}
          color={COLORS.info}
        />
        <StatCard
          icon="star"
          label="Rating"
          value={stats?.averageRating ? stats.averageRating.toFixed(1) : '--'}
          color={COLORS.warning}
        />
      </View>

      {/* Badges */}
      {badges && badges.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesContainer}
          >
            {badges.map((badge, index) => (
              <BadgeItem key={index} badge={badge} />
            ))}
          </ScrollView>
        </>
      )}

      {/* Additional Stats */}
      {stats && (
        <Card style={styles.additionalStats}>
          <Text style={styles.sectionTitle}>Activity Overview</Text>
          
          <View style={styles.statRow}>
            <Text style={styles.statRowLabel}>This Month:</Text>
            <Text style={styles.statRowValue}>
              {stats.monthlyMissions || 0} missions
            </Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statRowLabel}>This Week:</Text>
            <Text style={styles.statRowValue}>
              {stats.weeklyMissions || 0} missions
            </Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statRowLabel}>Total Distance:</Text>
            <Text style={styles.statRowValue}>
              {stats.totalDistance ? `${stats.totalDistance.toFixed(1)}km` : '0km'}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statRowLabel}>Member Since:</Text>
            <Text style={styles.statRowValue}>
              {stats.memberSince ? new Date(stats.memberSince).toLocaleDateString() : '--'}
            </Text>
          </View>
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: COLORS.text, 
    marginBottom: 16, 
    marginTop: 8 
  },
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12, 
    marginBottom: 24 
  },
  statCard: { 
    width: '48%', 
    alignItems: 'center', 
    paddingVertical: 20 
  },
  iconContainer: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  statValue: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: COLORS.text, 
    marginBottom: 4 
  },
  statLabel: { 
    fontSize: 12, 
    color: COLORS.textSecondary, 
    textAlign: 'center' 
  },
  badgesContainer: { 
    paddingBottom: 16, 
    gap: 12 
  },
  badgeItem: { 
    backgroundColor: COLORS.surface, 
    borderRadius: 12, 
    padding: 16, 
    alignItems: 'center', 
    width: 140, 
    elevation: 1 
  },
  badgeIcon: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  badgeName: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.text, 
    textAlign: 'center', 
    marginBottom: 4 
  },
  badgeDescription: { 
    fontSize: 11, 
    color: COLORS.textSecondary, 
    textAlign: 'center' 
  },
  additionalStats: { 
    marginTop: 8, 
    padding: 16 
  },
  statRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  statRowLabel: { 
    fontSize: 14, 
    color: COLORS.textSecondary 
  },
  statRowValue: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.text 
  }
});

export default VolunteerStats;