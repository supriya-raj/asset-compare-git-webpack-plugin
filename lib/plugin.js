const _ = require('lodash');
const BaseAssetsHelper = require('./base_assets_helper');
const RevisedAssetsHelper = require('./revised_assets_helper');
const compareAssetSizes = require('./util').compareAssetSizes;
const getAssets = require('./util').getAssets;

const env = process.env;
class AssetComparePlugin {
  constructor(opts) {
    //Webpack compilation instance
    this.compilation = null;
    this.opts = {};

    _.assign(this.opts, {
      github_access_token: null,
      owner: null,
      repo: null,
      base_branch: 'master',
      current_branch: null,
      commit_sha: null,
      is_travis: false,
      is_github_action: false,
      build_url: null
    });

    if (env.TRAVIS === 'true') {
      const repo_slug = env.TRAVIS_REPO_SLUG.split('/'),
        owner = repo_slug[0],
        repo = repo_slug.slice(1).join('/');

      _.assign(this.opts, {
        current_branch: env.TRAVIS_BRANCH,
        owner,
        repo,
        commit_sha: env.TRAVIS_COMMIT,
        build_url: env.TRAVIS_BUILD_WEB_URL,
        github_access_token: env.GITHUB_PERSONAL_TOKEN,
        is_travis: true
      })
    } else if (env.GITHUB_ACTIONS === 'true') {
      const repo_slug = env.GITHUB_REPOSITORY.split('/'),
        owner = repo_slug[0],
        repo = repo_slug.slice(1).join('/');

      _.assign(this.opts, {
        current_branch: env.GITHUB_REF.split("/").splice(2).join("/"),
        owner,
        repo,
        commit_sha: env.GITHUB_SHA,
        github_access_token: env.GITHUB_PERSONAL_TOKEN,
        build_url: `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`,
        is_github_action: true
      })
    }

    _.assign(this.opts, opts);
  }

  log(message, type = 'info') {
    let _logger = console.log;
    //compilation instance available
    if (this.compilation) {
      if (type === 'warning') {
        _logger = this.compilation.warnings.push.bind(this.compilation.warnings);
      } else if (type === 'error') {
        _logger = this.compilation.errors.push.bind(this.compilation.errors);
      }
    } else if (type === 'warning') {
      _logger = console.warn;
    } else if (type === 'error') {
      _logger = console.error;
    }

    _logger('Asset Compare Plugin: ' + message);
  }

  _afterCompilation(stats, callback) {
    this.compilation = stats.compilation;
    stats = stats.toJson();

    if (stats.errors.length) {
      this.log('There are errors present in your compilation! Aborting...', 'warning');
      return;
    }

    let revised_assets = getAssets(stats),
      base_assets,
      base_assets_helper = new BaseAssetsHelper(this.opts, this.log),
      revised_assets_helper = new RevisedAssetsHelper(this.opts, this.log),
      promises = [];

    base_assets_helper.getAssets().then((result) => {
      base_assets = result;
      if (base_assets) {
        let { console_table, markdown_table, summary } = compareAssetSizes(
          { name: this.opts.base_branch, stats: base_assets },
          { name: this.opts.base_branch === this.opts.current_branch ? `${this.opts.base_branch}-revised` : this.opts.current_branch, stats: revised_assets }
        );
        this.log(console_table);
        promises.push(revised_assets_helper.updateStatus(summary));
        //TODO - check this
        //promises.push(revised_assets_helper.updatePRDescription(markdown_table));
      }
      if (this.opts.base_branch === this.opts.current_branch) {
        promises.push(base_assets_helper.updateAssets(revised_assets));
      }
      if (!base_assets && this.opts.base_branch !== this.opts.current_branch) {
        this.log(`Stats for branch ${this.opts.base_branch} missing! Aborting...`, 'warning');
      }
    });

    Promise.all(promises).then(() => { callback() });
  }

  apply(compiler) {
    if (!this.opts.is_travis && !this.opts.is_github_action) {
      //exit silently
      return;
    }

    if (!this.opts.owner || !this.opts.repo || !this.opts.current_branch || !this.opts.github_access_token) {
      this.log("One or more required github parameters are missing. Aborting!", "warning");
      return;
    };

    if (compiler.hooks) {
      const pluginOptions = {
        name: 'AssetComparePlugin',
        stage: Infinity
      };
      compiler.hooks.done.tapAsync(pluginOptions, this._afterCompilation.bind(this));
    } else {
      this.log('Asset Compare Plugin is only supported with webpack4 !!', 'warning');
    }
  }
}

module.exports = AssetComparePlugin;