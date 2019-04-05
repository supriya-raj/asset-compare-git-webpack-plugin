const _ = require('lodash');
const Octokit = require('@octokit/rest');

class BaseAssetsHelper {
  constructor(opts) {
    _.assign(this, {
      gist_id: opts.gist_id,
      repo: opts.repo,
      base_branch: opts.base_branch,
      octokit: new Octokit({
        auth: opts.github_access_token
      }),
      log: opts.log
    });
  }

  _getFileName() {
    return `${this.repo}-${this.base_branch}-webpack-build-sizes.json`;
  }

  getContent() {
    return this.octokit.gists.get({
      gist_id: this.gist_id
    })
    .then((response) => {
      return JSON.parse(response.data.files[this._getFileName()].content);
    })
    .catch((err) => {
      this.log(err, 'warning');
    })
  }

  updateContent(new_content) {
    return this.octokit.gists.update({
      gist_id: this.gist_id,
      description: "Update base branch asset sizes",
      files: {
        [this._getFileName()]: {
          content: JSON.stringify(new_content)
        }
      }
    })
    .catch((err) => {
      this.log(err, 'warning');
    })
  }

}
module.exports = BaseAssetsHelper;