import { setUserProperties } from 'firebase/analytics';
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { analytics, auth, db } from '../../firebaseConfig';
import logEvent from '../utils/analytics';
import { getStartOfWeek, requiresGoalSetting } from '../utils/badgeCalculations';

import CenteredContainer from '../components/common/CenteredContainer';
import PageHeader from '../components/common/PageHeader';
import PostCard from '../components/common/PostCard';
import InitialSetupModal from '../components/home/InitialSetupModal';
import PersonalGreeting from '../components/home/PersonalGreeting';
import PromptCard from '../components/home/PromptCard';
import ThanksgivingChallenge from '../components/home/ThanksgivingChallenge';
import WeeklyGoalSetter from '../components/home/WeeklyGoalSetter';

const INTERNAL_TESTER_UIDS = [
  "sxs1k2tZFhTy0sQ1CFYJUD9tZSY2", // jins
  "XMAjQ3JzOdbOvAv2mlsgNxirdUK2", // mannu1623
  "oidjXXbQModtDgAkrvLVG3EFiUb2", // olufunmilola92
  "FtoyNcl5FNgsudn04CEyobyIpSH2", // test
  "uf6finICXxNjukDyd8ssVssx1ur2", // jin
  "hujq5wObGxdt27SDwvvPQYrXmW13", // navyag711
];

const HomeScreen = () => {
  const [feed, setFeed] = useState([]);
  const [userData, setUserData] = useState({}); 
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const userId = auth.currentUser?.uid;
  
  // ---- Thanksgiving Challenge State ----
  const [completedTasks, setCompletedTasks] = useState([]);
  const [customTaskList, setCustomTaskList] = useState([]);
  
  // 1. ---- User Data and Streak Status Subscription ----
  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);

        setCompletedTasks(data.thanksgivingChallengeTasks || []);
        setCustomTaskList(data.customChallengeTaskList || []);

        if (data.abTestGroup && data.profession) {
          setIsSetupComplete(true);
        } else {
          setIsSetupComplete(false);
        }
      }
    });
    return unsub;
  }, [userId]);

  // 2. ---- Analytics Tagging ----
  useEffect(() => {
    // Only run if the user is logged in
    if (!userId) return;

    // Check if the current user ID is in the list of known internal testers
    if (INTERNAL_TESTER_UIDS.includes(userId)) {
      // Set the custom user property to tag this user's traffic
      setUserProperties(analytics, {
        internal_tester: 'Internal'
      });
      console.log(`[Analytics] User ${userId} tagged as internal_tester.`);
    }
    // Dependency array ensures this runs once when userId is available
  }, [userId]);

  // 3. ---- Feed Subscription ----
  useEffect(() => {
     const q = query(
      collection(db, 'feed'), 
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setFeed(items);
    });
    return unsub;
  }, []);

  useEffect(() => {
    logEvent("view_home");
  }, []);

  // ---- Goal Submission Handler ----
  const handleGoalSubmit = async (goal) => {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    const sundayMidnight = getStartOfWeek(new Date());
    
    try {
      await updateDoc(userRef, {
        weeklyGoal: goal,
        streakStartDate: sundayMidnight, 
        currentWeekPosts: 0, 
        streakCount: userData.streakCount || 0,
        hasGoalBeenMetThisWeek: false,
      });
      console.log("Weekly goal set successfully!");
    } catch (error) {
      console.error("Error setting weekly goal:", error);
    }
  };

  const handleSaveCustomTasks = async (newTasksList) => {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);

    try {
      await updateDoc(userRef, {
        customChallengeTaskList: newTasksList,
      });
      console.log("Custom challenge task list saved successfully! UI update handled by listener.");
    } catch (error) {
      console.error("Error saving custom challenge tasks:", error);
    }
  };

  // ---- Thanksgiving Challenge Task Toggle Handler ----
  const handleTaskToggle = async (taskId) => {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    let updatedTasks;

    if (completedTasks.includes(taskId)) {
      // Remove task from completed list
      updatedTasks = completedTasks.filter(id => id !== taskId);
    } else {
      // Add task to completed list
      updatedTasks = [...completedTasks, taskId];
    }

    setCompletedTasks(updatedTasks);

    try {
      await updateDoc(userRef, {
        thanksgivingChallengeTasks: updatedTasks,
      });
      console.log("Thanksgiving challenge task updated!");
    } catch (error) {
      console.error("Error updating Thanksgiving challenge task:", error);
      // Revert on error
      setCompletedTasks(completedTasks);
    }
  };

  const isCustomChallengeUser = userData.abTestGroup === "Group A"; // Group A is custom tasks
  const currentChallengeMode = isCustomChallengeUser ? 'custom' : 'default';

  const showGoalSetter = requiresGoalSetting(userData);
  const handleInitialSetupComplete = () => {setIsSetupComplete(true)};

  const renderPosts = ({ item }) => <PostCard item={item} />;
  const renderHeader = () => (
    <View>
      <PageHeader />
      <PersonalGreeting/>
      <ThanksgivingChallenge 
        challengeMode={currentChallengeMode} 
        customTasks={customTaskList} 
        completedTasks={completedTasks}
        onTaskToggle={handleTaskToggle}
        onSaveCustomTasks={handleSaveCustomTasks}
      />
      {showGoalSetter ? (
        <WeeklyGoalSetter onSubmitGoal={handleGoalSubmit} />
      ) : (
        <PromptCard />
      )}
      {/* <ChallengeSection /> */}
      {/* <FriendActivityCard/> */}
      <CenteredContainer>
        <Text style={styles.feedHeader}>Community Updates</Text>
      </CenteredContainer>
    </View>
  );
  
  // ---- Layout ----

  if (!isSetupComplete) return <InitialSetupModal onSetupComplete={handleInitialSetupComplete} />;

  return (
    <View style={styles.screenContainer}>
      <FlatList
        data={feed}
        keyExtractor={(it) => it.id}
        renderItem={renderPosts}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: 'white', paddingHorizontal: 24 },
  feedHeader: { fontSize: 20, fontWeight: '800', marginVertical: 10 },
});

export default HomeScreen;
