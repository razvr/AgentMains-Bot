const MemoryDataSource = require('nix-data-memory');
const DiskDataSource = require('nix-data-disk');
const path = require('path');

const MockNixLogger = require("../../support/mock-logger");
const DataManager = require('../../../lib/managers/data-manager');

describe('DataManager', function () {
  beforeEach(function () {
    this.nix = {
      config: { dataSource: {} },
      logger: new MockNixLogger(),
    };

    this.dataManager = new DataManager(this.nix);
  });

  describe(".nix", function () {
    it('returns a reference to nix', function () {
      expect(this.dataManager.nix).to.eq(this.nix);
    });
  });

  describe('constructor', function () {
    context('when no datasource is in the nix config', function() {
      beforeEach(function () {
        delete this.nix.config.dataSource;
      });

      it('defaults to a memory datasource', function () {
        this.dataManager = new DataManager(this.nix);
        expect(this.dataManager._dataSource).to.be.a.instanceOf(MemoryDataSource);
      });
    });

    context('when a datasource is specified in the nix config', function() {
      beforeEach(function () {
        this.tmpDir = path.resolve([__dirname, "../../tmp"]);

        this.nix.config.dataSource.type = "disk";
        this.nix.config.dataSource.path = this.tmpDir;
      });
      
      it('correctly loads the datasource', function () {
        this.dataManager = new DataManager(this.nix);
        expect(this.dataManager._dataSource).to.be.a.instanceOf(DiskDataSource);
      });

      afterEach(function () {

      });
    });
  });

  describe('#type', function () {

  });

  describe('#onNixListen', function () {

  });

  describe('#onNixJoinGuild', function () {

  });

  describe('#setGuildData', function () {

  });

  describe('#getGuildData', function () {

  });
});
