const MemoryDataSource = require('chaos-data-memory');
const DummyDataSource = require('chaos-data-dummy');
const { of } = require('rxjs');
const { tap, toArray } = require('rxjs/operators');

const createChaosStub = require('../test/create-chaos-stub');
const DataManager = require('./data-manager');

describe('DataManager', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.chaos.config = { dataSource: {} };

    this.dataSource = new MemoryDataSource();
    this.dataManager = new DataManager(this.chaos);

    this.dataManager._dataSource = this.dataSource;
  });

  describe(".chaos", function () {
    it('returns a reference to ChaosCore', function () {
      expect(this.dataManager.chaos).to.eq(this.chaos);
    });
  });

  describe('constructor', function () {
    context('when no datasource is in the ChaosCore config', function () {
      beforeEach(function () {
        delete this.chaos.config.dataSource;
      });

      it('defaults to a memory datasource', function () {
        this.dataManager = new DataManager(this.chaos);
        expect(this.dataManager._dataSource).to.be.a.instanceOf(MemoryDataSource);
      });
    });

    context('when a datasource is specified in the ChaosCore config', function () {
      context('when the npm module is installed', function () {
        beforeEach(function () {
          this.chaos.config.dataSource.type = "dummy";
        });

        it('correctly loads the data source', function () {
          this.dataManager = new DataManager(this.chaos);
          expect(this.dataManager._dataSource).to.be.a.instanceOf(DummyDataSource);
        });
      });

      context('when the npm module is not installed', function () {
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

  describe('#setGuildData', function () {
    it('calls through to the datasource setData', function (done) {
      this.dataSource.setData = sinon.fake.returns(of(true));

      this.dataManager.setGuildData("guildId", "keyword", "data").pipe(
        toArray(),
        tap(() => expect(this.dataSource.setData).to.have.been.calledWith(
          "guild", "guildId", "keyword", "data",
        )),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  describe('#getGuildData', function () {
    it('calls through to the datasource getData', function (done) {
      this.dataSource.getData = sinon.fake.returns(of(true));

      this.dataManager.getGuildData("guildId", "keyword").pipe(
        toArray(),
        tap(() => expect(this.dataSource.getData).to.have.been.calledWith(
          "guild", "guildId", "keyword",
        )),
      ).subscribe(() => done(), (error) => done(error));
    });
  });
});
