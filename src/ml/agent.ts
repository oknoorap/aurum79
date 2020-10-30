import * as path from 'path';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-node';
import { customAlphabet } from 'nanoid';

import type { Data } from './chart'

type AgentOptions = {
  modelsSize?: number;
  namePrefix?: string;
};

class Agent {
  modelsSize: number;
  namePrefix: string;
  models: tf.LayersModel[] = [];
  savedModels: tf.LayersModel[] = [];

  static defaultOptions = {
    modelsSize: 100,
    namePrefix: 'model',
  };

  constructor(agentOptions?: AgentOptions) {
    const {
      modelsSize = Agent.defaultOptions.modelsSize,
      namePrefix = Agent.defaultOptions.namePrefix,
    } = agentOptions || {};

    this.modelsSize = modelsSize;
    this.namePrefix = namePrefix;
  }

  /**
   * Build models based on models size
   */
  async createBulkModels() {
    const length = this.modelsSize;

    for (const _ of Array.from({ length })) {
      this.models.push(await this.createModel());
    }
  }

  /**
   * Create model with
   *
   * Input shape
   * - 60 (tick history data M1)
   * - 5 (Candle, Body, number, number, Trend)
   *
   * Output (2)
   * - Sell
   * - Buy
   */
  async createModel() {
    // Random name.
    const name = `${this.namePrefix}-${this.randomId()}`;

    // model's path in pwd()/data
    const { models: modelpath } = this.dataPaths();

    let model: tf.LayersModel;

    try {
      model = await tf.loadLayersModel(`file://${modelpath}`);
    } catch {
      // Input layer
      const inputs = tf.input({ shape: [60, 5] });

      // Hidden layer
      const hidden = tf.layers
        .dense({
          units: 256,
          activation: 'sigmoid',
        })
        .apply(inputs);

      const flatten = tf.layers.flatten().apply(hidden);

      // Outputs layer.
      const outputs = tf.layers
        .dense({
          units: 2,
          activation: 'softmax',
        })
        .apply(flatten) as tf.SymbolicTensor;

      model = tf.model({ inputs, outputs, name });
    }

    // Let's compile our model.
    model.compile({
      optimizer: tf.train.adam(1e-3),
      loss: 'meanSquaredError',
    });

    return model;
  }

  /**
   * Input in 3d
   */
  input(series: Data[]) {
    return tf.tensor3d([series.map(({ candle, body, highDiff, bodyDiff, trend }) => [candle, body, highDiff, bodyDiff, trend])]);
  }

  /**
   * Get bulk predictions
   */
  bulkPredict(data: tf.Tensor) {
    const results = [];

    for (const model of this.models) {
      results.push(model.predict(data));
    }

    return results;
  }

  /**
   * Predict model
   */
  predict(model: tf.LayersModel, data: tf.Tensor) {
    return model.predict(data);
  }

  /**
   * Models data path
   */
  dataPaths() {
    const data = path.join(process.cwd(), 'data');
    const logs = path.join(data, 'logs');
    const models = path.join(data, 'models');

    return {
      data,
      logs,
      models,
    };
  }

  /**
   * Random 6 digit ID
   */
  randomId() {
    return customAlphabet('1234567890abcdefghijklmn', 6)();
  }
}

export default Agent;
