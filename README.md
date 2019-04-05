# Asset Compare Git Webpack Plugin

A webpack plugin that compares the generated asset sizes against those of a base branch as part of a CI build.

> NOTE: Currently Travis is the only CI environment that is supported

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
      new AssetComparePlugin({
        gist_id: <a github gist id>//required
      })
    ]
};
```

This will generate a table in your CI log comparing the generated asset sizes of the current build against those of a base branch(master by default). After comparison, if any of the asset sizes has increased by more than 5% a status with failure flag is created against the current commit.

- When this plugin is run against the base branch for the first time, it stores the asset sizes in the supplied gist.
- Every consequent CI run against the base branch will keep updating the stats in the gist.

### `options.gist_id`

Type: `String`<br>
Required: `True`

This is a required option for the plugin to work. Create a github gist and pass the gist_id here. This gist will be used to store/update the asset sizes of the base branch

### `options.base_branch`

Type: `String`
Default: `master`

The branch, the asset sizes of which will be used to benchmark all other builds

### `options.github_access_token`

Type: `String`<br>
Default: `env.GITHUB_ACCESS_TOKEN`

Personal access token used for performing git actions
> CAUTION: Make sure that the owner associated with this access token is also the owner of the gist that is passed to plugin. The access token must have permissions to add status updates to commits and also to update gists
