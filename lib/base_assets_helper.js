const _ = require('lodash');
const Octokit = require('@octokit/rest');

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

  _getFileName() {
    return `${this.opts.repo}-${this.opts.base_branch}-webpack-build-sizes.json`;
  }

  getAssets() {
    return this.octokit.gists.get({
      gist_id: this.opts.gist_id
    }).then((response) => {
      return JSON.parse(response.data.files[this._getFileName()].content);
    }).catch((err) => {
      this.log(err, 'warning');
    })
  }

  updateAssets(new_stats) {
    return this.octokit.gists.update({
      gist_id: this.opts.gist_id,
      description: "Update base branch asset sizes",
      files: {
        [this._getFileName()]: {
          content: JSON.stringify(new_stats)
        }
      }
    }).catch((err) => {
      this.log(err, 'warning');
    })
  }

}

module.exports = BaseAssetsHelper;