import React from "react";
import { Composition } from "remotion";
import { YouTubeCTA, YouTubeCTAProps } from "./YouTubeCTA";

const calculateMetadata = async (): Promise<{ props: YouTubeCTAProps }> => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey || apiKey === "your_api_key_here") {
    throw new Error("YOUTUBE_API_KEY is not set in .env");
  }
  if (!channelId) {
    throw new Error("YOUTUBE_CHANNEL_ID is not set in .env");
  }

  const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  const count = Number(data?.items?.[0]?.statistics?.subscriberCount);

  if (isNaN(count)) {
    throw new Error(`Could not parse subscriber count from YouTube API response: ${JSON.stringify(data)}`);
  }

  console.log(`Fetched subscriber count: ${count}`);
  return { props: { subCount: count } };
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="YouTubeCTA"
      component={YouTubeCTA}
      calculateMetadata={calculateMetadata}
      defaultProps={{ subCount: 0 }}
      durationInFrames={181}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
