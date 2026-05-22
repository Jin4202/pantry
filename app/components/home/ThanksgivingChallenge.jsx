import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CenteredContainer from '../common/CenteredContainer';

// --- Default Tasks (unchanged) ---
const THANKSGIVING_TASKS = [
  { id: 'task1', title: 'Share a comfort food memory', description: 'Post one photo or story about a comfort food that makes you feel grateful (no recipe needed—just the memory).' },
  { id: 'task2', title: 'Cook one small thing just for yourself', description: 'Make a simple warm drink, toast, or snack this week—no sharing required, no photo needed unless you want to.' },
  { id: 'task3', title: 'Try one ingredient you\'re thankful for', description: 'Pick one ingredient you appreciate (seasonal produce, a pantry staple, etc.) and use it in any simple way this week—share what you made or just check it off.' },
  { id: 'task4', title: 'Give a cooking encouragement', description: 'Comment on someone else\'s post with something supportive—a compliment, a "me too," or a simple emoji.' },
  { id: 'task5', title: 'Communnity check in', description: 'Share what you cooked, ate, or thought about this week in one of your communities—extra credit for Thanksgiving vibes! No community yet? Join one or start your own.' },
];

// --- Custom Tasks (editable slots) ---
const INITIAL_CUSTOM_SLOTS = [
  { id: 'custom_slot_1', title: 'Task 1: Enter your goal here...', description: '' },
  { id: 'custom_slot_2', title: 'Task 2: Enter your goal here...', description: '' },
  { id: 'custom_slot_3', title: 'Task 3: Enter your goal here...', description: '' },
  { id: 'custom_slot_4', title: 'Task 4: Enter your goal here...', description: '' },
  { id: 'custom_slot_5', title: 'Task 5: Enter your goal here...', description: '' },
];

const PLACEHOLDER_TEXT = 'Enter your goal here...';

/**
 * Challenge component with two exclusive modes: Default or Customizable.
 * @param {'default' | 'custom'} challengeMode - Determines which task list to show.
 * @param {Array<object>} customTasks - Array of user-defined tasks (only used in 'custom' mode).
 * @param {Array<string>} completedTasks - Array of completed task IDs.
 * @param {function} onTaskToggle - Handler for toggling task completion status.
 * @param {function} onSaveCustomTasks - Handler to save the updated list of custom tasks to Firestore.
 */
