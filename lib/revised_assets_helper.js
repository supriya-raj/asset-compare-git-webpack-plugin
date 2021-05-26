const _ = require('lodash');
const Octokit = require('@octokit/rest');

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
    return this.octokit.repos.createStatus({
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

  _getPR() {
    return this.octokit.search.issuesAndPullRequests({
      q: `type:pr+repo:${this.opts.owner}/${this.opts.repo}+head:${this.opts.current_branch}`,
    })
      .then((res) => {
        if (res && res.data.total_count === 1) {
          return res.data.items[0];
        };
        throw ('PR Not found!!');
      })
  }

  _getUpdatedPRBody(pr_body, stats) {
    const STATS_START = '<!---Asset Compare Plugin Stats: Start DO NOT DELETE -->',
      STATS_END = '<!---Asset Compare Plugin Stats: End-->';

    let new_stats = `${STATS_START}\n### Asset Comparison Table
      \n${stats}${STATS_END}`,
      old_stats_search = new RegExp(`${STATS_START}(.|\\s)*${STATS_END}`, "i");

    if (pr_body.search(old_stats_search) > -1) {
      return pr_body.replace(old_stats_search, new_stats);
    }

    return pr_body + new_stats;
  }

  updatePRDescription(stats) {
    return this._getPR()
      .then(({ number, body }) => {
        return this.octokit.pulls.update({
          owner: this.opts.owner,
          repo: this.opts.repo,
          number,
          body: this._getUpdatedPRBody(body, stats)
        })
      })
      .catch((err) => {
        this.log(err, 'warning');
      })
  }

}
module.exports = RevisedAssetsHelper;