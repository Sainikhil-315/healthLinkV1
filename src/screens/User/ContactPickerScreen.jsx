import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { COLORS } from '../../utils/constants';
import Header from '../../components/common/Header';

const ContactPickerScreen = ({ route, navigation }) => {
  const { contacts, onSelect } = route.params;
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to get contact display name
  const getContactName = (contact) => {
    if (contact.displayName) return contact.displayName;
    if (contact.givenName && contact.familyName) {
      return `${contact.givenName} ${contact.familyName}`;
    }
    if (contact.givenName) return contact.givenName;
    if (contact.familyName) return contact.familyName;
    return 'Unknown Contact';
  };

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact => {
    try {
      const contactName = getContactName(contact).toLowerCase();
      const query = searchQuery.toLowerCase();
      return contactName.includes(query);
    } catch (error) {
      return false; // Skip contacts that cause errors
    }
  });

  const handleSelectContact = (contact) => {
    onSelect(contact);
    navigation.goBack();
  };

  const renderContactItem = ({ item }) => {
    const displayName = getContactName(item);
    const firstLetter = displayName.charAt(0).toUpperCase();
    
    // Get phone number safely
    const phoneNumber = item.phoneNumbers && item.phoneNumbers.length > 0
      ? item.phoneNumbers[0].number
      : 'No phone number';
    
    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => handleSelectContact(item)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{firstLetter}</Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{displayName}</Text>
          <Text style={styles.contactPhone}>{phoneNumber}</Text>
        </View>
        <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Select Contact"
        subtitle={`${filteredContacts.length} contacts`}
        onBackPress={() => navigation.goBack()}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search contacts..."
          placeholderTextColor={COLORS.textSecondary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredContacts}
        renderItem={renderContactItem}
        keyExtractor={(item, index) => `${item.recordID || index}`}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="search-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No contacts found' : 'No contacts available'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.surface, 
    marginHorizontal: 20, 
    marginBottom: 16, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  searchInput: { 
    flex: 1, 
    paddingVertical: 12, 
    paddingHorizontal: 8, 
    fontSize: 16, 
    color: COLORS.text 
  },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  contactItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.surface, 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 8,
    elevation: 1
  },
  avatar: { 
    width: 45, 
    height: 45, 
    borderRadius: 22.5, 
    backgroundColor: COLORS.primary, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  avatarText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#FFFFFF' 
  },
  contactInfo: { flex: 1 },
  contactName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: COLORS.text, 
    marginBottom: 4 
  },
  contactPhone: { 
    fontSize: 14, 
    color: COLORS.textSecondary 
  },
  emptyState: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingTop: 100 
  },
  emptyText: { 
    fontSize: 16, 
    color: COLORS.textSecondary, 
    marginTop: 16,
    textAlign: 'center'
  }
});

export default ContactPickerScreen;