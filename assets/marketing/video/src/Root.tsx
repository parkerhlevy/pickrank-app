import "./index.css";
import { Composition, Folder, Still } from "remotion";
import { PickRankLandingThumb } from "./compositions/PickRankLandingVideo/PickRankLandingThumb";
import {
  PICKRANK_LANDING_VIDEO_DURATION,
  PickRankLandingVideo,
} from "./compositions/PickRankLandingVideo/PickRankLandingVideo";
import { pickRankLaunchVideoData } from "./data/pickrank-launch-video";

export const RemotionRoot: React.FC = () => {
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
