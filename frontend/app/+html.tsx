import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

/**
 * This file is web-only and used to configure the root HTML for every web page during static rendering.
 * The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* SEO */}
        <title>Looper - Free Multi-Track Audio Mixing App</title>
        <meta
          name="description"
          content="Record, import, and mix unlimited audio tracks with independent speed and volume controls. Export high-quality MP3/WAV files. Free, works offline."
        />
        <link rel="canonical" href="https://looper.hatstack.fun/" />
        <meta name="robots" content="index, follow" />
        <meta
          property="og:title"
          content="Looper - Free Multi-Track Audio Mixing App"
        />
        <meta
          property="og:description"
          content="Record, import, and mix audio tracks. Export MP3/WAV. Free & offline."
        />
        <meta property="og:url" content="https://looper.hatstack.fun/" />
        <meta
          property="og:image"
          content="https://looper.hatstack.fun/og-image.jpg"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #121212;
}`;
