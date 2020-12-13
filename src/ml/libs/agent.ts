import * as path from "path";
import * as fs from "fs";
import ora, { Ora } from "ora";
import mkdirp from "mkdirp";
import rimraf from "rimraf";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-node";
import { customAlphabet } from "nanoid";
import random from "lodash/random";

import { Data } from "./chart";
import { LayersModel } from "@tensorflow/tfjs";

type AgentOptions = {
  modelsNumber?: number;
  namePrefix?: string;
};

type Spinner = Ora | undefined;

type PredictMemory = {
  [key: string]: number[];
};

export enum Action {
  NoAction,
  TakeAction,
  Unpredictable,
}

class Agent {
  models: tf.LayersModel[] = [];
  modelsNumber: number;
  namePrefix: string;
  predictMemory: PredictMemory = {};
  bestActionMemory: [Action, string][] = [];
  inputSize: number = 59;

  // For spinner purpose
  spinner: Spinner;

  static defaultOptions = {
    modelsNumber: 50,
    namePrefix: "model",
  };

  constructor(agentOptions?: AgentOptions) {
    this.modelsNumber =
      agentOptions?.modelsNumber || Agent.defaultOptions.modelsNumber;
    this.namePrefix =
      agentOptions?.namePrefix || Agent.defaultOptions.namePrefix;
  }

  /**
   * Build models based on models size
   */
  async createOrLoadModels() {
    const modelspath = <string>this.dataPaths("models");
    const modelIds = fs
      .readdirSync(modelspath)
      .filter((item) => fs.statSync(path.join(modelspath, item)).isDirectory());

    const length = this.modelsNumber;
    const models = modelIds.length > 0 ? modelIds : Array.from({ length });

    for (const id of models) {
      this.models.push(await this.createModel(<string>id));
    }

    if (this.models.length < this.modelsNumber) {
      this.replicate();
      this.loading(
        "Models number are lower than expected. Replicating models..."
      )?.succeed();
    }

    this.loading("All models have been loaded.")?.succeed();
  }

  /**
   * Create model with
   *
   * Input shape
   * - 59 (tick history data M1)
   * - 5 (Candle, Body, number, number, Trend)
   *
   * Output (2)
   * - Sell
   * - Buy
   */
  async createModel(name?: string) {
    // Random name.
    const modelName = name || `${this.namePrefix}-${this.randomId()}`;
    let model: tf.LayersModel;

    // model's path in pwd()/data
    const modelfile = <string>this.dataPaths("models", modelName, "model.json");

    try {
      if (fs.existsSync(modelfile)) {
        this.loading(`Load ${modelfile}...`);
      }

      model = await tf.loadLayersModel(`file://${modelfile}`);
    } catch {
      // Input layer
      const inputs = tf.input({
        shape: [this.inputSize, 5],
        name: "candlestick",
      });

      // Hidden layer
      const hidden = tf.layers
        .dense({
          units: 1024,
          activation: "sigmoid",
          name: "hidden",
        })
        .apply(inputs);

      // Flattening layers
      const flatten = tf.layers.flatten().apply(hidden);

      // Outputs layer.
      const outputs = <tf.SymbolicTensor>tf.layers
        .dense({
          units: 2,
          activation: "softmax",
          name: "output",
        })
        .apply(flatten);

      model = tf.model({ inputs, outputs, name: modelName });
    } finally {
      this.loading(`Model ${modelName} have been loaded.`);
    }

    // Let's compile our model.
    model.compile({
      optimizer: tf.train.adam(1e-3),
      loss: "meanSquaredError",
    });

    this.loading(`Model ${modelName} compiled.`);

    return model;
  }

  getModelById(modelName: string) {
    return this.models.find((item) => item.name === modelName);
  }

  /**
   * Save models
   */
  async saveModels() {
    for (const model of this.models) {
      await this.saveModel(model);
    }

    this.loading("All models have been saved.")?.succeed();
  }

  /**
   * Save model to model's directory
   */
  async saveModel(model: LayersModel) {
    const modelfolder = <string>this.dataPaths("models", model.name);
    mkdirp.sync(modelfolder);
    await model.save(`file://${modelfolder}`);
    this.loading(`Model ${model.name} saved!`);
  }

  /**
   * Remove models from list
   */
  async destroyModel(model: LayersModel) {
    const modelIndex = this.models.findIndex(
      (item) => item.name === model.name
    );
    if (modelIndex < 0) {
      return;
    }

    const modelpath = <string>this.dataPaths("models", model.name);
    rimraf.sync(modelpath);
    this.models.splice(modelIndex, 1);
  }

  /**
   * Input in 3d
   */
  input(series: Data[]) {
    return tf.tensor3d([
      series.map(({ candle, body, highDiff, bodyDiff, trend }) => [
        candle,
        body,
        highDiff,
        bodyDiff,
        trend,
      ]),
    ]);
  }

