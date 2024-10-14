import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { Task } from '@/utils/types';
import { generateUUID } from '@/utils/generateUUID';
import { Button, Card, TextInput, List, Checkbox, Menu, Appbar } from 'react-native-paper';

export default function TaskManager() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [viewTasks, setViewTasks] = useState<Task[]>(tasks);
    const [newTaskTitle, setNewTaskTitle] = useState<string>('');
    const [editingTask, setEditingTask] = useState<{ id: string; title: string } | null>(null);
    const [filter, setFilter] = useState<string>('All');
    const [menuVisible, setMenuVisible] = useState(false);


    useEffect(() => {
        loadTasksFromStorage();
    }, []);

    useEffect(() => {
        const filtered = filterTasks();
        setViewTasks(filtered);
    }, [tasks, filter]);

    const loadTasksFromStorage = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem('@tasks');
            const storedTasks = jsonValue != null ? JSON.parse(jsonValue) : [];
            setTasks(storedTasks);
        } catch (e) {
            console.error('Error loading tasks', e);
        }
    };

    const saveTasksToStorage = async (tasks: Task[]) => {
        try {
            const jsonValue = JSON.stringify(tasks);
            await AsyncStorage.setItem('@tasks', jsonValue);
        } catch (e) {
            console.error('Error saving tasks', e);
        }
    };

    const handleTaskChange = (updatedTasks: Task[]) => {
        setTasks(updatedTasks);
        saveTasksToStorage(updatedTasks);
    };

    const addTask = () => {
        const trimmedTitle = newTaskTitle.trim();
        if (!trimmedTitle) return;

        const newTask: Task = { id: generateUUID(), title: newTaskTitle, completed: false };
        handleTaskChange([...tasks, newTask]);
        setNewTaskTitle('');
    };

    const deleteTask = (taskId: string) => {
        handleTaskChange(tasks.filter(task => task.id !== taskId));
    };

    const editTask = (id: string, title: string) => {
        handleTaskChange(tasks.map(task => (task.id === id ? { ...task, title } : task)));
        setEditingTask(null);
    };

    const startEditingTask = (taskId: string, currentTitle: string) => {
        setEditingTask({ id: taskId, title: currentTitle });
    };

    const toggleTaskCompletion = (taskId: string) => {
        handleTaskChange(tasks.map(task => (task.id === taskId ? { ...task, completed: !task.completed } : task)));
    };

    const reorderTasks = (data: Task[]) => {
        handleTaskChange(data);
    };

    const filterTasks = () => {
        return tasks.filter(task => {
            if (filter === 'All') return true;
            return filter === 'Completed' ? task.completed : !task.completed;
        });
    };

    const renderTaskItem = ({ item, drag }: { item: Task; drag: () => void }) => (
        <Card style={styles.taskCard} onLongPress={drag}>
            <Card.Content>
                {editingTask?.id === item.id ? (
                    <TextInput
                        label="Edit task"
                        value={editingTask.title}
                        onChangeText={title => setEditingTask({ ...editingTask, title })}
                        mode="outlined"
                    />
                ) : (
                    <List.Item
                        title={item.title}
                        titleStyle={{ textDecorationLine: item.completed ? 'line-through' : 'none' }}
                        left={() => (
                            <Checkbox
                                status={item.completed ? 'checked' : 'unchecked'}
                                onPress={() => toggleTaskCompletion(item.id)}
                            />
                        )}
                    />
                )}
            </Card.Content>
            <Card.Actions>
                {editingTask?.id === item.id ? (
                    <Button onPress={() => editTask(item.id, editingTask.title)}>Save</Button>
                ) : (
                    <Button onPress={() => startEditingTask(item.id, item.title)}>Edit</Button>
                )}
                <Button onPress={() => deleteTask(item.id)}>Delete</Button>
            </Card.Actions>
        </Card>
    );

    return (
        <View style={styles.container}>
            {/* Filter Dropdown */}
            <Appbar.Header>
                <Appbar.Content title="Task Manager" />
                <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={
                        <Appbar.Action icon="filter" color="black" onPress={() => setMenuVisible(true)} />
                    }
                >
                    {['All', 'Completed', 'Incompleted'].map(option => (
                        <Menu.Item
                            key={option}
                            onPress={() => {
                                setFilter(option);
                                setMenuVisible(false);
                            }}
                            title={option}
                        />
                    ))}
                </Menu>
            </Appbar.Header>

            {/* Task Input */}
            <TextInput
                label="Enter task"
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                mode="outlined"
                style={styles.input}
            />
            <Button style={styles.button} mode="contained" onPress={addTask}>
                Add Task
            </Button>

            {/* Draggable Task List */}
            <DraggableFlatList
                data={viewTasks}
                keyExtractor={(item) => item.id}
                onDragEnd={({ data }) => reorderTasks(data)}
                renderItem={renderTaskItem}
                scrollEnabled={true}
                contentContainerStyle={{ paddingBottom: 250 }}
            />

        </View>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        paddingHorizontal: 20,
        flexGrow: 1, // Allows ScrollView to expand
    },
    container: {
        paddingTop: 50,
        flexGrow: 1,
        paddingHorizontal: 20,
        height: '100%',
    },
    inputContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    input: {
        marginBottom: 10,
    },
    button: {
        marginBottom: 10,
    },
    taskCard: {
        marginVertical: 10,
    },
    listContainer: {
        paddingBottom: 30, // Ensures there's space at the bottom after scrolling
    },
});