const ThanksgivingChallenge = ({ 
  challengeMode = 'default', 
  customTasks = [], 
  completedTasks = [], 
  onTaskToggle, 
  onSaveCustomTasks 
}) => {
  const [expanded, setExpanded] = useState({});
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

  // Determine the active list based on the mode
  const isCustomMode = challengeMode === 'custom';
  let activeTasks;

  if (isCustomMode) {
    // If customTasks is empty (first time), use the initial slots. Otherwise, use the persisted list.
    activeTasks = customTasks.length > 0 ? customTasks : INITIAL_CUSTOM_SLOTS;
  } else {
    activeTasks = THANKSGIVING_TASKS;
  }

  const totalTasks = activeTasks.length;
  const activeTaskIds = activeTasks.map(task => task.id);
  const completedCount = completedTasks.filter(id => activeTaskIds.includes(id)).length;

  const toggleExpand = (taskId) => {
    setExpanded(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleTaskToggle = (taskId) => {
    const task = activeTasks.find(t => t.id === taskId);
    if (isCustomMode && task.title.includes(PLACEHOLDER_TEXT)) {
      console.log("Cannot complete a task with placeholder text.");
      return;
    }
    if (onTaskToggle) {
      onTaskToggle(taskId);
    }
  };

  // --- Custom Task Editing Handlers ---

  const handleEditTitle = (task) => {
    const tasksToEdit = customTasks.length > 0 ? customTasks : INITIAL_CUSTOM_SLOTS;
    
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);

    if (customTasks.length === 0 && onSaveCustomTasks) {
      onSaveCustomTasks(tasksToEdit);
    }
  };

const handleSaveTitle = (taskId) => {
  if (!onSaveCustomTasks) {
    setEditingTaskId(null); 
    return;
  }

  const tasksToUpdate = customTasks.length > 0 ? customTasks : INITIAL_CUSTOM_SLOTS;
  const updatedTasks = tasksToUpdate.map(task => {
    if (task.id === taskId) {
      const newTitle = editingTaskTitle.trim() || `Task ${taskId.slice(-1)}: Enter your goal here...`;
      return { ...task, title: newTitle };
    }
    return task;
  });

  onSaveCustomTasks(updatedTasks);
  setEditingTaskId(null);
};

  // --- Rendering ---
  return (
    <CenteredContainer style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🍂 Thanksgiving Challenge</Text>
        <Text style={styles.subtitle}>
          {isCustomMode 
            ? 'Define and complete 5 of your own low-pressure cooking goals this holiday to earn a specical holiday badge!' 
            : 'Complete simple, low-pressure tasks this holiday to earn a specical holiday badge!'
          }
        </Text>
        <Text style={styles.progress}>{completedCount}/{totalTasks} completed</Text>
      </View>
      {/* RENDER ACTIVE TASKS */}
      {activeTasks.map((task) => {
        const isCompleted = completedTasks.includes(task.id);
        const isEditing = isCustomMode && editingTaskId === task.id; // Only allow editing in custom mode
        
        const isExpanded = expanded[task.id];
        const canExpand = !!task.description && !isCustomMode; // Only default tasks can expand
        
        const isPlaceholder = isCustomMode && task.title.includes(PLACEHOLDER_TEXT);
        const checkboxDisabled = isPlaceholder || isEditing;

        return (
          <View key={task.id} style={styles.taskContainer}>
            <View style={styles.taskHeader}>
              <TouchableOpacity
                style={[styles.checkbox, isCompleted && styles.checkboxCompleted, checkboxDisabled && styles.checkboxDisabled]}
                onPress={() => handleTaskToggle(task.id)}
              >
                {isCompleted && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              
              <View style={styles.taskTextContainer}>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editingTaskTitle}
                    onChangeText={setEditingTaskTitle}
                    autoFocus
                    onBlur={() => handleSaveTitle(task.id)} 
                    onSubmitEditing={() => handleSaveTitle(task.id)}
                  />
                ) : (
                  <TouchableOpacity 
                    onPress={isCustomMode ? () => handleEditTitle(task) : () => toggleExpand(task.id)}
                    style={styles.taskTitleWrapper}
                  >
                    <Text style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted, isPlaceholder && styles.taskTitlePlaceholder]}>
                      {task.title}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Action Icons / Expand Icon */}
              <View style={styles.actionIcons}>
                {isCustomMode && !isEditing && (
                  <TouchableOpacity onPress={() => handleEditTitle(task)} style={styles.actionButton}>
                      <Ionicons name="pencil-outline" size={18} color="#f97316" />
                  </TouchableOpacity>
                )}
                {canExpand && (
                  <TouchableOpacity onPress={() => toggleExpand(task.id)}>
                    <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            {/* Description (Only shows for default/expandable tasks) */}
            {isExpanded && canExpand && (
              <Text style={styles.taskDescription}>{task.description}</Text>
            )}
          </View>
        );
      })}
    </CenteredContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF8F0',
    borderColor: '#FFD4B8',
    borderWidth: 2,
    borderRadius: 12,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f97316',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#4a4a4a',
    marginBottom: 8,
  },
  progress: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f97316',
  },
  
  // Task List Styles
  taskContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE5CC',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#f97316',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#f97316',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskTextContainer: {
    flex: 1,
  },
  taskTitleWrapper: {
    paddingVertical: 4,
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111216',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButton: {
    marginLeft: 10,
  },
  expandIcon: {
    fontSize: 12,
    color: '#f97316',
    marginLeft: 8,
  },
  taskDescription: {
    fontSize: 13,
    color: '#5a5a5a',
    marginTop: 8,
    marginLeft: 36,
    lineHeight: 18,
  },
  editInput: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111216',
    backgroundColor: '#fef3c7', // light yellow background for editing
    borderRadius: 4,
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#FFA500',
  },
  checkboxDisabled: {
    borderColor: '#CCC',
    backgroundColor: '#F5F5F5',
  },
  taskTitlePlaceholder: {
    color: '#A0A0A0', 
    fontStyle: 'italic',
  },
});

export default ThanksgivingChallenge;