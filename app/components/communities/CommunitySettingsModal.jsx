import { Ionicons } from '@expo/vector-icons';
import { Alert, Modal, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CommunitySettingsModal = ({ 
  isVisible, 
  onClose, 
  communityName,
  inviteCode,
  isCreator,
  isAdmin,
  onLeaveCommunity, // For regular member or non-creator admin leaving
  onStepDownAdmin, // For non-creator admin demotion
}) => {
  
  // --- Share Logic ---
  const handleShare = async () => {
    try {
      if (!inviteCode) {
        Alert.alert("Error", "Invite code is not available for this community.");
        return;
      }
      const message = 
        `Join my private community, **${communityName}**, on the app! ` + 
        `Use this secret invite code: **${inviteCode}**`;
      
      await Share.share({ message, title: `Invite to ${communityName}` });
    } catch (error) {
      Alert.alert('Share Error', 'Could not initiate sharing.');
    }
  };

  // --- Render Dynamic Options ---
  const renderOptions = () => {
    let options = [];
    
    // 1. ADMIN/CREATOR OPTIONS (View Invite Code)
    if (isAdmin || isCreator) {
      if (inviteCode) {
         options.push(
            <View key="invite-code" style={modalStyles.codeContainer}>
                <Text style={modalStyles.codeLabel}>INVITE CODE</Text>
                <Text style={modalStyles.codeText}>{inviteCode}</Text>
            </View>
        );
        options.push(
          <SettingButton 
            key="share"
            icon="share-social-outline"
            label="Share Invite Code"
            onPress={handleShare}
            color="#ff4d2d"
          />
        );
      }
    }
    
    // 2. ADMIN (NON-CREATOR) OPTIONS
    if (isAdmin && !isCreator) {
      options.push(
        <SettingButton 
          key="step-down"
          icon="arrow-down-circle-outline"
          label="Step Down as Admin"
          onPress={onStepDownAdmin}
          color="#3b82f6"
        />
      );
    }

    // 3. ALL MEMBERS (Except Creator) CAN LEAVE
    if (!isCreator) {
      options.push(
        <SettingButton 
          key="leave"
          icon="exit-outline"
          label="Leave Community"
          onPress={onLeaveCommunity}
          color="#dc2626" // Red for destructive action
        />
      );
    } else {
        options.push(
             <Text key="creator-note" style={modalStyles.creatorNote}>
                As the community creator, you manage all permissions and cannot leave.
             </Text>
        );
    }

    return options;
  };

  return (
    <Modal animationType="fade" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.container}>
          
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>{communityName} Settings</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <Ionicons name="close" size={28} color="#111216" />
            </TouchableOpacity>
          </View>
          
          {renderOptions()}
          
        </View>
      </View>
    </Modal>
  );
};

// Helper component for uniform buttons
const SettingButton = ({ icon, label, onPress, color }) => (
    <TouchableOpacity style={[modalStyles.button, { borderColor: color + '30' }]} onPress={onPress}>
        <Ionicons name={icon} size={22} color={color} style={modalStyles.buttonIcon} />
        <Text style={[modalStyles.buttonText, { color: color }]}>{label}</Text>
    </TouchableOpacity>
);


const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    width: '85%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111216',
  },
  closeButton: { padding: 5 },
  
  // Invite Code Styles
  codeContainer: {
    backgroundColor: '#fff7f7', // Light red background
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff4d2d60',
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff4d2d',
    marginBottom: 5,
  },
  codeText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#111216',
  },

  // Button Styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f9fafb',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  buttonIcon: { marginRight: 15 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  creatorNote: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  }
});

export default CommunitySettingsModal;