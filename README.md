# Asset Compare Git Webpack Plugin

A zero configuration webpack plugin that compares the generated asset sizes of any given pull request/branch against those of master as part of a CI build.

> NOTE: Currently Travis and Github actions are the only CI environments supported

## Install

```bash
npm install --save-dev asset-compare-git-webpack-plugin
```

## Usage

In your `webpack.config.js`

```javascript
var AssetComparePlugin = require('asset-compare-git-webpack-plugin');

module.exports = {
    // ...
    plugins: [
      new AssetComparePlugin()
    ]
};
```
- The plugin automatically detects which CI environment it is running in(via default environment variables that the CI sets) and logs a table in the CI console comparing the asset sizes of the current build against those of master.
- It also creates a status check againt the last commit(of the pr/branch) which triggered the build. The check is a failure if any of the asset sizes has increased by more than 5% and a success otherwise.
- The asset sizes of master are obtained from a json file(`webpack-asset-sizes.json`) that this plugin maintains on the master branch of your repo.
- When a pr containing this plugin integration is merged into your master branch for the first time, it creates this json file.
- Every consequent pull request merge/push into master branch will keep updating this json file.

### Note

The only thing required for this plugin to work is a personal access token from github.
The plugin expects to find this in the `GITHUB_PERSONAL_TOKEN` environment variable
>The access token must have permissions to read/write from/into the repo.
