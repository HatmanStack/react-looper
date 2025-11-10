/**
 * TrackList Component
 *
 * Displays a scrollable list of tracks using FlatList
 * - Renders TrackListItem for each track
 * - Shows empty state when no tracks
 * - Optimized for performance with many tracks
 */

import React from 'react';
import { FlatList, View, Text } from 'react-native';
import { TrackListItem } from '../TrackListItem';
import type { Track } from '../../types';
import { styles } from './TrackList.styles';

export interface TrackListProps {
  tracks: Track[];
  onPlay?: (trackId: string) => void;
  onPause?: (trackId: string) => void;
  onDelete?: (trackId: string) => void;
  onVolumeChange?: (trackId: string, volume: number) => void;
  onSpeedChange?: (trackId: string, speed: number) => void;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  onPlay,
  onPause,
  onDelete,
  onVolumeChange,
  onSpeedChange,
}) => {
  const renderItem = ({ item }: { item: Track }) => (
    <TrackListItem
      track={item}
      onPlay={onPlay}
      onPause={onPause}
      onDelete={onDelete}
      onVolumeChange={onVolumeChange}
      onSpeedChange={onSpeedChange}
    />
  );

  const renderEmptyState = () => (
    <View
      style={styles.emptyContainer}
      accessibilityRole="text"
      accessibilityLabel="No tracks yet. Record audio or import tracks to get started"
    >
      <Text style={styles.emptyTitle} accessibilityRole="header">
        No tracks yet
      </Text>
      <Text style={styles.emptySubtitle}>Record audio or import tracks to get started</Text>
    </View>
  );

  return (
    <FlatList
      data={tracks}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
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
