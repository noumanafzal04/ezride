module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // laravel-echo v2's build uses static class blocks — enable the transform
  plugins: ['@babel/plugin-transform-class-static-block'],
};
