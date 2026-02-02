/**
 * TrackList Component
 *
 * Displays a scrollable list of tracks using FlatList
 * - Renders TrackListItem for each track
 * - Shows empty state when no tracks
 * - Optimized for performance with many tracks
 */

import React, { useCallback } from "react";
import { FlatList, View, Text } from "react-native";
import { TrackListItem } from "../TrackListItem";
import { useTrackStore } from "../../store/useTrackStore";
import type { Track } from "../../types";
import { styles } from "./TrackList.styles";

/** Estimated item height for getItemLayout optimization */
const ITEM_HEIGHT = 144; // padding (16) + margin (8) + content (~120)

export interface TrackListProps {
  tracks: Track[];
  onPlay?: (trackId: string) => void;
  onPause?: (trackId: string) => void;
  onDelete?: (trackId: string) => void;
  onVolumeChange?: (trackId: string, volume: number) => void;
  onSpeedChange?: (trackId: string, speed: number) => void;
  onSelect?: (trackId: string) => void;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  onPlay,
  onPause,
  onDelete,
  onVolumeChange,
  onSpeedChange,
  onSelect,
}) => {
  // Get master loop duration once at list level (avoids N selector calls in items)
  const masterLoopDuration = useTrackStore((state) =>
    state.getMasterLoopDuration(),
  );

  const renderItem = useCallback(
    ({ item }: { item: Track }) => (
      <TrackListItem
        track={item}
        masterLoopDuration={masterLoopDuration}
        onPlay={onPlay}
        onPause={onPause}
        onDelete={onDelete}
        onVolumeChange={onVolumeChange}
        onSpeedChange={onSpeedChange}
        onSelect={onSelect}
      />
    ),
    [
      masterLoopDuration,
      onPlay,
      onPause,
      onDelete,
      onVolumeChange,
      onSpeedChange,
      onSelect,
    ],
  );

  const renderEmptyState = useCallback(
    () => (
      <View
        style={styles.emptyContainer}
        accessibilityRole="text"
        accessibilityLabel="No tracks yet. Record audio or import tracks to get started"
      >
        <Text style={styles.emptyTitle} accessibilityRole="header">
          No tracks yet
        </Text>
        <Text style={styles.emptySubtitle}>
          Record audio or import tracks to get started
        </Text>
      </View>
    ),
    [],
  );

  /**
   * getItemLayout optimization for faster scroll and initial render.
   * Requires consistent item height.
   */
  const getItemLayout = useCallback(
    (_data: ArrayLike<Track> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  const keyExtractor = useCallback((item: Track) => item.id, []);

  return (
    <FlatList
      data={tracks}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      ListEmptyComponent={renderEmptyState}
      contentContainerStyle={tracks.length === 0 ? styles.emptyList : undefined}
      // Performance optimizations
      windowSize={10}
      maxToRenderPerBatch={5}
      updateCellsBatchingPeriod={50}
      removeClippedSubviews={true}
    />
  );
};
