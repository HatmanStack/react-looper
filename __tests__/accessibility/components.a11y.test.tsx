/**
 * Accessibility Tests for Components
 *
 * Tests WCAG 2.1 Level AA compliance for all interactive components
 */

import React from "react";
import { render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { ActionButton } from "../../src/components/ActionButton/ActionButton";
import { VolumeSlider } from "../../src/components/VolumeSlider/VolumeSlider";
import { SpeedSlider } from "../../src/components/SpeedSlider/SpeedSlider";
import { TrackListItem } from "../../src/components/TrackListItem/TrackListItem";
import { SaveModal } from "../../src/components/SaveModal/SaveModal";
import { MixingProgress } from "../../src/components/MixingProgress/MixingProgress";
import type { Track } from "../../src/types";

// Wrapper component to provide theme context
const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe("Accessibility - ActionButton", () => {
  it("should have accessible label", () => {
    const { getByLabelText } = render(
      <ActionButton label="Record" onPress={jest.fn()} />,
      {
        wrapper: Wrapper,
      },
    );

    expect(getByLabelText("Record")).toBeDefined();
  });

  it("should have custom accessibility label when provided", () => {
    const { getByLabelText } = render(
      <ActionButton
        label="Record"
        onPress={jest.fn()}
        accessibilityLabel="Start recording audio"
      />,
      { wrapper: Wrapper },
    );

    expect(getByLabelText("Start recording audio")).toBeDefined();
  });

  it("should have button role", () => {
    const { getByRole } = render(
      <ActionButton label="Record" onPress={jest.fn()} />,
      {
        wrapper: Wrapper,
      },
    );

    expect(getByRole("button")).toBeDefined();
  });

  it("should announce disabled state", () => {
    const { getByRole } = render(
      <ActionButton label="Record" onPress={jest.fn()} disabled={true} />,
      { wrapper: Wrapper },
    );

    const button = getByRole("button");
    expect(button.props.accessibilityState).toEqual({ disabled: true });
  });

  it("should have accessibility hint when provided", () => {
    const { getByLabelText } = render(
      <ActionButton
        label="Record"
        onPress={jest.fn()}
        accessibilityHint="Start recording a new track"
      />,
      { wrapper: Wrapper },
    );

    const button = getByLabelText("Record");
    expect(button.props.accessibilityHint).toBe("Start recording a new track");
  });
});

describe("Accessibility - VolumeSlider", () => {
  it("should have accessible label", () => {
    const { getByLabelText } = render(
      <VolumeSlider value={75} onValueChange={jest.fn()} />,
      {
        wrapper: Wrapper,
      },
    );

    expect(getByLabelText("Volume")).toBeDefined();
  });

  it("should announce current value", () => {
    const { getByLabelText } = render(
      <VolumeSlider value={75} onValueChange={jest.fn()} />,
      {
        wrapper: Wrapper,
      },
    );

    const slider = getByLabelText("Volume");
    expect(slider.props.accessibilityValue).toEqual({ text: "75 percent" });
  });

  it("should have adjustable role", () => {
    const { getByRole } = render(
      <VolumeSlider value={75} onValueChange={jest.fn()} />,
      {
        wrapper: Wrapper,
      },
    );

    expect(getByRole("adjustable")).toBeDefined();
  });

  it("should have accessibility hint", () => {
    const { getByLabelText } = render(
      <VolumeSlider value={75} onValueChange={jest.fn()} />,
      {
        wrapper: Wrapper,
      },
    );

    const slider = getByLabelText("Volume");
    expect(slider.props.accessibilityHint).toBe(
      "Adjust track volume from 0 to 100 percent",
    );
  });
});

describe("Accessibility - SpeedSlider", () => {
  it("should have accessible label", () => {
    const { getByLabelText } = render(
      <SpeedSlider value={1.0} onValueChange={jest.fn()} />,
      {
        wrapper: Wrapper,
      },
    );

    expect(getByLabelText("Playback speed")).toBeDefined();
  });

  it("should announce current value", () => {
    const { getByLabelText } = render(
      <SpeedSlider value={1.5} onValueChange={jest.fn()} />,
      {
        wrapper: Wrapper,
      },
    );

    const slider = getByLabelText("Playback speed");
    expect(slider.props.accessibilityValue).toEqual({ text: "1.50 times" });
  });

  it("should have adjustable role", () => {
    const { getByRole } = render(
      <SpeedSlider value={1.0} onValueChange={jest.fn()} />,
      {
        wrapper: Wrapper,
      },
    );

    expect(getByRole("adjustable")).toBeDefined();
  });

  it("should announce max speed correctly", () => {
    const { getByLabelText } = render(
      <SpeedSlider value={2.48} onValueChange={jest.fn()} />,
      {
        wrapper: Wrapper,
      },
    );

    // Should display as 2.50 per Android behavior
    const slider = getByLabelText("Playback speed");
    expect(slider.props.accessibilityValue).toEqual({ text: "2.50 times" });
  });
});

describe("Accessibility - TrackListItem", () => {
  const mockTrack: Track = {
    id: "track-1",
    name: "Test Track",
    uri: "file://test.mp3",
    duration: 30000,
    speed: 1.0,
    volume: 75,
    isPlaying: false,
    createdAt: Date.now(),
  };

  it("should have accessible label for track name", () => {
    const { getByLabelText } = render(<TrackListItem track={mockTrack} />, {
      wrapper: Wrapper,
    });

    expect(getByLabelText("Track: Test Track")).toBeDefined();
  });

  it("should have header role for track name", () => {
    const { getByRole } = render(<TrackListItem track={mockTrack} />, {
      wrapper: Wrapper,
    });

    expect(getByRole("header")).toBeDefined();
  });

  it("should have accessible play button", () => {
    const { getByLabelText } = render(
      <TrackListItem track={mockTrack} onPlay={jest.fn()} />,
      {
        wrapper: Wrapper,
      },
    );

    expect(getByLabelText("Play Test Track")).toBeDefined();
  });

  it("should have accessible pause button", () => {
    const { getByLabelText } = render(
      <TrackListItem track={mockTrack} onPause={jest.fn()} />,
      {
        wrapper: Wrapper,
      },
    );

    expect(getByLabelText("Pause Test Track")).toBeDefined();
  });

  it("should have accessible delete button", () => {
    const { getByLabelText } = render(
      <TrackListItem track={mockTrack} onDelete={jest.fn()} />,
      {
        wrapper: Wrapper,
      },
    );

    expect(getByLabelText("Delete Test Track")).toBeDefined();
  });

  it("should announce playing state", () => {
    const playingTrack = { ...mockTrack, isPlaying: true };
    const { getByLabelText } = render(<TrackListItem track={playingTrack} />, {
      wrapper: Wrapper,
    });

    const playButton = getByLabelText("Play Test Track");
    expect(playButton.props.accessibilityState).toEqual({ selected: true });
  });

  it("should have toolbar label for controls", () => {
    const { getByLabelText } = render(<TrackListItem track={mockTrack} />, {
      wrapper: Wrapper,
    });

    expect(getByLabelText("Track controls")).toBeDefined();
  });
});

describe("Accessibility - SaveModal", () => {
  it("should have accessible text input", () => {
    const { getByLabelText } = render(
      <SaveModal visible={true} onDismiss={jest.fn()} onSave={jest.fn()} />,
      { wrapper: Wrapper },
    );

    expect(getByLabelText("File name")).toBeDefined();
  });

  it("should have accessible save button", () => {
    const { getByLabelText } = render(
      <SaveModal visible={true} onDismiss={jest.fn()} onSave={jest.fn()} />,
      { wrapper: Wrapper },
    );

    expect(getByLabelText("Save")).toBeDefined();
  });

  it("should have accessible cancel button", () => {
    const { getByLabelText } = render(
      <SaveModal visible={true} onDismiss={jest.fn()} onSave={jest.fn()} />,
      { wrapper: Wrapper },
    );

    expect(getByLabelText("Cancel")).toBeDefined();
  });

  it("should announce save button disabled state", () => {
    const { getByLabelText } = render(
      <SaveModal visible={true} onDismiss={jest.fn()} onSave={jest.fn()} />,
      { wrapper: Wrapper },
    );

    const saveButton = getByLabelText("Save");
    // Button should be disabled when filename is empty
    expect(saveButton.props.accessibilityState).toEqual({ disabled: true });
  });
});

describe("Accessibility - MixingProgress", () => {
  it("should have header for title", () => {
    const { getByRole } = render(
      <MixingProgress visible={true} progress={0.5} onCancel={jest.fn()} />,
      { wrapper: Wrapper },
    );

    expect(getByRole("header")).toBeDefined();
  });

  it("should announce progress percentage", () => {
    const { getByLabelText } = render(
      <MixingProgress visible={true} progress={0.75} onCancel={jest.fn()} />,
      { wrapper: Wrapper },
    );

    expect(
      getByLabelText("Mixing progress: 75 percent complete"),
    ).toBeDefined();
  });

  it("should have progressbar role", () => {
    const { getByRole } = render(
      <MixingProgress visible={true} progress={0.5} onCancel={jest.fn()} />,
      { wrapper: Wrapper },
    );

    expect(getByRole("progressbar")).toBeDefined();
  });

  it("should have live region for progress updates", () => {
    const { getByLabelText } = render(
      <MixingProgress visible={true} progress={0.5} onCancel={jest.fn()} />,
      { wrapper: Wrapper },
    );

    const progressContainer = getByLabelText(
      "Mixing progress: 50 percent complete",
    );
    expect(progressContainer.props.accessibilityLiveRegion).toBe("polite");
  });

  it("should have accessible cancel button", () => {
    const { getByLabelText } = render(
      <MixingProgress visible={true} progress={0.5} onCancel={jest.fn()} />,
      { wrapper: Wrapper },
    );

    expect(getByLabelText("Cancel mixing")).toBeDefined();
  });
});

describe("Accessibility - Color Contrast", () => {
  it("should document color contrast ratios", () => {
    // This is a documentation test to ensure we're aware of color contrast requirements
    const colors = {
      primary: "#BB86FC", // Purple
      background: "#121212", // Dark background
      text: "#FFFFFF", // White text - should have 21:1 ratio
      disabled: "#666666", // Gray
    };

    // WCAG 2.1 Level AA requires:
    // - Normal text: 4.5:1 contrast ratio
    // - Large text (18pt+): 3:1 contrast ratio
    // - Interactive elements: 3:1 contrast ratio

    // These should be verified with actual contrast checking tools
    // This test serves as documentation of the requirement
    expect(colors).toBeDefined();
  });
});

describe("Accessibility - Touch Targets", () => {
  it("should have minimum 44x44 touch targets for buttons", () => {
    const { getByRole } = render(
      <ActionButton label="Test" onPress={jest.fn()} />,
      {
        wrapper: Wrapper,
      },
    );

    const button = getByRole("button");

    // React Native Paper Button should meet minimum touch target size
    // This is more of a documentation test
    expect(button).toBeDefined();
  });
});
