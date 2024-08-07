import { StatusBar } from 'expo-status-bar';
import { FlatList, StyleSheet, Text, View, Pressable, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect } from 'react';
import { AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Initialize the database
async function initializeDatabase(db) {
    try {
        await db.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT,
                time TEXT
            );
        `);
        console.log('Database initialized');
        const everything = await db.getAllAsync('SELECT * FROM events');
        console.log('data:');
        console.log(everything);
    } catch (error) {
        console.log('Error while initializing database: ', error);
    }
}

// EventButton component
const EventButton = ({ event, deleteEvent }) => {
    const handleDelete = () => {
        Alert.alert(
            'Attention!',
            'Are you sure you want to delete this event?',
            [
                { text: 'No', onPress: () => { }, style: 'cancel' },
                { text: 'Yes', onPress: () => deleteEvent(event.id) },
            ],
            { cancelable: true }
        );
    };

    return (
        <View style={styles.eventButton}>
            <Text style={styles.eventText}>{event.description}</Text>
            <Text style={styles.eventTime}>{event.time}</Text>
            <AntDesign
                name='delete'
                size={18}
                color='red'
                onPress={handleDelete}
                style={styles.icon}
            />
        </View>
    );
};

// EventForm component
const EventForm = ({ event, setEvent, onSave, setShowForm }) => {
    return (
        <View style={styles.formContainer}>
            <TextInput
                style={styles.input}
                placeholder='Event description'
                value={event.description}
                onChangeText={(text) => setEvent({ ...event, description: text })}
            />
            <TextInput
                style={styles.input}
                placeholder='Event time (e.g., 3:00 PM)'
                value={event.time}
                onChangeText={(text) => setEvent({ ...event, time: text })}
            />

            <Pressable
                onPress={onSave}
                style={styles.saveButton}
            >
                <Text style={styles.buttonText}>Save</Text>
            </Pressable>
            <Pressable
                onPress={() => setShowForm(false)}
                style={styles.cancelButton}
            >
                <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
        </View>
    );
};

export default function App() {
    return (
        <SQLiteProvider databaseName='example.db' onInit={initializeDatabase}>
            <LinearGradient
                colors={['#d5edff', '#004a82']} // Red to purple gradient
                style={styles.gradient}
            >
                <View style={styles.container}>
                    <Text style={styles.title}>Schedule For Today</Text>
                    <Content />
                    <StatusBar style="auto" />
                </View>
            </LinearGradient>
        </SQLiteProvider>
    );
}

const Content = () => {
    const db = useSQLiteContext();
    const [events, setEvents] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [event, setEvent] = useState({ id: 0, description: '', time: '' });
    const [loading, setLoading] = useState(true);

    const handleSave = () => {
        if (event.description.length === 0 || event.time.length === 0) {
            Alert.alert('Attention', 'Please enter all the data!');
        } else {
            addEvent(event);
            setEvent({ id: 0, description: '', time: '' });
            setShowForm(false);
        }
    };

    const getEvents = async () => {
        try {
            const allRows = await db.getAllAsync('SELECT * FROM events');
            setEvents(allRows);
        } catch (error) {
            console.log('Error while loading events: ', error);
        } finally {
            // Delay setting loading to false for at least 3 seconds
            setTimeout(() => setLoading(false), 3000);
        }
    };

    const addEvent = async (newEvent) => {
        try {
            const statement = await db.prepareAsync('INSERT INTO events (description, time) VALUES (?,?)');
            await statement.executeAsync([newEvent.description, newEvent.time]);
            await getEvents();
        } catch (error) {
            console.log('Error while adding event: ', error);
        }
    };

    const deleteEvent = async (id) => {
        try {
            await db.runAsync('DELETE FROM events WHERE id = ?', [id]);
            await getEvents();
        } catch (error) {
            console.log('Error while deleting the event: ', error);
        }
    };

    useEffect(() => {
        getEvents();
    }, []);

    if (loading) {
        return (
              <ActivityIndicator size="large" color="#ffffff" />
        );
    }

    return (
        <View style={styles.contentContainer}>
          <FlatList
              data={events}
              renderItem={({ item }) => (
                  <EventButton event={item} deleteEvent={deleteEvent} />
              )}
              keyExtractor={(item) => item.id.toString()}
          />
          {showForm && (
              <EventForm event={event} setEvent={setEvent} onSave={handleSave} setShowForm={setShowForm} />
          )}
          <Pressable
              onPress={() => setShowForm(true)}
              style={styles.addButton}
          >
              <AntDesign
                  name='pluscircleo'
                  size={36} // Larger size
                  color='white'
              />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 20,
    },
    contentContainer: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
    },
    eventButton: {
        backgroundColor: 'white',
        padding: 10,
        marginVertical: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    eventText: {
        fontSize: 18,
    },
    eventTime: {
        fontSize: 16,
        color: 'gray',
    },
    icon: {
        marginLeft: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        marginVertical: 5,
        backgroundColor: 'white',
    },
    saveButton: {
        backgroundColor: 'blue',
        padding: 10,
        marginVertical: 5,
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
    },
    cancelButton: {
        backgroundColor: 'grey',
        padding: 10,
        marginVertical: 5,
    },
    formContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white
        padding: 20,
        borderRadius: 10,
    },
    addButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent background
        borderRadius: 50,
        padding: 10,
    },
    loadingScreen: {
        flex: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
});