import "./index.css";
import { Composition, Folder, Still } from "remotion";
import { PickRankLandingThumb } from "./compositions/PickRankLandingVideo/PickRankLandingThumb";
import {
  PICKRANK_LANDING_VIDEO_DURATION,
  PickRankLandingVideo,
} from "./compositions/PickRankLandingVideo/PickRankLandingVideo";
import { pickRankLaunchVideoData } from "./data/pickrank-launch-video";

export const RemotionRoot: React.FC = () => {
  const designInMotionProps = {
    ...pickRankLaunchVideoData,
    audio: {
      bedFile: "audio/design-in-motion-preview.mp3",
    },
  };

  const lockedInProps = {
    ...pickRankLaunchVideoData,
    audio: {
      bedFile: "audio/locked-in-preview.mp3",
    },
  };

  return (
    <Folder name="Marketing">
      <Composition
        id="PickRankLandingVideo"
        component={PickRankLandingVideo}
        durationInFrames={PICKRANK_LANDING_VIDEO_DURATION}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={pickRankLaunchVideoData}
      />
      <Composition
        id="PickRankLandingVideoDesignInMotionReview"
        component={PickRankLandingVideo}
        durationInFrames={PICKRANK_LANDING_VIDEO_DURATION}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={designInMotionProps}
      />
      <Composition
        id="PickRankLandingVideoLockedInReview"
        component={PickRankLandingVideo}
        durationInFrames={PICKRANK_LANDING_VIDEO_DURATION}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={lockedInProps}
      />
      <Still
        id="PickRankLandingThumb"
        component={PickRankLandingThumb}
        width={1920}
        height={1080}
        defaultProps={pickRankLaunchVideoData}
      />
    </Folder>
  );
};
