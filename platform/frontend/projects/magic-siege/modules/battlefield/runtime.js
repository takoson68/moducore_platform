import { createP5Engine } from '@/gameEngines.js';
import { createBattlefieldStore } from './store.js';
import { createBattlefieldSketch } from './sketch.js';
import { createBattlefieldSimulation } from './simulation.js';

export function createBattlefieldModule({ element, createStore, action }) {
  let session;
  let engine;
  let simulation;
  return {
    name: 'battlefield',
    setup: {
      stores: { session: () => createBattlefieldStore(createStore) },
      services: {
        simulation: () => createBattlefieldSimulation(session),
        engine: () => {
          engine = createP5Engine({
            element,
            width: 1440,
            height: 810,
            label: '攻破魔法城幾何原型。點選地圖格查看格子資訊。',
            ...createBattlefieldSketch(session, simulation, action),
          });
          return engine;
        },
      },
    },
    async init({ store, service }) {
      session = store('session');
      simulation = service('simulation');
      await service('engine').prepare();
    },
    start({ service }) {
      service('engine').start();
    },
    pause({ service }) { simulation.pause(); service('engine').stop(); service('engine').redraw(); },
    resume({ service }) { simulation.resume(); service('engine').start(); },
    stop({ service }) { service('engine').stop(); },
  };
}
