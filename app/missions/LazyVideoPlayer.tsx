"use client";

import React from "react";

type LazyVideoPlayerProps = {
  src: string;
  poster?: string;
};

const LazyVideoPlayer: React.FC<LazyVideoPlayerProps> = ({ src, poster }) => {
  return (
    <video
      controls
      poster={poster}
      style={{ width: "100%", borderRadius: "12px" }}
    >
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

export default LazyVideoPlayer;
