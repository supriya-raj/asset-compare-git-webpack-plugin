const _ = require('lodash');
const chalk = require('chalk');
const Table = require('tty-table');

const ASSET_SIZE_PERCENT_CHANGE_THRESHOLD = 5;

var _getDisplayableSize = function(bytes, decimals = 3) {
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

      percent_change_in_size = (revised_size - old_size)/100;
      if(percent_change_in_size > ASSET_SIZE_PERCENT_CHANGE_THRESHOLD) {
        asset_size_inc_count += 1;
      }
      stat_row.push(percent_change_in_size);

      stat_rows.push(stat_row);
    });

    //Generate table
    let table_header = [
      {
        value : "Chunk Name",
        headerColor : "cyan",
        color: "white",
        align: "left",
        paddingLeft : 5,
        width : 40
      },
      {
        value : old.name,
        headerColor : "cyan",
        color: "white",
        align: "left",
        width : 20
      },
      {
        value : revised.name,
        headerColor : "cyan",
        color: "white",
        align: "left",
        width : 20
      },
      {
        value : '% change in size',
        headerColor : "cyan",
        color: "white",
        align: "left",
        width : 20,
        formatter: (value) => {
          var str = value.toFixed(2) + "%";
          if(value > 5){
            str = chalk.red(str);
          }
          return str;
        }
      },

    ],
    table_rows = stat_rows,
    table_opts = {};

    return {
      table: Table(table_header, table_rows, table_opts).render(),
      summary: asset_size_inc_count > 0? 'error': 'success'
    }
};

module.exports = {
  compareAssetSizes
};