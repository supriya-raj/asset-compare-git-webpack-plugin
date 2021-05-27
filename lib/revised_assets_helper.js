const _ = require('lodash');
const Octokit = require('@octokit/rest').Octokit;

class RevisedAssetsHelper {
  constructor(opts, log) {
    _.assign(this, {
      octokit: new Octokit({
        auth: opts.github_access_token
      }),
      opts,
      log
    });
  }

  updateStatus(new_status) {
    return this.octokit.repos.createCommitStatus({
      owner: this.opts.owner,
      repo: this.opts.repo,
      sha: this.opts.commit_sha,
      state: new_status,
      target_url: this.opts.build_url,
      description: new_status === "error" ? "The sizes of one or more assets have increased by at least 5%" : "None of the asset sizes have increased by more than 5%",
      context: "asset-sizes"
    }).catch((err) => {
      this.log(err, 'warning');
    })
  }

}
module.exports = RevisedAssetsHelper;