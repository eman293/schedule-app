import { StatusBar } from 'expo-status-bar';
import { FlatList, StyleSheet, Text, View, Pressable, Alert, TextInput } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect } from 'react';
import { AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DateTimePickerModal } from 'react-native-modal-datetime-picker';

// Initialize the database
async function initializeDatabase(db) {
    try {
        await db.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT,
                time TEXT,
                year TEXT,
                month TEXT,
                day TEXT
            );
        `);
        console.log('Database initialized');
        const everything = await db.getAllAsync('SELECT * FROM events');
        console.log(everything);
    } catch (error) {
        console.log('Error while initializing database: ', error);
    }
}

// Format time in 12-hour format with AM/PM
const formatTime = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${period}`;
};

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

    // Determine font size based on description length
    const fontSize = event.description.length > 50 ? 14 : 18;

    return (
        <View style={styles.eventButton}>
            <View style={styles.descriptionContainer}>
                <Text style={[styles.eventText, { fontSize }]}>{event.description}</Text>
            </View>
            <Text style={styles.eventTime}>{formatTime(event.time)}</Text>
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
    const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

    const handleConfirm = (time) => {
        const hours = time.getHours();
        const minutes = time.getMinutes();
        const formattedTime = `${hours}:${minutes < 10 ? `0${minutes}` : minutes}`;
        setEvent({ ...event, time: formattedTime });
        setTimePickerVisibility(false);
    };

    const handleChangeDescription = (text) => {
        setEvent({ ...event, description: text });
    };

    return (
        <View style={styles.formContainer}>
            <TextInput
                style={styles.input}
                placeholder='Event description'
                value={event.description}
                onChangeText={handleChangeDescription}
                multiline
                numberOfLines={4}
            />
            <Pressable
                onPress={() => setTimePickerVisibility(true)}
                style={styles.input}
            >
                <Text style={styles.inputText}>
                    {event.time ? formatTime(event.time) : 'Select Time'}
                </Text>
            </Pressable>
            <DateTimePickerModal
                isVisible={isTimePickerVisible}
                mode="time"
                onConfirm={handleConfirm}
                onCancel={() => setTimePickerVisibility(false)}
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

// Content Component
const Content = ({ selectedDate, setSelectedDate }) => {
    const db = useSQLiteContext();
    const [events, setEvents] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [event, setEvent] = useState({ id: 0, description: '', time: '', year: '', month: '', day: '' });
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    const handleSave = () => {
        if (event.description.length === 0 || event.time.length === 0) {
            Alert.alert('Attention', 'Please enter all the data!');
        } else {
            addEvent(event);
            setEvent({ id: 0, description: '', time: '', year: '', month: '', day: '' });
            setShowForm(false);
        }
    };

    const getEvents = async () => {
        try {
            const year = selectedDate.getFullYear().toString();
            const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
            const day = selectedDate.getDate().toString().padStart(2, '0');
            const allRows = await db.getAllAsync('SELECT * FROM events WHERE year = ? AND month = ? AND day = ?', [year, month, day]);
            setEvents(allRows);
        } catch (error) {
            console.log('Error while loading events: ', error);
        }
    };

    const addEvent = async (newEvent) => {
        try {
            const statement = await db.prepareAsync('INSERT INTO events (description, time, year, month, day) VALUES (?,?,?,?,?)');
            const date = selectedDate;
            await statement.executeAsync([
                newEvent.description,
                newEvent.time,
                date.getFullYear().toString(), // year
                (date.getMonth() + 1).toString().padStart(2, '0'), // month
                date.getDate().toString().padStart(2, '0') // day
            ]);
            await getEvents(); // Refresh events after adding a new one
        } catch (error) {
            console.log('Error while adding event: ', error);
        }
    };

    const deleteEvent = async (id) => {
        try {
            await db.runAsync('DELETE FROM events WHERE id = ?', [id]);
            await getEvents(); // Refresh events after deletion
        } catch (error) {
            console.log('Error while deleting the event: ', error);
        }
    };

    const handleDateConfirm = (date) => {
        setSelectedDate(date);
        setDatePickerVisibility(false);
    };

    useEffect(() => {
        getEvents();
    }, [selectedDate]);

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
            <Pressable
                onPress={() => setDatePickerVisibility(true)}
                style={styles.dateButton}
            >
                <Text style={styles.dateButtonText}>Change Date</Text>
            </Pressable>
            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleDateConfirm}
                onCancel={() => setDatePickerVisibility(false)}
            />
        </View>
    );
};

// Main App Component
export default function App() {
    const [selectedDate, setSelectedDate] = useState(new Date());

    return (
        <SQLiteProvider databaseName='example.db' onInit={initializeDatabase}>
            <LinearGradient
                colors={['#d5edff', '#004a82']}
                style={styles.gradient}
            >
                <View style={styles.container}>
                    <Text style={styles.title}>Schedule For {selectedDate.toLocaleDateString()}</Text>
                    <Content selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                    <StatusBar style="auto" />
                </View>
            </LinearGradient>
        </SQLiteProvider>
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
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
    },
    descriptionContainer: {
        flex: 1,
        marginRight: 10,
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
    inputText: {
        fontSize: 18,
        color: 'black',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
    },
    addButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent background
        borderRadius: 50,
        padding: 10,
    },
    dateButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent background
        borderRadius: 50,
        padding: 10,
    },
    dateButtonText: {
        color: 'white',
        fontSize: 18,
    },
});

//adb logcat