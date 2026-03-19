/**
 * SyncMenu Component
 *
 * Renders a sync icon button that opens a popover menu with multiplier options.
 * Used on non-master tracks to sync playback speed to the master loop duration.
 */

import React, { useState, useCallback } from "react";
import { View } from "react-native";
import { IconButton, Menu } from "react-native-paper";
import { getValidSyncMultipliers } from "../../utils/loopUtils";
import { styles } from "./SyncMenu.styles";

export interface SyncMenuProps {
  trackDuration: number;
  masterLoopDuration: number;
  syncMultiplier: number | null | undefined;
  onSyncSelect: (multiplier: number) => void;
  onSyncClear: () => void;
}

const SYNCED_COLOR = "#3F51B5";
const DEFAULT_COLOR = "#E1E1E1";
const ACTIVE_MULTIPLIER_COLOR = "#3F51B5";

const SyncMenuComponent: React.FC<SyncMenuProps> = ({
  trackDuration,
  masterLoopDuration,
  syncMultiplier,
  onSyncSelect,
  onSyncClear,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const isSynced = syncMultiplier != null;
  const validMultipliers = getValidSyncMultipliers(
    trackDuration,
    masterLoopDuration,
  );

  const handleOpenMenu = useCallback(() => {
    setMenuVisible(true);
  }, []);

  const handleDismissMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  const handleSelectMultiplier = useCallback(
    (value: number) => {
      onSyncSelect(value);
      setMenuVisible(false);
    },
    [onSyncSelect],
  );

  const handleUnsync = useCallback(() => {
    onSyncClear();
    setMenuVisible(false);
  }, [onSyncClear]);

  return (
    <View style={styles.container} testID="sync-menu-container">
      <Menu
        visible={menuVisible}
        onDismiss={handleDismissMenu}
        anchor={
          <IconButton
            testID="sync-button"
            icon={isSynced ? "link" : "link-off"}
            size={24}
            iconColor={isSynced ? SYNCED_COLOR : DEFAULT_COLOR}
            onPress={handleOpenMenu}
            accessibilityLabel={
              isSynced ? "Synced to master" : "Sync to master"
            }
            accessibilityHint="Open sync multiplier menu"
          />
        }
      >
        {validMultipliers.map(({ label, value }) => (
          <Menu.Item
            key={label}
            onPress={() => handleSelectMultiplier(value)}
            title={label}
            leadingIcon={
              isSynced && syncMultiplier === value ? "check" : undefined
            }
            titleStyle={
              isSynced && syncMultiplier === value
                ? { color: ACTIVE_MULTIPLIER_COLOR }
                : undefined
            }
          />
        ))}
        {isSynced && (
          <Menu.Item
            onPress={handleUnsync}
            title="Unsync"
            leadingIcon="link-off"
          />
        )}
      </Menu>
    </View>
  );
};

export const SyncMenu = React.memo(SyncMenuComponent);
SyncMenu.displayName = "SyncMenu";
