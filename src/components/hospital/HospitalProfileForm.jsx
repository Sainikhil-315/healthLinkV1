import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../../utils/constants';

const HospitalProfileForm = ({ initialValues = {}, onSubmit, loading }) => {
  const [name, setName] = useState(initialValues.name || '');
  const [phone, setPhone] = useState(initialValues.phone || '');
  const [street, setStreet] = useState(initialValues.address?.street || '');
  const [city, setCity] = useState(initialValues.address?.city || '');
  const [state, setState] = useState(initialValues.address?.state || '');
  const [pincode, setPincode] = useState(initialValues.address?.pincode || '');

  const handleSubmit = () => {
    onSubmit({
      name,
      phone,
      address: { street, city, state, pincode }
    });
  };

  return (
    <View style={styles.form}>
      <Text style={styles.label}>Hospital Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" />
      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" />
      <Text style={styles.label}>Street</Text>
      <TextInput style={styles.input} value={street} onChangeText={setStreet} placeholder="Street" />
      <Text style={styles.label}>City</Text>
      <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="City" />
      <Text style={styles.label}>State</Text>
      <TextInput style={styles.input} value={state} onChangeText={setState} placeholder="State" />
      <Text style={styles.label}>Pincode</Text>
      <TextInput style={styles.input} value={pincode} onChangeText={setPincode} placeholder="Pincode" keyboardType="number-pad" />
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  form: { padding: 16 },
  label: { fontSize: 14, color: COLORS.text, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    marginTop: 4
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default HospitalProfileForm;
