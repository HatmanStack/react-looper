/**
 * HelpModal Component
 *
 * Displays help information about how to use the looper app
 */

import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Modal, Portal, IconButton } from "react-native-paper";
import { styles } from "./HelpModal.styles";

export interface HelpModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ visible, onDismiss }) => {
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <ScrollView>
          <View style={styles.header}>
            <Text style={styles.title}>How to Use Looper</Text>
            <IconButton
              icon="close"
              size={24}
              onPress={onDismiss}
              iconColor="#FFFFFF"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📼 Recording Tracks</Text>
            <Text style={styles.text}>
              • First track sets the base loop length{"\n"}• Subsequent tracks
              snap to multiples (1x, 2x, 4x) of the base{"\n"}• Press Stop to
              save your recording as a track
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎵 Selecting Tracks</Text>
            <Text style={styles.text}>
              • Tap any track to select/deselect it{"\n"}• Selected tracks show
              a red border on the left{"\n"}• New tracks are automatically
              selected{"\n"}• You can select multiple tracks at once
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💾 Saving Your Mix</Text>
            <Text style={styles.text}>
              • Only selected tracks (with red border) will be saved{"\n"}•
              Click Save to mix all selected tracks together{"\n"}• The mixed
              audio downloads as a WAV file{"\n"}• Speed and volume settings are
              applied to the mix
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎚️ Controls</Text>
            <Text style={styles.text}>
              • Play/Pause: Start or stop individual tracks{"\n"}• Volume:
              Adjust track volume (0-100){"\n"}• Speed: Change playback speed
              (0.05x - 2.50x){"\n"}• Delete: Remove a track permanently
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Tips</Text>
            <Text style={styles.text}>
              • All tracks loop automatically{"\n"}• Tracks stay in sync based
              on the first loop{"\n"}• You can import existing audio files{"\n"}
              • Deselect tracks you don&apos;t want in the final mix
            </Text>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
};
