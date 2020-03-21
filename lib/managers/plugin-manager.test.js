const { zip } = require('rxjs');
const { flatMap, tap } = require('rxjs/operators');

const PluginManager = require('./plugin-manager');
const Service = require("../models/service");
const createChaosStub = require('../test/create-chaos-stub');
const { MockGuild } = require("../test/mocks/discord.mocks");
const { LoadPluginError } = require("../errors");

describe('PluginManager', function () {
  beforeEach(function () {
    this.chaos = createChaosStub();
    this.pluginManager = new PluginManager(this.chaos);
  });

  describe(".chaos", function () {
    it('returns the ChaosCore reference that the manager was constructed with', function () {
      expect(this.pluginManager.chaos).to.eq(this.chaos);
    });
  });

  describe(".plugins", function () {
    context('when no plugins have been added', function () {
      it('returns an empty list of plugins', function () {
        expect(this.pluginManager.plugins).to.deep.eq([]);
      });
    });

    context('when plugins have been added', function () {
      beforeEach(function () {
        this.pluginOne = { name: "pluginOne" };
        this.pluginTwo = { name: "pluginTwo" };
        this.pluginThree = { name: "pluginThree" };

        this.pluginManager.addPlugin(this.pluginOne);
        this.pluginManager.addPlugin(this.pluginTwo);
        this.pluginManager.addPlugin(this.pluginThree);
      });

      it('returns a list of all added plugins', function () {
        expect(this.pluginManager.plugins.map((m) => m.name)).to.deep.eq([
          "pluginOne",
          "pluginTwo",
          "pluginThree",
        ]);
      });
    });
  });

  describe("constructor", function () {
    it('initializes the manager with an empty plugin list', function () {
      expect(this.pluginManager.plugins).to.deep.eq([]);
    });
  });

  describe("#getPlugin", function () {
    context('when the plugin has been added', function () {
      beforeEach(function () {
        this.testPlugin = { name: "TestPlugin" };
        this.pluginManager.addPlugin(this.testPlugin);
      });

      it('returns the plugin', function () {
        expect(this.pluginManager.getPlugin('TestPlugin').name).to.eq("TestPlugin");
      });
    });

    context('when the plugin has not been added', function () {
      it('raises an error', function () {
        expect(() => this.pluginManager.getPlugin('TestPlugin')).to.throw(
          Error, "Plugin 'TestPlugin' could not be found.",
        );
      });
    });
  });

  describe("#addPlugin", function () {
    beforeEach(function () {
      this.testPlugin = { name: "TestPlugin" };
    });

    it('makes the plugin retrievable via #getPlugin', function () {
      this.pluginManager.addPlugin(this.testPlugin);
      expect(this.pluginManager.getPlugin('TestPlugin').name).to.eq("TestPlugin");
    });

    context('when the plugin is a string', function () {
      it('loads the plugin from npm', function () {
        this.pluginManager.addPlugin("from-npm");
        expect(this.pluginManager.getPlugin("fromNpm").name).to.eq("fromNpm");
      });

      context('when the npm package is not installed', function () {
        it('throws an error', function () {
          expect(() => {
            this.pluginManager.addPlugin("not-found");
          }).to.throw(
            LoadPluginError,
            "Unable to load plugin 'chaos-plugin-not-found'. Is the npm module 'chaos-plugin-not-found' installed?",
          );
        });
      });
    });

    context('when the plugin has dependencies', function () {
      it('loads the dependencies from npm', function () {
        this.pluginManager.addPlugin({
          name: 'withDeps',
          dependencies: [
            "from-npm",
          ],
        });

        expect(this.pluginManager.getPlugin("withDeps").name).to.eq("withDeps");
        expect(this.pluginManager.getPlugin("fromNpm").name).to.eq("fromNpm");
      });
    });

    context('when the plugin has already been added', function () {
      beforeEach(function () {
        this.pluginManager.addPlugin(this.testPlugin);
      });

      it('raises an error', function () {
        expect(() => this.pluginManager.addPlugin(this.testPlugin)).to.throw(
          Error, "Plugin 'TestPlugin' has already been added.",
        );
      });
    });

    context('when the plugin has services', function () {
      class ServiceOne extends Service {
      }

      class ServiceTwo extends Service {
      }

      beforeEach(function () {
        this.testPlugin.services = [
          ServiceOne,
          ServiceTwo,
        ];
      });

      it('adds all services to chaos', function () {
        sinon.spy(this.chaos, 'addService');

        this.pluginManager.addPlugin(this.testPlugin);

        expect(this.chaos.addService).to.have.been
          .calledWith("TestPlugin", this.testPlugin.services[0]);
        expect(this.chaos.addService).to.have.been
          .calledWith("TestPlugin", this.testPlugin.services[1]);
      });
    });

    context('when the plugin has config actions', function () {
      beforeEach(function () {
        this.testPlugin.configActions = [
          { name: "testActionOne" },
          { name: "testActionTwo" },
        ];
      });

      it('adds all config actions to chaos', function () {
        sinon.spy(this.chaos, 'addConfigAction');

        this.pluginManager.addPlugin(this.testPlugin);

        expect(this.chaos.addConfigAction).to.have.been
          .calledWith("TestPlugin", this.testPlugin.configActions[0]);
        expect(this.chaos.addConfigAction).to.have.been
          .calledWith("TestPlugin", this.testPlugin.configActions[1]);
      });
    });

    context('when the plugin has commands', function () {
      beforeEach(function () {
        this.testPlugin.commands = [
          { name: "testActionOne", run: sinon.fake() },
          { name: "testActionTwo", run: sinon.fake() },
        ];
      });

      it('adds all commands to chaos', function () {
        sinon.spy(this.chaos, 'addCommand');

        this.pluginManager.addPlugin(this.testPlugin);

        expect(this.chaos.addCommand).to.have.been
          .calledWith(this.testPlugin.name, this.testPlugin.commands[0]);
        expect(this.chaos.addCommand).to.have.been
          .calledWith(this.testPlugin.name, this.testPlugin.commands[1]);
      });
    });

    context('when the plugin has new permission levels', function () {
      beforeEach(function () {
        this.testPlugin.permissions = [
          "test1",
          "test2",
        ];
      });

      it('adds all permission levels to chaos', function () {
        sinon.spy(this.chaos, 'addPermissionLevel');

        this.pluginManager.addPlugin(this.testPlugin);

        expect(this.chaos.addPermissionLevel).to.have.been
          .calledWith(this.testPlugin.permissions[0]);
        expect(this.chaos.addPermissionLevel).to.have.been
          .calledWith(this.testPlugin.permissions[1]);
      });
    });
  });

  describe("event: guildCreate", function () {
    beforeEach(function () {
      this.testPlugin1 = { name: "TestPlugin1", defaultData: [{ keyword: "data_1", data: "value_1" }] };
      this.testPlugin2 = { name: "TestPlugin2", defaultData: [{ keyword: "data_2", data: "value_2" }] };
      this.testPlugin3 = { name: "TestPlugin3", defaultData: [{ keyword: "data_3", data: "value_3" }] };

      this.pluginManager.addPlugin(this.testPlugin1);
      this.pluginManager.addPlugin(this.testPlugin2);
      this.pluginManager.addPlugin(this.testPlugin3);

      this.guild = new MockGuild({});
    });

    it('prepares the default data for reach plugin', function (done) {
      this.chaos.emit('guildCreate', this.guild).pipe(
        flatMap(() => zip(
          this.chaos.getGuildData(this.guild.id, 'data_1'),
          this.chaos.getGuildData(this.guild.id, 'data_2'),
          this.chaos.getGuildData(this.guild.id, 'data_3'),
        )),
        tap((savedData) => expect(savedData).to.deep.equal(["value_1", "value_2", "value_3"])),
      ).subscribe(() => done(), (error) => done(error));
    });
  });
});
