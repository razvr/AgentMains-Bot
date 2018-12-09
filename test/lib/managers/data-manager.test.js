const MemoryDataSource = require('nix-data-memory');
const DiskDataSource = require('nix-data-disk');
const path = require('path');
const fs = require('fs');
const Rx = require('rx');

const MockNix = require("../../support/mock-nix");
const MockDataSource = require("../../support/mock-data-source");
const DataManager = require('../../../lib/managers/data-manager');

describe('DataManager', function () {
  beforeEach(function () {
    this.nix = new MockNix();
    this.nix.config = { dataSource: {} };

    this.dataSource = new MockDataSource();
    this.dataManager = new DataManager(this.nix);

    this.dataManager._dataSource = this.dataSource;
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
      context('when the npm module is installed', function () {
        beforeEach(function () {
          this.tmpDir = path.resolve(__dirname, "../../tmp");

          this.nix.config.dataSource.type = "disk";
          this.nix.config.dataSource.dataDir = this.tmpDir;
        });

        afterEach(function () {
          fs.rmdirSync(this.tmpDir);
        });

        it('correctly loads the datasource', function () {
          this.dataManager = new DataManager(this.nix);
          expect(this.dataManager._dataSource).to.be.a.instanceOf(DiskDataSource);
        });
      });

      context('when the npm module is not installed', function() {
        beforeEach(function () {
          this.nix.config.dataSource.type = "test";
        });

        it('raises an error', function () {
          expect(() => new DataManager(this.nix)).to.throw(
            DataManager.DataSourceError, "Unable to load data source 'nix-data-test'. Is the npm module 'nix-data-test' installed?"
          );
        });
      });
    });
  });

  describe('#type', function () {
    it('returns the type from the DataSource', function () {
      this.dataSource.type = "DataSource";
      expect(this.dataManager.type).to.eq("DataSource");
    });
  });

  describe('#onNixListen', function () {
    context('when the datasource does not have a onNixListen', function () {
      beforeEach(function () {
        delete this.dataSource.onNixListen;
      });

      it("returns an Observable of true", function (done) {
        let hook$ = this.dataManager.onNixListen();
        expect(hook$).to.be.an.instanceOf(Rx.Observable);

        hook$.subscribe(
          (value) => {
            expect(value).to.eq(true);
            done();
          },
          (error) => {
            done(error);
          }
        );
      });
    });

    context('when the datasource has a onNixListen', function () {
      beforeEach(function () {
        this.dataSource.onNixListen = sinon.fake.returns(Rx.Observable.of(true));
      });

      it("calls the datasource's onNixListen", function () {
        let hook$ = this.dataManager.onNixListen();
        expect(hook$).to.be.an.instanceOf(Rx.Observable);
        expect(this.dataManager._dataSource.onNixListen).to.have.been.called;
      });
    });
  });

  describe('#onNixJoinGuild', function () {
    context('when the datasource does not have a onNixJoinGuild', function() {
      beforeEach(function () {
        delete this.dataSource.onNixJoinGuild;
      });

      it("returns an Observable of true", function (done) {
        let hook$ = this.dataManager.onNixJoinGuild();
        expect(hook$).to.be.an.instanceOf(Rx.Observable);

        hook$.subscribe(
          (value) => {
            expect(value).to.eq(true);
            done();
          },
          (error) => {
            done(error);
          }
        );
      });
    });

    context('when the datasource has a onNixJoinGuild', function () {
      beforeEach(function () {
        this.dataSource.onNixJoinGuild = sinon.fake.returns(Rx.Observable.of(true));
      });

      it("calls the datasource's onNixListen", function () {
        let hook$ = this.dataManager.onNixJoinGuild();
        expect(hook$).to.be.an.instanceOf(Rx.Observable);
        expect(this.dataManager._dataSource.onNixJoinGuild).to.have.been.called;
      });
    });
  });

  describe('#setGuildData', function () {
    it('calls through to the datasource setData', function () {
      this.dataSource.setData = sinon.fake.returns(Rx.Observable.of(true));
      this.dataManager.setGuildData("guildId", "keyword", "data");
      expect(this.dataSource.setData).to.have.been
        .calledWith("guild", "guildId", "keyword", "data");
    });
  });

  describe('#getGuildData', function () {
    it('calls through to the datasource getData', function () {
      this.dataSource.getData = sinon.fake.returns(Rx.Observable.of(true));
      this.dataManager.getGuildData("guildId", "keyword");
      expect(this.dataSource.getData).to.have.been
        .calledWith("guild", "guildId", "keyword");
    });
  });
});
