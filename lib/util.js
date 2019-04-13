const _ = require('lodash');
const chalk = require('chalk');
const ConsoleTable = require('console.table');
const MarkdownTable = require('markdown-table');

const ASSET_SIZE_PERCENT_CHANGE_THRESHOLD = 5;

var _getDisplayableSize = (bytes, decimals = 3) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

var _mergeStats = (old_stats, revised_stats) => {
  let stats = {},
  _storeStats = (type, stat) => {
    _.assign(stats[stat.name] = stats[stat.name] || {}, {[type]: stat})
  };

  old_stats.forEach(_storeStats.bind(null,'old'));
  revised_stats.forEach(_storeStats.bind(null,'revised'));

  return stats;
};

var _getConsoleTable = (old, revised, stats) => {
    let table_header = ['Chunk Name', old.name, revised.name, '% change in size'],
    table_rows = stats;

    return '\n' + ConsoleTable.getTable(table_header, table_rows) + '\n';
}

var _getMarkdownTable = (old, revised, stats) => {
  let table_header = ['Chunk Name', old.name, revised.name, '% change in size'],
    table_rows = stats.map((stat) => {
      stat[0] = stat[0].replace(/~/g, '\\~');
      if(stat[3] > ASSET_SIZE_PERCENT_CHANGE_THRESHOLD) {
        stat[3] = `${stat[3]}:exclamation:`;
      };
      return stat;
    });

    return MarkdownTable([
      table_header,
      ...table_rows
    ]);
};

var compareAssetSizes = (old, revised) => {
  let stats = _mergeStats(old.stats, revised.stats),
    stat_rows = [],
    asset_size_inc_count = 0;

    Object.keys(stats).forEach((name) => {
      let chunk= stats[name],
        old_size = 0,
        revised_size = 0,
        percent_change_in_size = 0,
        stat_row = [name];


      if(chunk.old) {
        old_size = chunk.old.size;
        stat_row.push(_getDisplayableSize(chunk.old.size));
      } else {
        stat_row.push('-');
      }

      if(chunk.revised) {
        revised_size = chunk.revised.size;
        stat_row.push(_getDisplayableSize(chunk.revised.size));
      } else {
        stat_row.push('-');
      }

      percent_change_in_size = (revised_size - old_size)*100/old_size;
      if(percent_change_in_size > ASSET_SIZE_PERCENT_CHANGE_THRESHOLD) {
        asset_size_inc_count += 1;
      }
      stat_row.push(percent_change_in_size);

      stat_rows.push(stat_row);
    });

    return {
      console_table: _getConsoleTable(old, revised, stat_rows),
      markdown_table: _getMarkdownTable(old, revised, stat_rows),
      summary: asset_size_inc_count > 0? 'error': 'success'
    }
};

module.exports = {
  compareAssetSizes
};