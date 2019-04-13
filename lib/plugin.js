const _ = require('lodash');
const BaseAssetsHelper = require('./base_assets_helper');
const RevisedAssetsHelper = require('./revised_assets_helper');
const compareAssetSizes = require('./util').compareAssetSizes;

const IGNORE_EXTENSIONS = /^(gz|map|jpe?g|png|gif|svg|woff2?|ico|ttf|eot|json)$/i;
const env = process.env;

var shouldIgnoreFile = function(str) {
  str = str.replace(/\?.*/, '');
  var split = str.split('.');
  var ext = split.pop();
  return IGNORE_EXTENSIONS.test(ext);
};
class AssetComparePlugin {
  constructor(opts) {
    _.assign(this, {
      github_access_token: null,
      owner: null,
      repo: null,
      current_branch: null,
      commit_sha: null,
      build_url: null,
      base_branch: 'master',//The branch to benchmark asset sizes against
      gist_id: null,
      compilation: null
    });

    if(env.TRAVIS === 'true') {
      let repo_slug = env.TRAVIS_REPO_SLUG.split('/'),
        owner = repo_slug[0],
        repo = repo_slug.slice(1).join('/');

      _.assign(this, {
        current_branch: env.TRAVIS_BRANCH,
        owner,
        repo,
        commit_sha: env.TRAVIS_COMMIT,
        build_url: env.TRAVIS_BUILD_WEB_URL,
        github_access_token: env.GITHUB_ACCESS_TOKEN
      })
    }

    _.assign(this, opts);
  }

  log(message, type = 'info') {
    let _logger = console.log;
    //compilation instance available
    if(this.compilation) {
      if(type === 'warning') {
        _logger = this.compilation.warnings.push.bind(this.compilation.warnings);
      } else if(type === 'error') {
        _logger = this.compilation.errors.push.bind(this.compilation.errors);
      }
    } else if(type === 'warning') {
      _logger = console.warn;
    } else if(type === 'error') {
      _logger = console.error;
    }

    _logger('Asset Compare Plugin:'+ message);
  }

  _computeRevisedAssetSizes(stats) {
    return stats.assets.reduce((assets, asset) => {
      if(!shouldIgnoreFile(asset.name)) {
        assets.push({
          name: asset.chunkNames.join(' ') || asset.name,
          size: asset.size
        });
      };
      return assets;
    }, []);
  }

  _afterCompilation(stats, callback) {
    this.compilation = stats.compilation;
    stats = stats.toJson();

    if(stats.errors.length) {
      this.log('There are errors present in your compilation! Aborting...', 'warning');
      return;
    }

    let revised_assets,
      base_assets,
      base_assets_helper = new BaseAssetsHelper({
        github_access_token: this.github_access_token,
        gist_id: this.gist_id,
        repo: this.repo,
        base_branch: this.base_branch,
        log: this.log.bind(this)
      }),
      revised_assets_helper = new RevisedAssetsHelper({
        owner: this.owner,
        repo: this.repo,
        github_access_token: this.github_access_token,
        commit_sha: this.commit_sha,
        branch: this.current_branch,
        status_url: this.build_url,
        log: this.log
      }),
      promises = [];

    revised_assets = this._computeRevisedAssetSizes(stats);

    base_assets_helper.getContent().then((result) => {
      base_assets = result;
      if(base_assets) {
        let {console_table, markdown_table, summary} = compareAssetSizes(
          {name: this.base_branch, stats: base_assets},
          {name: this.base_branch === this.current_branch ? `${this.base_branch}-revised` :this.current_branch, stats: revised_assets}
        );
        this.log(console_table);
        promises.push(revised_assets_helper.updateStatus(summary));
        promises.push(revised_assets_helper.updatePRDescription(markdown_table));
      }
      if(this.base_branch === this.current_branch) {
        promises.push(base_assets_helper.updateContent(revised_assets));
      }
      if(!base_assets && this.base_branch !== this.current_branch) {
        this.log(`Stats for branch ${this.base_branch} missing! Aborting...`, 'warning');
      }
      Promise.all(promises).then(() => {callback()});
    });
  }

  apply(compiler) {
    if(env.TRAVIS !== 'true') {
      //exit silently
      return;
    }

    if(!this.owner || !this.repo || !this.current_branch || !this.github_access_token || !this.gist_id){
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