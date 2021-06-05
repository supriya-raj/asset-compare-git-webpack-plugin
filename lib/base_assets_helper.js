const _ = require('lodash');
const Octokit = require('@octokit/rest').Octokit;

const FILE_NAME = 'webpack-asset-sizes.json';

class BaseAssetsHelper {
  constructor(opts, log) {
    _.assign(this, {
      opts,
      octokit: new Octokit({
        auth: opts.github_access_token
      }),
      log
    });
  }

  getAssets() {
    return this.octokit.repos.getContent({
      owner: this.opts.owner,
      repo: this.opts.repo,
      path: FILE_NAME
    }).then((response) => {
      this.file_sha = response.data.sha;
      return JSON.parse(Buffer.from(response.data.content, 'base64').toString())
    }).catch((err) => {
      this.log(err, 'warning');
    })
  }

  updateAssets(new_stats) {
    return this.octokit.repos.createOrUpdateFileContents({
      owner: this.opts.owner,
      repo: this.opts.repo,
      path: FILE_NAME,
      sha: this.file_sha,
      message: "feat: Update assets",
      content: Buffer.from(JSON.stringify(new_stats)).toString("base64")
    }).catch((err) => {
      this.log(err, 'warning');
    })
  }

}

module.exports = BaseAssetsHelper;