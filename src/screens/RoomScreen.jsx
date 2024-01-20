import React from 'react';
import { Text, StyleSheet, View, TextInput, TouchableOpacity,Dimensions } from 'react-native';

export default function RoomScreen({ setScreen, screens, setRoomId, roomId }) {



  const onCallOrJoin = (screen) => {
    if (roomId.length > 0) {
      setScreen(screen);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Select a Room</Text>
      <TextInput 
        style={styles.input} 
        value={roomId} 
        onChangeText={setRoomId} 
        placeholder="Enter Room ID"
        placeholderTextColor="#7f8c8d" // Light gray color for the placeholder text
      />
      <TouchableOpacity style={styles.buttonContainer} onPress={() => onCallOrJoin(screens.CALL)}>
        <Text style={styles.buttonText}>Call Screen</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonContainer} onPress={() => onCallOrJoin(screens.JOIN)}>
        <Text style={styles.buttonText}>Join Screen</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    marginBottom: 20,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000080',
  },
  input: {
    width: '80%',
    height: 50,
    borderColor: '#000080',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
    fontSize: 18,
    marginBottom: 20,
    color: '#000080',
    backgroundColor: '#f8f9fa',
  },
  buttonContainer: {
    width: '60%',
    height: 50,
    borderRadius: 25,
    backgroundColor: '#000080',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
  }
});
