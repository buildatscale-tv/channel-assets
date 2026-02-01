import { Config } from "@remotion/cli/config";
import { config } from "dotenv";
import webpack from "webpack";

config();

Config.setOverwriteOutput(true);

Config.overrideWebpackConfig((currentConfig) => {
  return {
    ...currentConfig,
    plugins: [
      ...(currentConfig.plugins ?? []),
      new webpack.DefinePlugin({
        "process.env.YOUTUBE_API_KEY": JSON.stringify(
          process.env.YOUTUBE_API_KEY,
        ),
        "process.env.YOUTUBE_CHANNEL_ID": JSON.stringify(
          process.env.YOUTUBE_CHANNEL_ID,
        ),
      }),
    ],
  };
});