  /**
   * Get bulk predictions
   */
  predicts(series: Data[]) {
    tf.tidy(() => {
      const data = tf.tensor3d([
        series.map(({ candle, body, highDiff, bodyDiff, trend }) => [
          candle,
          body,
          highDiff,
          bodyDiff,
          trend,
        ]),
      ]);

      this.predictMemory = {};
      for (const model of this.models) {
        this.predictMemory[model.name] = this.predict(model, data);
      }
    });
  }

  /**
   * Get predict results
   */
  result() {
    return this.predictMemory;
  }

  /**
   * Get best action, whether it's
   * 0 - no action
   * 1 - action (sell / buy)
   */
  saveBestAction() {
    const result = this.result();
    let $noAction = 0;
    let $takeAction = 0;
    this.bestActionMemory = [];

    for (const id in result) {
      const [noAction, takeAction] = result[id];

      if (noAction > 0.8) {
        this.bestActionMemory.push([Action.NoAction, id]);
        $noAction++;
      }

      if (takeAction > 0.8) {
        this.bestActionMemory.push([Action.TakeAction, id]);
        $takeAction++;
      }

      if (noAction < 0.8 && takeAction < 0.8) {
        this.bestActionMemory.push([Action.Unpredictable, id]);
      }
    }

    const maxValue = Math.max($noAction, $takeAction);
    if (maxValue === $takeAction) {
      return Action.TakeAction;
    }

    return Action.NoAction;
  }

  /**
   * Predict model
   */
  predict(model: tf.LayersModel, data: tf.Tensor) {
    return tf.util.flatten((<tf.Tensor>model.predict(data)).arraySync());
  }

  /**
   * Replicate models after prediction
   * This can happen when some of models are destroyed,
   * and the quota of modelsNumber was being removed
   */
  async replicate() {
    let count = 0;

    for (let i = 0; i < this.modelsNumber; i++) {
      if (!this.models[i]) {
        const newModel = await this.copy(this.models[count]);
        this.loading(
          `Succeed replicate ${newModel.name}, counter: ${i}, ${count}`
        )?.succeed();
        this.mutate(newModel);
        await this.saveModel(newModel);
        this.models.push(newModel);
        count++;
      }
    }

    this.loading(`Replicating models`)?.succeed();
  }

  /**
   * Keep models that have correct prediction
   */
  async keepCorrectModels(bestAction: Action) {
    for (const [action, id] of this.bestActionMemory) {
      if (action === bestAction) {
        continue;
      }

      const model = this.getModelById(id);
      if (!model) {
        continue;
      }

      await this.destroyModel(model);
    }

    await this.replicate();
  }

  /**
   * Mutate weights
   */
  mutate(model: tf.LayersModel, rate: number = 0.1) {
    tf.tidy(() => {
      const weights = [];

      for (const weight of model.getWeights()) {
        const clonedWeights = weight.clone();

        const shape = clonedWeights.shape;
        const values = Array.from(clonedWeights.dataSync()).map((item) => {
          if (random(0, 1, true) < rate) {
            item = item + <number>tf.randomNormal([], 0, 1).arraySync();
          }
          return item;
        });

        const tensor = tf.tensor(values, shape);
        weights.push(tensor);
      }

      model.setWeights(weights);
    });
  }

  /**
   * Copy weights
   */
  async copy(model: tf.LayersModel) {
    return new Promise<tf.LayersModel>((resolve) => {
      tf.tidy(() => {
        const weights: tf.Tensor[] = [];
        for (const weight of model.getWeights()) {
          weights.push(weight.clone());
        }

        this.createModel().then((newModel) => {
          this.loading(`Copy ${model.name} as ${newModel.name}`);
          newModel.setWeights(weights);
          resolve(newModel);
        });
      });
    });
  }

  /**
   * Models data path
   */
  dataPaths(pathName?: "data" | "logs" | "models", ...paths: string[]) {
    const data = path.join(process.cwd(), "data");
    mkdirp.sync(data);
    if (pathName === "data") {
      return path.join(data, ...paths);
    }

    const logs = path.join(data, "logs");
    mkdirp.sync(logs);
    if (pathName === "logs") {
      return path.join(logs, ...paths);
    }

    const models = path.join(data, "models");
    mkdirp.sync(models);
    if (pathName === "models") {
      return path.join(models, ...paths);
    }

    return {
      data,
      logs,
      models,
    };
  }

  /**
   * Spinner logger
   */
  loading(text: string = "", isStop: boolean = false) {
    if (!this.spinner) {
      this.spinner = ora();
    }

    this.spinner.color = "cyan";
    this.spinner.text = text;

    if (isStop) {
      this.spinner.stop();
      console.log(text);
      return;
    }

    return this.spinner.start();
  }

  /**
   * Random 6 digit ID
   */
  randomId() {
    return customAlphabet("1234567890abcdefghijklmn", 6)();
  }
}

export default Agent;
