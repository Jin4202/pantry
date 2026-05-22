import { StyleSheet, View } from 'react-native';

const CenteredContainer = ({ children, style }) => {
  return (
    <View style={[styles.wrapper, style]}>
      {children}
    </View>
  )
};

const styles = StyleSheet.create({
  wrapper: {
    maxWidth: 550, // Maximum width for content
    width: '100%', // Take up 100% of available space up to maxWidth
    alignSelf: 'center', // Centers the block itself within its parent
    paddingVertical: 10, // Default Padding (You can override this with the 'style' prop if needed)
  },
});

export default CenteredContainer;