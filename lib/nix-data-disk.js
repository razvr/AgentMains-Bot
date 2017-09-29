const fs = require('fs');
const Path = require('path');
const Rx = require('rx');

const ReadFile$ = Rx.Observable.fromNodeCallback(fs.readFile);
const WriteFile$ = Rx.Observable.fromNodeCallback(fs.writeFile);

class NixDataDisk {
  /**
   *
   * @param config
   * @param config.dataDir
   */
  constructor(config) {
    this._dataDir = config.dataDir;

    if (!fs.existsSync(this._dataDir)) {
      fs.mkdirSync(this._dataDir);
    }
  }

  /**
   *
   * @param type
   * @param id
   *
   * @return {Rx.Observable}
   */
  getData(type, id) {
    let filename = this._getDataFile(type, id);
    return this._readFromFile(filename);
  }

  /**
   *
   * @param type
   * @param id
   * @param data
   *
   * @return {Rx.Observable}
   */
  setData(type, id, data) {
    let filename = this._getDataFile(type, id);
    return this._saveToFile(filename, data);
  }

  /**
   *
   * @private
   *
   * @param type
   * @param id
   *
   * @return {String}
   */
  _getDataFile(type, id) {
    let folder = Path.join(this._dataDir, type);
    let filename = Path.join(folder, id + ".json");

    if (!fs.existsSync(Path.join(folder))) {
      fs.mkdirSync(Path.join(folder));
    }

    return filename;
  }

  /**
   *
   * @private
   *
   * @param filename
   *
   * @return {Rx.Observable}
   */
  _readFromFile(filename) {
    return ReadFile$(filename)
      .map((contents) => JSON.parse(contents))
      .catch((err) => {
        if (err.code === 'ENOENT') { // ENOENT => Error No Entity
          return WriteFile$(filename, "{}").flatMap(() => this._readFromFile(filename));
        } else {
          throw err;
        }
      });
  }

  /**
   *
   * @private
   *
   * @param filename
   * @param data
   *
   * @return {Rx.Observable}
   */
  _saveToFile(filename, data) {
    return Rx.Observable.just(data)
      .map((data) => JSON.stringify(data, null, '  '))
      .flatMap((dataString) => WriteFile$(filename, dataString))
      .flatMap(() => ReadFile$(filename))
      .map((contents) => JSON.parse(contents));
  }
}

module.exports = NixDataDisk;
