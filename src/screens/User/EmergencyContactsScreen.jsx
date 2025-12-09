import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  PermissionsAndroid,
  Platform,
  Linking,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Contacts from 'react-native-contacts';
import Toast from 'react-native-toast-message';
import Communications from 'react-native-communications';

import { apiService } from '../../services/api';
import { COLORS } from '../../utils/constants';
import Header from '../../components/common/Header';
import Loader from '../../components/common/Loader';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

// Relation enum from backend
const RELATION_OPTIONS = ['Parent', 'Spouse', 'Sibling', 'Child', 'Friend', 'Other'];

const EmergencyContactsScreen = ({ navigation }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showRelationDropdown, setShowRelationDropdown] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relation: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getEmergencyContacts();
      if (response.success) {
        setContacts(response.data.emergencyContacts || []);
      }
    } catch (error) {
      console.error('Load contacts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  };

  const handleAddContact = () => {
    setShowMethodModal(true);
  };

  const handleManualAdd = () => {
    setShowMethodModal(false);
    setFormData({ name: '', phone: '', relation: '' });
    setErrors({});
    setShowAddModal(true);
  };

  const handlePhoneBookAdd = async () => {
    setShowMethodModal(false);

    try {
      // Request contacts permission for Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts Permission',
            message:
              'HealthLink needs access to your contacts to add emergency contacts',
            buttonPositive: 'OK',
          },
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Denied',
            'Please enable contacts permission in settings to import from phone book',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ],
          );
          return;
        }
      }

      // Get all contacts
      Contacts.getAll()
        .then(contacts => {
          if (contacts.length === 0) {
            Toast.show({
              type: 'info',
              text1: 'No Contacts Found',
              text2: 'Your phone book is empty',
            });
            return;
          }

          // Filter contacts with phone numbers
          const contactsWithPhone = contacts.filter(
            c => c.phoneNumbers && c.phoneNumbers.length > 0,
          );

          if (contactsWithPhone.length === 0) {
            Toast.show({
              type: 'info',
              text1: 'No Contacts with Phone Numbers',
              text2: 'No valid contacts found',
            });
            return;
          }

          // Show contact picker
          navigation.navigate('ContactPicker', {
            contacts: contactsWithPhone,
            onSelect: handleContactSelect,
          });
        })
        .catch(error => {
          console.error('Get contacts error:', error);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to load contacts',
          });
        });
    } catch (error) {
      console.error('Phone book access error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to access phone contacts',
      });
    }
  };

  const handleContactSelect = async contact => {
    try {
      // Get contact name
      let contactName = 'Unknown';
      if (contact.displayName) {
        contactName = contact.displayName;
      } else if (contact.givenName && contact.familyName) {
        contactName = `${contact.givenName} ${contact.familyName}`;
      } else if (contact.givenName) {
        contactName = contact.givenName;
      } else if (contact.familyName) {
        contactName = contact.familyName;
      }

      // Get phone number and clean it
      if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
        Toast.show({
          type: 'error',
          text1: 'No Phone Number',
          text2: 'This contact does not have a phone number',
        });
        return;
      }

      const phone = contact.phoneNumbers[0].number.replace(/\D/g, '');
      console.log('1. Selected contact phone:', phone);
      if (phone.length < 10) {
        Toast.show({
          type: 'error',
          text1: 'Invalid Phone Number',
          text2: 'Phone number is too short',
        });
        return;
      }
      console.log('2. Adding contact with phone:', phone);
      const response = await apiService.addEmergencyContact({
        name: contactName,
        phone: phone,
        relation: 'Friend', // Default, can be updated later
      });
      console.log('3. Add contact response:', response);
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Contact Added',
          text2: `${contactName} added successfully`,
        });
        loadContacts();
        navigation.goBack(); // Go back from contact picker
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to add contact',
          text2: response.data?.message || 'Please try again',
        });
      }
    } catch (error) {
      console.error('Add contact error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add contact',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    if (!formData.relation.trim()) {
      newErrors.relation = 'Relation is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveContact = async () => {
    // if (!validateForm()) return;

    try {
      const response = await apiService.addEmergencyContact(formData);

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Contact Added',
          text2: `${formData.name} added successfully`,
        });
        setShowAddModal(false);
        loadContacts();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to add contact',
          text2: response.data?.message,
        });
      }
    } catch (error) {
      console.error('Save contact error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save contact',
      });
    }
  };

  const handleCallContact = (phoneNumber, contactName) => {
    // Clean the phone number - remove all non-digits and spaces
    const cleanedNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    console.log('Direct calling phone number:', cleanedNumber);
    
    if (!cleanedNumber || cleanedNumber.length < 10) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Number',
        text2: 'Phone number is not valid',
      });
      return;
    }

    try {
      // Use ACTION_CALL intent directly for immediate dialing
      Communications.phonecall(cleanedNumber, false);
    } catch (err) {
      console.error('Call error:', err);
      // Fallback to tel: protocol
      Linking.openURL(`tel:${cleanedNumber}`).catch(() => {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Unable to initiate call',
        });
      });
    }
  };

  const handleDeleteContact = (contactId, name) => {
    Alert.alert('Delete Contact', `Are you sure you want to remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await apiService.deleteEmergencyContact(contactId);

            if (response.success) {
              Toast.show({
                type: 'success',
                text1: 'Contact Deleted',
                text2: `${name} removed successfully`,
              });
              loadContacts();
            }
          } catch (error) {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'Failed to delete contact',
            });
          }
        },
      },
    ]);
  };

  const renderContactItem = ({ item }) => (
    <Card style={styles.contactCard}>
      <View style={styles.contactHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactPhone}>{item.phone}</Text>
          <View style={styles.relationBadge}>
            <Text style={styles.relationText}>{item.relation}</Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleCallContact(item.phone, item.name)}
          >
            <Icon name="call" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteContact(item._id, item.name)}
          >
            <Icon name="trash-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return <Loader fullScreen message="Loading contacts..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Emergency Contacts"
        subtitle={`${contacts.length} contact${
          contacts.length !== 1 ? 's' : ''
        }`}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.infoBox}>
        <Icon name="information-circle" size={20} color={COLORS.info} />
        <Text style={styles.infoText}>
          These contacts will be notified automatically during emergencies
        </Text>
      </View>

      <FlatList
        data={contacts}
        renderItem={renderContactItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon
              name="people-outline"
              size={80}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyTitle}>No Emergency Contacts</Text>
            <Text style={styles.emptyText}>
              Add trusted contacts who will be notified during emergencies
            </Text>
          </View>
        }
      />

      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
          <Icon name="add" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Contact</Text>
        </TouchableOpacity>
      </View>

      {/* Method Selection Modal */}
      <Modal
        visible={showMethodModal}
        onClose={() => setShowMethodModal(false)}
        title="Add Emergency Contact"
      >
        <View style={styles.methodContainer}>
          <TouchableOpacity
            style={styles.methodCard}
            onPress={handlePhoneBookAdd}
          >
            <Icon name="phone-portrait" size={48} color={COLORS.primary} />
            <Text style={styles.methodTitle}>From Phone Book</Text>
            <Text style={styles.methodDescription}>
              Import contact directly from your phone
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.methodCard} onPress={handleManualAdd}>
            <Icon name="create" size={48} color={COLORS.secondary} />
            <Text style={styles.methodTitle}>Manual Entry</Text>
            <Text style={styles.methodDescription}>
              Enter contact details manually
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Manual Add Modal */}
      <Modal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Contact Manually"
        footer={
          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowAddModal(false)}
              style={{ flex: 1 }}
            />
            <Button
              title="Save"
              onPress={handleSaveContact}
              style={{ flex: 1 }}
            />
          </View>
        }
      >
        <Input
          label="Full Name"
          value={formData.name}
          onChangeText={text => setFormData({ ...formData, name: text })}
          placeholder="John Doe"
          leftIcon="person-outline"
          error={errors.name}
        />

        <Input
          label="Phone Number"
          value={formData.phone}
          onChangeText={text => setFormData({ ...formData, phone: text })}
          placeholder="9876543210"
          keyboardType="phone-pad"
          leftIcon="call-outline"
          error={errors.phone}
        />

        <View style={styles.relationContainer}>
          <Text style={styles.relationLabel}>Relation</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowRelationDropdown(!showRelationDropdown)}
          >
            <Text style={[
              styles.dropdownButtonText,
              { color: formData.relation ? COLORS.text : COLORS.textSecondary }
            ]}>
              {formData.relation || 'Select a relation'}
            </Text>
            <Icon 
              name={showRelationDropdown ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={COLORS.textSecondary} 
            />
          </TouchableOpacity>
          
          {showRelationDropdown && (
            <View style={styles.dropdownMenu}>
              {RELATION_OPTIONS.map(relation => (
                <TouchableOpacity
                  key={relation}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFormData({ ...formData, relation });
                    setShowRelationDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    formData.relation === relation && styles.dropdownItemTextSelected
                  ]}>
                    {relation}
                  </Text>
                  {formData.relation === relation && (
                    <Icon name="checkmark" size={20} color={COLORS.success} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {errors.relation && (
            <Text style={styles.errorText}>{errors.relation}</Text>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info + '10',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.info, lineHeight: 18 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  contactCard: { marginBottom: 12 },
  contactHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { marginRight: 12 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  contactInfo: { flex: 1 },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  contactPhone: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 6 },
  relationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  relationText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  callButton: {
    backgroundColor: COLORS.success,
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: { padding: 8 },
  addButtonContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  addButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 4,
  },
  addButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
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
    lineHeight: 20,
  },
  methodContainer: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  methodCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  methodDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  relationContainer: { marginBottom: 16 },
  relationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
  },
  dropdownButtonText: {
    fontSize: 16,
    flex: 1,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    marginTop: 4,
    overflow: 'hidden',
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemText: {
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
  },
  dropdownItemTextSelected: {
    fontWeight: '600',
    color: COLORS.success,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
});

export default EmergencyContactsScreen;
