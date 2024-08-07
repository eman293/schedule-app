import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Modal, Pressable } from 'react-native';
import { SQLiteProvider } from 'expo-sqlite';

// Function to initialize the database
async function initializeDatabase(db) {
  try {
    await db.execAsync(
      `PRAGMA journal_mode = WAL; 
      CREATE TABLE IF NOT EXISTS events 
      (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
      event TEXT NOT NULL, 
      date TEXT NOT NULL);`
    );
    console.log('Database initialised');
    const everything = db.getAllAsync(`SELECT * from events`);
    console.log('Database received');
    console.log(everything);
  } catch (error) {
    console.log('Error while initializing database : ', error);
  }
}

// Function to add an event
function addEvent(eventText, eventTime, events, setEvents, setEventText, setEventTime, setModalVisible) {
  if (eventText.trim() === '' || eventTime.trim() === '') {
    Alert.alert('Error', 'Please enter both text and time for the event.');
    return;
  }
  setEvents([...events, { text: eventText, time: eventTime }]);
  setEventText('');
  setEventTime('');
  setModalVisible(false);
}

// Function to delete an event
function deleteEvent(index, events, setEvents) {
  Alert.alert(
    'Delete Event',
    'Are you sure you want to delete this event?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'OK',
        onPress: () => {
          const newEvents = events.filter((_, i) => i !== index);
          setEvents(newEvents);
        },
      },
    ]
  );
}

// Component for rendering individual events
function EventItem({ item, index, onDelete }) {
  return (
    <View style={styles.eventContainer}>
      <Text style={styles.eventText}>{item.time} - {item.text}</Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(index)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

// Component for the modal used to add events
function EventModal({ visible, onClose, eventText, setEventText, eventTime, setEventTime, onAdd }) {
  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContainer}>
          <TextInput
            style={styles.modalInput}
            placeholder="Event Description"
            placeholderTextColor="#888"
            value={eventText}
            onChangeText={setEventText}
          />
          <TextInput
            style={styles.modalInput}
            placeholder="Event Time (e.g., 12:00 PM)"
            placeholderTextColor="#888"
            value={eventTime}
            onChangeText={setEventTime}
          />
          <TouchableOpacity
            style={styles.modalAddButton}
            onPress={onAdd}
          >
            <Text style={styles.modalAddButtonText}>Add Event</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

// Main App component
export default function App() {
  const [modalVisible, setModalVisible] = useState(false);
  const [eventText, setEventText] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [events, setEvents] = useState([]);

  return (
    <SQLiteProvider databaseName='events.db' onInit={initializeDatabase}>
      <LinearGradient
        colors={['#FF0000', '#800080']}
        style={styles.container}
      >
        <FlatList
          data={events}
          renderItem={({ item, index }) => (
            <EventItem item={item} index={index} onDelete={(index) => deleteEvent(index, events, setEvents)} />
          )}
          keyExtractor={(item, index) => index.toString()}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>

        {/* Modal for Adding Events */}
        <EventModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          eventText={eventText}
          setEventText={setEventText}
          eventTime={eventTime}
          setEventTime={setEventTime}
          onAdd={() => addEvent(eventText, eventTime, events, setEvents, setEventText, setEventTime, setModalVisible)}
        />
      </LinearGradient>
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  centerIt: {
    alignItems: 'center',
    paddingTop: 325,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
  },
  eventContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
  eventText: {
    color: '#000',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#f00',
    padding: 5,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#000',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalInput: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    color: '#000',
    width: '100%',
    marginBottom: 10,
  },
  modalAddButton: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  modalAddButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});