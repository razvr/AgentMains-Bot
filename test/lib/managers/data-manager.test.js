const MemoryDataSource = require('chaos-data-memory');
const DiskDataSource = require('chaos-data-disk');
const path = require('path');
const fs = require('fs');
const Rx = require('rx');

const DataManager = require('../../../lib/managers/data-manager');

describe('DataManager', function () {
  beforeEach(function () {
    this.chaos = createNixStub();
    this.chaos.config = { dataSource: {} };

    this.dataSource = new MemoryDataSource();
    this.dataManager = new DataManager(this.chaos);

    this.dataManager._dataSource = this.dataSource;
  });

  describe(".chaos", function () {
    it('returns a reference to nix', function () {
      expect(this.dataManager.chaos).to.eq(this.chaos);
    });
  });

  describe('constructor', function () {
    context('when no datasource is in the nix config', function() {
      beforeEach(function () {
        delete this.chaos.config.dataSource;
      });

      it('defaults to a memory datasource', function () {
        this.dataManager = new DataManager(this.chaos);
        expect(this.dataManager._dataSource).to.be.a.instanceOf(MemoryDataSource);
      });
    });

    context('when a datasource is specified in the nix config', function() {
      context('when the npm module is installed', function () {
        beforeEach(function () {
          this.tmpDir = path.resolve(__dirname, "../../tmp");

          this.chaos.config.dataSource.type = "disk";
          this.chaos.config.dataSource.dataDir = this.tmpDir;
        });

        afterEach(function () {
          fs.rmdirSync(this.tmpDir);
        });

        it('correctly loads the datasource', function () {
          this.dataManager = new DataManager(this.chaos);
          expect(this.dataManager._dataSource).to.be.a.instanceOf(DiskDataSource);
        });
      });

      context('when the npm module is not installed', function() {
        beforeEach(function () {
          this.chaos.config.dataSource.type = "test";
        });

        it('raises an error', function () {
          expect(() => new DataManager(this.chaos)).to.throw(
            DataManager.DataSourceError, "Unable to load data source 'chaos-data-test'. Is the npm module 'chaos-data-test' installed?",
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

  describe('#onListen', function () {
    context('when the datasource does not have a onListen', function () {
      beforeEach(function () {
        delete this.dataSource.onListen;
      });

      it("returns an Observable of true", function (done) {
        let hook$ = this.dataManager.onListen();
        expect(hook$).to.be.an.instanceOf(Rx.Observable);

        hook$.subscribe(
          (value) => {
            expect(value).to.eq(true);
            done();
          },
          (error) => {
            done(error);
          },
        );
      });
    });

    context('when the datasource has a onListen', function () {
      beforeEach(function () {
        this.dataSource.onListen = sinon.fake.returns(Rx.Observable.of(true));
      });

      it("calls the datasource's onListen", function () {
        let hook$ = this.dataManager.onListen();
        expect(hook$).to.be.an.instanceOf(Rx.Observable);
        expect(this.dataManager._dataSource.onListen).to.have.been.called;
      });
    });
  });

  describe('#onJoinGuild', function () {
    context('when the datasource does not have a onJoinGuild', function() {
      beforeEach(function () {
        delete this.dataSource.onJoinGuild;
      });

      it("returns an Observable of true", function (done) {
        let hook$ = this.dataManager.onJoinGuild();
        expect(hook$).to.be.an.instanceOf(Rx.Observable);

        hook$.subscribe(
          (value) => {
            expect(value).to.eq(true);
            done();
          },
          (error) => {
            done(error);
          },
        );
      });
    });

    context('when the datasource has a onJoinGuild', function () {
      beforeEach(function () {
        this.dataSource.onJoinGuild = sinon.fake.returns(Rx.Observable.of(true));
      });

      it("calls the datasource's onJoinGuild", function () {
        let hook$ = this.dataManager.onJoinGuild();
        expect(hook$).to.be.an.instanceOf(Rx.Observable);
        expect(this.dataManager._dataSource.onJoinGuild).to.have.been.called;
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
