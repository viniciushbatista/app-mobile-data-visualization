import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const FiltrosHorizontais = () => {
  return (
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <TouchableOpacity style={styles.botao}>
          <Text style={styles.textoBotao}>Todos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botao}>
          <Text style={styles.textoBotao}>Bovinos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botao}>
          <Text style={styles.textoBotao}>Caprinos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botao}>
          <Text style={styles.textoBotao}>Ovinos</Text>
        </TouchableOpacity>
      </ScrollView>
  );
};

const styles = StyleSheet.create({
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 16,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  botao: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#42a5f5',
  },
  textoBotao: {
    color: '#333',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default FiltrosHorizontais;