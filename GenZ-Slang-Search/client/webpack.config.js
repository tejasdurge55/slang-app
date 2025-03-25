module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
        exclude: /node_modules\/@mediapipe\/tasks-vision/,
      },
    ],
  },
  ignoreWarnings: [/Failed to parse source map/],
};
