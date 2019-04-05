const _ = require('lodash');
const Octokit = require('@octokit/rest');

class RevisedAssetsHelper {
  constructor(opts) {
    _.assign(this, {
      octokit: new Octokit({
        auth: opts.github_access_token
      }),
      owner: opts.owner,
      repo: opts.repo,
      commit_sha: opts.commit_sha,
      status_url: opts.status_url,
      log: opts.log
    });
  }

  updateStatus(new_status) {
    return this.octokit.repos.createStatus({
      owner: this.owner,
      repo: this.repo,
      sha: this.commit_sha,
      state: new_status,
      target_url: this.status_url,
      description: new_status === "error"? "The sizes of one or more assets have increased by at least 5%": "None of the asset sizes have increased by more than 5%",
      context: "asset-sizes"
    })
    .catch((err) => {
      this.log(err, 'warning');
    })
  }

}
module.exports = RevisedAssetsHelper;