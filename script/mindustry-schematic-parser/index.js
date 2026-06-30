/**All the methods in this script are copied from mindustry-schematic-parser (except for the tileConfigEncoder class placed later).
 ͏ ╱|、
 (˚ˎ 。7
 |、˜ 〵
 じしˍ,)ノ
 在这里放一只小猫
**/

import * as Pako from 'pako';
import { Blocks, SchematicTile } from 'mindustry-schematic-parser';

export { SchematicTile }

/**
 * A point in a 2D grid, with integer x and y coordinates
 * @author badlogic
 *
 * Copied from `Anuken/Arc`
 */
export class Point2 {
  /**
   * Constructs a new 2D grid point.
   * @param x X coordinate
   * @param y Y coordinate
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  /** @return a point unpacked from an integer. */
  static unpack(pos) {
    return new Point2(pos >>> 16, pos & 0xffff);
  }
  /** @return this point packed into a single int by casting its components to shorts. */
  static pack(x, y) {
    return (x << 16) | (y & 0xffff);
  }
  /** @return the x component of a packed position. */
  static x(pos) {
    return pos >>> 16;
  }
  /** @return the y component of a packed position. */
  static y(pos) {
    return pos & 0xffff;
  }
  /** @return this point packed into a single int by casting its components to shorts. */
  pack() {
    return Point2.pack(this.x, this.y);
  }
  set(...args) {
    if (args[0] instanceof Point2) {
      const [point] = args;
      this.x = point.x;
      this.y = point.y;
      return this;
    }
    const [x, y] = args;
    this.x = x;
    this.y = y;
    return this;
  }
  dst2(...args) {
    if (args[0] instanceof Point2) {
      const [other] = args;
      const xd = other.x - this.x;
      const yd = other.y - this.y;
      return xd * xd + yd * yd;
    }
    const [x, y] = args;
    const xd = x - this.x;
    const yd = y - this.y;
    return xd * xd + yd * yd;
  }
  dst(...args) {
    if (args[0] instanceof Point2) {
      const [other] = args;
      const xd = other.x - this.x;
      const yd = other.y - this.y;
      return Math.sqrt(xd * xd + yd * yd);
    }
    const [x, y] = args;
    const xd = x - this.x;
    const yd = y - this.y;
    return Math.sqrt(xd * xd + yd * yd);
  }
  add(...args) {
    if (args[0] instanceof Point2) {
      const [other] = args;
      this.x += other.x;
      this.y += other.y;
      return this;
    }
    const [x, y] = args;
    this.x += x;
    this.y += y;
    return this;
  }
  sub(...args) {
    if (args[0] instanceof Point2) {
      const [other] = args;
      this.x -= other.x;
      this.y -= other.y;
      return this;
    }
    const [x, y] = args;
    this.x -= x;
    this.y -= y;
    return this;
  }
  /**
   * @return a copy of this grid point
   */
  cpy() {
    return new Point2(this.x, this.y);
  }
  /** Rotates this point in 90-degree increments several times. */
  rotate(steps) {
    for (let i = 0; i < Math.abs(steps); i++) {
      const { x } = this;
      if (steps >= 0) {
        this.x = -this.y;
        this.y = x;
      }
      else {
        this.x = this.y;
        this.y = -x;
      }
    }
    return this;
  }
  static equals(x, y, ox, oy) {
    return x === ox && y === oy;
  }
  equals(...args) {
    {
      if (args[0] instanceof Point2) {
        const [other] = args;
        return this.x === other.x && this.y === other.y;
      }
      const [x, y] = args;
      return this.x === x && this.y === y;
    }
  }
  hashCode() {
    return this.x * 0xc13f + this.y * 0x91e1;
  }
  toString() {
    return '(' + this.x + ', ' + this.y + ')';
  }
}

class Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

var index$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Point2: Point2,
  Vec2: Vec2
});

/**
 * Flagged enum with the different output types that a block can have
 *
 * Because this enum is flagged, it can hold more than one value at a time.
 *
 * You can use the `Flags` class to make value checking easier
 *
 * @example
 *    // check if the value has both item and liquid
 *    Flags.has(myValue, BlockOutput.item | BlockOutput.liquid)
 */
var BlockOutput;
(function (BlockOutput) {
  BlockOutput[BlockOutput["none"] = 0] = "none";
  BlockOutput[BlockOutput["item"] = 2] = "item";
  BlockOutput[BlockOutput["liquid"] = 4] = "liquid";
  BlockOutput[BlockOutput["payload"] = 8] = "payload";
})(BlockOutput || (BlockOutput = {}));
var BlockOutputDirection;
(function (BlockOutputDirection) {
  BlockOutputDirection[BlockOutputDirection["none"] = 0] = "none";
  BlockOutputDirection[BlockOutputDirection["front"] = 2] = "front";
  BlockOutputDirection[BlockOutputDirection["back"] = 4] = "back";
  BlockOutputDirection[BlockOutputDirection["left"] = 8] = "left";
  BlockOutputDirection[BlockOutputDirection["right"] = 16] = "right";
  BlockOutputDirection[BlockOutputDirection["all"] = 30] = "all";
})(BlockOutputDirection || (BlockOutputDirection = {}));
/**
 * Aliases that the game has for some blocks
 */
const blockAliases = new Map(Object.entries({
  'dart-mech-pad': 'legacy-mech-pad',
  'dart-ship-pad': 'legacy-mech-pad',
  'javelin-ship-pad': 'legacy-mech-pad',
  'trident-ship-pad': 'legacy-mech-pad',
  'glaive-ship-pad': 'legacy-mech-pad',
  'alpha-mech-pad': 'legacy-mech-pad',
  'tau-mech-pad': 'legacy-mech-pad',
  'omega-mech-pad': 'legacy-mech-pad',
  'delta-mech-pad': 'legacy-mech-pad',
  'draug-factory': 'legacy-unit-factory',
  'spirit-factory': 'legacy-unit-factory',
  'phantom-factory': 'legacy-unit-factory',
  'wraith-factory': 'legacy-unit-factory',
  'ghoul-factory': 'legacy-unit-factory-air',
  'revenant-factory': 'legacy-unit-factory-air',
  'dagger-factory': 'legacy-unit-factory',
  'crawler-factory': 'legacy-unit-factory',
  'titan-factory': 'legacy-unit-factory-ground',
  'fortress-factory': 'legacy-unit-factory-ground',
  'mass-conveyor': 'payload-conveyor',
  vestige: 'scepter',
  'turbine-generator': 'steam-generator',
  rocks: 'stone-wall',
  sporerocks: 'spore-wall',
  icerocks: 'ice-wall',
  dunerocks: 'dune-wall',
  sandrocks: 'sand-wall',
  shalerocks: 'shale-wall',
  snowrocks: 'snow-wall',
  saltrocks: 'salt-wall',
  dirtwall: 'dirt-wall',
  ignarock: 'basalt',
  holostone: 'dacite',
  'holostone-wall': 'dacite-wall',
  rock: 'boulder',
  snowrock: 'snow-boulder',
  cliffs: 'stone-wall',
  craters: 'crater-stone',
  deepwater: 'deep-water',
  water: 'shallow-water',
  sand: 'sand-floor',
  slag: 'molten-slag',
  cryofluidmixer: 'cryofluid-mixer',
  'block-forge': 'constructor',
  'block-unloader': 'payload-unloader',
  'block-loader': 'payload-loader',
  'thermal-pump': 'impulse-pump',
  'alloy-smelter': 'surge-smelter',
  'steam-vent': 'rhyolite-vent',
  fabricator: 'tank-fabricator',
  'basic-reconstructor': 'refabricator',
}));

/** An abstract top class representing in game content
 *
 * This class should not be instantiated
 */
class Content {
}
/** An abstract top class representing idetifiable in game content
 *
 * This class should not be instantiated
 */
class MappableContent extends Content {
  toString() {
    return this.name;
  }
}
/** An abstract top class representing unlockable in game content
 *
 * This class should not be instantiated
 */
class UnlockableContent extends MappableContent {
}

/**
 * A generic way to represent a block
 */
class Block extends UnlockableContent {
  constructor() {
    super(...arguments);
    this.output = BlockOutput.none;
    this.outputDirection = BlockOutputDirection.none;
    this.powerConsumption = 0;
  }
  get energyUsage() {
    return this.powerConsumption * ticksPerSecond;
  }
  static fromCode(code) {
    var _a;
    const id = (_a = blockAliases.get(code)) !== null && _a !== void 0 ? _a : code;
    const block = this.codes.get(id);
    if (block) {
      return block;
    }
    throw new Error(`The block "${code}" could not be found in the registry`);
  }
  renderImage({ info, image, tile, }) {
    const context = info.canvas.getContext('2d');
    const { x, y } = translatePos(tile, info.canvas);
    context.drawImage(image, x, y);
  }
  async render({ info, category, layers, tile, }) {
    for (const layer of layers) {
      const image = await info.blockAsset(category, layer);
      this.renderImage({
        info,
        image,
        tile,
      });
    }
  }
}
/**
 * @internal
 */
Block.codes = new Map();

function registerBlocks(domain) {
  for (const k in domain) {
    const key = k;
    const Class = domain[key];
    if (Class) {
      const block = new Class();
      Block.codes.set(block.name, block);
    }
  }
}
registerBlocks(Blocks.campaign);
registerBlocks(Blocks.crafting);
registerBlocks({
  ...Blocks.defense,
  Wall: undefined,
});
registerBlocks(Blocks.distribution);
registerBlocks(Blocks.environment);
registerBlocks(Blocks.experimental);
registerBlocks(Blocks.liquid);
registerBlocks(Blocks.logic);
registerBlocks(Blocks.ores);
registerBlocks(Blocks.payload);
registerBlocks({
  ...Blocks.power,
  PowerGenerator: undefined,
});
registerBlocks(Blocks.production);
registerBlocks({
  ...Blocks.sandbox,
  LightBlock: undefined,
});
registerBlocks(Blocks.storage);
registerBlocks(Blocks.turrets);
registerBlocks(Blocks.units);

export { Block };

export function concatBytes(...arrays) {
  let totalLength = 0;
  for (const arr of arrays) {
    totalLength += arr.byteLength;
  }
  const result = new Uint8Array(totalLength);
  let currentOffset = 0;
  for (const arr of arrays) {
    result.set(arr, currentOffset);
    currentOffset += arr.length;
  }
  return result;
}

export function base64ToBytes(source) {
  if (typeof window === 'undefined')
    return Buffer.from(source, 'base64');
  const binaryString = atob(source);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
export function bytesToBase64(source) {
  if ('write' in source)
    return source.toString('base64');
  if (typeof window === 'undefined')
    return Buffer.from(source).toString('base64');
  let result = '';
  for (let i = 0; i < source.length; i++) {
    result += String.fromCharCode(source[i]);
  }
  return btoa(result);
}

const itemColors = {
  copper: '#d99d73',
  lead: '#8c7fa9',
  metaglass: '#ebeef5',
  graphite: '#b2c6d2',
  sand: '#f7cba4',
  coal: '#272727',
  titanium: '#8da1e3',
  thorium: '#f9a3c7',
  scrap: '#777777',
  silicon: '#53565c',
  plastanium: '#cbd97f',
  'phase-fabric': '#f4ba6e',
  'surge-alloy': '#f3e979',
  'spore-pod': '#7457ce',
  'blast-compound': '#ff795e',
  pyratite: '#ffaa5f',
  beryllium: '#3a8f64',
  tungsten: '#768a9a',
  oxide: '#e4ffd6',
  carbide: '#89769a',
  'fissile-matter': '#5e988d',
  'dormant-cyst': '#df824d',
};
/** A wrapper for `ItemCode`, can be useful with `instanceof` */
class Item {
  constructor(code) {
    this.code = code;
    this.color = itemColors[code];
  }
  static create(name) {
    let item = this.itemMap.get(name);
    if (!item) {
      item = new Item(name);
      this.itemMap.set(name, item);
    }
    return item;
  }
  static fromCode(code) {
    var _a;
    const items = [
      'copper',
      'lead',
      'metaglass',
      'graphite',
      'sand',
      'coal',
      'titanium',
      'thorium',
      'scrap',
      'silicon',
      'plastanium',
      'phase-fabric',
      'surge-alloy',
      'spore-pod',
      'blast-compound',
      'pyratite',
      'beryllium',
      'tungsten',
      'oxide',
      'carbide',
      'fissile-matter',
      'dormant-cyst',
    ];
    if (code > items.length - 1)
      throw new Error('Unknown item code: ' + code);
    const name = items[code];
    const item = (_a = this.itemMap.get(name)) !== null && _a !== void 0 ? _a : this.create(name);
    return item;
  }

  static itemCodeMap = null;

  // itemsName转code
  static toCode(itemName) {
    if (!this.itemCodeMap) {
      const items = [
        'copper',
        'lead',
        'metaglass',
        'graphite',
        'sand',
        'coal',
        'titanium',
        'thorium',
        'scrap',
        'silicon',
        'plastanium',
        'phase-fabric',
        'surge-alloy',
        'spore-pod',
        'blast-compound',
        'pyratite',
        'beryllium',
        'tungsten',
        'oxide',
        'carbide',
        'fissile-matter',
        'dormant-cyst',
      ];

      this.itemCodeMap = new Map();
      items.forEach((name, index) => {
        this.itemCodeMap.set(name, index);
      });
    }

    const code = this.itemCodeMap.get(itemName);
    if (code === undefined) {
      throw new Error('Unknown item name: ' + itemName);
    }

    return code;
  }
}
Item.itemMap = new Map();

const Items = {
  copper: Item.create('copper'),
  lead: Item.create('lead'),
  metaglass: Item.create('metaglass'),
  graphite: Item.create('graphite'),
  sand: Item.create('sand'),
  coal: Item.create('coal'),
  titanium: Item.create('titanium'),
  thorium: Item.create('thorium'),
  scrap: Item.create('scrap'),
  silicon: Item.create('silicon'),
  plastanium: Item.create('plastanium'),
  phaseFabric: Item.create('phase-fabric'),
  surgeAlloy: Item.create('surge-alloy'),
  sporePod: Item.create('spore-pod'),
  blastCompound: Item.create('blast-compound'),
  pyratite: Item.create('pyratite'),
  beryllium: Item.create('beryllium'),
  tungsten: Item.create('tungsten'),
  oxide: Item.create('oxide'),
  carbide: Item.create('carbide'),
  fissileMatter: Item.create('fissile-matter'),
  dormantCyst: Item.create('dormant-cyst'),
};

var UnitCommand;
(function (UnitCommand) {
  UnitCommand[UnitCommand["attack"] = 0] = "attack";
  UnitCommand[UnitCommand["rally"] = 1] = "rally";
  UnitCommand[UnitCommand["idle"] = 2] = "idle";
})(UnitCommand || (UnitCommand = {}));

const liquidColors = {
  water: '#596ab8',
  slag: '#ffa166',
  oil: '#313131',
  cryofluid: '#6ecdec',
  neoplasm: '#c33e2b',
  arkycite: '#84a94b',
  gallium: '#9a9dbf',
  ozone: '#fc81dd',
  hydrogen: '#9eabf7',
  nitrogen: '#efe3ff',
  cyanogen: '#89e8b6',
};
class Liquid {
  constructor(name) {
    this.name = name;
    this.color = liquidColors[name];
  }
  static create(name) {
    let liquid = this.liquidMap.get(name);
    if (!liquid) {
      liquid = new Liquid(name);
      this.liquidMap.set(name, liquid);
    }
    return liquid;
  }
  static fromCode(code) {
    var _a;
    const liquids = [
      'water',
      'slag',
      'oil',
      'cryofluid',
      'neoplasm',
      'arkycite',
      'gallium',
      'ozone',
      'hydrogen',
      'nitrogen',
      'cyanogen',
    ];
    if (code > liquids.length - 1)
      throw new Error('Unknown liquid code: ' + code);
    const name = liquids[code];
    return (_a = this.liquidMap.get(name)) !== null && _a !== void 0 ? _a : this.create(name);
  }

  static liquidsCodeMap = null;

  // liquidName转code
  static toCode(liquidName) {
    if (!this.liquidsCodeMap) {
      const liquids = [
        'water',
        'slag',
        'oil',
        'cryofluid',
        'neoplasm',
        'arkycite',
        'gallium',
        'ozone',
        'hydrogen',
        'nitrogen',
        'cyanogen',
      ];

      this.liquidsCodeMap = new Map();
      liquids.forEach((name, index) => {
        this.liquidsCodeMap.set(name, index);
      });
    }

    const code = this.liquidsCodeMap.get(liquidName);
    if (code === undefined) {
      throw new Error('Unknown item name: ' + liquidName);
    }

    return code;
  }
}
Liquid.liquidMap = new Map();

const Liquids = {
  water: Liquid.create('water'),
  slag: Liquid.create('slag'),
  oil: Liquid.create('oil'),
  cryofluid: Liquid.create('cryofluid'),
  arkycite: Liquid.create('arkycite'),
  gallium: Liquid.create('gallium'),
  neoplasm: Liquid.create('neoplasm'),
  ozone: Liquid.create('ozone'),
  hydrogen: Liquid.create('hydrogen'),
  nitrogen: Liquid.create('nitrogen'),
  cyanogen: Liquid.create('cyanogen'),
};

var index = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Block: Block,
  get BlockOutput() { return BlockOutput; },
  get BlockOutputDirection() { return BlockOutputDirection; },
  Blocks: Blocks,
  Content: Content,
  Item: Item,
  Items: Items,
  Liquid: Liquid,
  Liquids: Liquids,
  MappableContent: MappableContent,
  get UnitCommand() { return UnitCommand; },
  UnlockableContent: UnlockableContent,
  blockAliases: blockAliases
});

/**
 * Similar to a DataView, but it has an auto incrementing offset.
 * A mix of `DataView` and the `DataInputStream` java class
 */
export class StreamedDataReader {
  constructor(buffer) {
    this.buffer = buffer;
    /**
     * Internal byte offset of this `StreamedDataView`
     */
    this.currentOffset = 0;
    this.data = new DataView(buffer);
  }
  /**
   * The current byte offset of this `StreamedDataView`
   */
  get offset() {
    return this.currentOffset;
  }
  /**
   * Reads the next 4 bytes as a 32-bit float value. There is
   * no alignment constraint; multi-byte values may be fetched from any offset.
   */
  getFloat32(littleEndian = false) {
    const value = this.data.getFloat32(this.currentOffset, littleEndian);
    this.currentOffset += 4;
    return value;
  }
  /**
   * Reads the next 8 bytes as a 64-bit float value. There is
   * no alignment constraint; multi-byte values may be fetched from any offset.
   */
  getFloat64(littleEndian = false) {
    const value = this.data.getFloat64(this.currentOffset, littleEndian);
    this.currentOffset += 8;
    return value;
  }
  /**
   * Reads the next byte as a 8-bit int. There is
   * no alignment constraint; multi-byte values may be fetched from any offset.
   */
  getInt8() {
    const value = this.data.getInt8(this.currentOffset);
    this.currentOffset++;
    return value;
  }
  /**
   * Reads the next 2 bytes as a 16-bit int. There is
   * no alignment constraint; multi-byte values may be fetched from any offset.
   */
  getInt16(littleEndian = false) {
    const value = this.data.getInt16(this.currentOffset, littleEndian);
    this.currentOffset += 2;
    return value;
  }
  /**
   * Reads the next 4 bytes as a 32-bit int. There is
   * no alignment constraint; multi-byte values may be fetched from any offset.
   */
  getInt32(littleEndian = false) {
    const value = this.data.getInt32(this.currentOffset, littleEndian);
    this.currentOffset += 4;
    return value;
  }
  /**
   * Reads the next byte as a 8-bit unsigned int. There is
   * no alignment constraint; multi-byte values may be fetched from any offset.
   */
  getUint8() {
    const value = this.data.getUint8(this.currentOffset);
    this.currentOffset++;
    return value;
  }
  /**
   * Reads the next 2 bytes as a 16-bit unsigned int. There is
   * no alignment constraint; multi-byte values may be fetched from any offset.
   */
  getUint16(littleEndian = false) {
    const value = this.data.getUint16(this.currentOffset, littleEndian);
    this.currentOffset += 2;
    return value;
  }
  /**
   * Reads the next 4 bytes as a 32-bit unsigned int. There is
   * no alignment constraint; multi-byte values may be fetched from any offset.
   */
  getUint32(littleEndian = false) {
    const value = this.data.getUint32(this.currentOffset, littleEndian);
    this.currentOffset += 4;
    return value;
  }
  /**
   * Reads the next 8 bytes as a 64-bit int. There is
   * no alignment constraint; multi-byte values may be fetched from any offset.
   */
  getBigInt64(littleEndian = false) {
    const value = this.data.getBigInt64(this.currentOffset, littleEndian);
    this.currentOffset += 8;
    return value;
  }
  /**
   * Reads the next 8 bytes as a 64-bit unsigned int. There is
   * no alignment constraint; multi-byte values may be fetched from any offset.
   */
  getBigUint64(littleEndian = false) {
    const value = this.data.getBigUint64(this.currentOffset, littleEndian);
    this.currentOffset += 8;
    return value;
  }
  /**
   * Returns a unicode character with the code from the next byte
   */
  getChar() {
    return String.fromCharCode(this.getUint8());
  }
  /**
   * Reads a string that has been encoded using a
   * modified UTF-8
   * format.
   */
  getString() {
    const utflen = this.getUint16();
    const buffer = this.buffer.slice(this.currentOffset, this.currentOffset + utflen);
    this.currentOffset += utflen;
    return new TextDecoder().decode(buffer);
  }
  /**
   * Reads the next byte as a boolean
   */
  getBool() {
    const value = this.getInt8();
    if (value < 0)
      throw new Error('Bat byte input');
    return value !== 0;
  }
}

export class StreamedDataWriter {
  constructor(buffer) {
    this.buffer = buffer;
    /**
     * Internal byte offset of this `StreamedDataView`
     */
    this.currentOffset = 0;
    this.data = new DataView(buffer);
  }
  /**
   * The current byte offset of this `StreamedDataView`
   */
  get offset() {
    return this.currentOffset;
  }
  /**
   * Ensures that `min` bytes are avaliable for write
   */
  ensure(min) {
    const length = this.buffer.byteLength;
    if (this.currentOffset + min <= length)
      return;
    // get the minimum power of 2 that can multiply length
    const p = Math.ceil(Math.log2((length + min) / length));
    const result = new Uint8Array(length * Math.pow(2, p));
    result.set(new Uint8Array(this.buffer));
    this.buffer = result.buffer;
    this.data = new DataView(this.buffer);
  }
  /**
   * Writes a 32-bit float in the next 4 bytes. There is
   */
  setFloat32(value, littleEndian = false) {
    this.ensure(4);
    this.data.setFloat32(this.currentOffset, value, littleEndian);
    this.currentOffset += 4;
  }
  /**
   * Writes a 64-bit float in the next 8 bytes.
   */
  setFloat64(value, littleEndian = false) {
    this.ensure(8);
    this.data.setFloat64(this.currentOffset, value, littleEndian);
    this.currentOffset += 8;
  }
  /**
   * Writes a 8-bit int in the next byte.
   */
  setInt8(value) {
    this.ensure(1);
    this.data.setInt8(this.currentOffset, value);
    this.currentOffset++;
  }
  /**
   * Writes a 16-bit int in the next 2 bytes.
   */
  setInt16(value, littleEndian = false) {
    this.ensure(2);
    this.data.setInt16(this.currentOffset, value, littleEndian);
    this.currentOffset += 2;
  }
  /**
   * Writes a 32-bit int in the next 2 bytes.
   */
  setInt32(value, littleEndian = false) {
    this.ensure(4);
    this.data.setInt32(this.currentOffset, value, littleEndian);
    this.currentOffset += 4;
  }
  /**
   * Writes a 8-bit unsigned int in the next byte.
   */
  setUint8(value) {
    this.ensure(1);
    this.data.setUint8(this.currentOffset, value);
    this.currentOffset++;
  }
  /**
   * Writes a 16-bit unsigned int in the next 2 bytes.
   */
  setUint16(value, littleEndian = false) {
    this.ensure(2);
    this.data.setUint16(this.currentOffset, value, littleEndian);
    this.currentOffset += 2;
  }
  /**
   * Writes a 32-bit unsigned int in the next 4 bytes.
   */
  setUint32(value, littleEndian = false) {
    this.ensure(4);
    this.data.setUint32(this.currentOffset, value, littleEndian);
    this.currentOffset += 4;
  }
  /**
   * Writes a 64-bit bigint in the next 8 bytes.
   */
  setBigInt64(value, littleEndian = false) {
    this.ensure(8);
    this.data.setBigInt64(this.currentOffset, value, littleEndian);
    this.currentOffset += 8;
  }
  /**
   * Writes a 64-bit bigint in the next 8 bytes.
   */
  setBigUint64(value, littleEndian = false) {
    this.ensure(8);
    this.data.setBigUint64(this.currentOffset, value, littleEndian);
    this.currentOffset += 8;
  }
  /**
   * Returns a unicode character with the code from the next byte
   */
  setChar(value) {
    this.ensure(1);
    this.setUint8(value.charCodeAt(0));
  }
  /**
   * Reads a string that has been encoded using a
   * modified UTF-8
   * format.
   */
  setString(str) {
    const result = new TextEncoder().encode(str);
    const length = result.byteLength;
    this.ensure(length + 2);
    this.setInt16(length);
    new Uint8Array(this.buffer).set(result, this.currentOffset);
    this.currentOffset += length;
    return length;
  }
  /**
   * Writes a boolean in the next byte
   */
  setBool(value) {
    this.ensure(1);
    this.setInt8(value ? 1 : 0);
  }

  setUint8Array(array) {
    this.ensure(array.length);
    new Uint8Array(this.buffer).set(array, this.currentOffset);
    this.currentOffset += array.length;
  }
}

const { distribution: { Sorter, InvertedSorter, MassDriver, ItemBridge, PhaseConveyor, }, storage: { Unloader }, sandbox: { ItemSource, LiquidSource, LightBlock }, environment: { AirBlock }, } = Blocks;
const header = 'msch';
export function isValid(data, consumeData = false) {
  if (consumeData) {
    for (const char of header) {
      if (char !== data.getChar())
        return false;
    }
    return true;
  }
  for (let i = 0; i < header.length; i++) {
    if (header[i] !== String.fromCharCode(data.data.getUint8(i))) {
      return false;
    }
  }
  return true;
}
export function decodeCompressedData(data) {
  const bytes = Pako.inflate(new Uint8Array(data.buffer).subarray(data.offset));
  return new StreamedDataReader(bytes.buffer);
}
export function decodeTags(cData) {
  const tags = new Map();
  const numberOfTags = cData.getInt8();
  for (let i = 0; i < numberOfTags; i++) {
    const name = cData.getString();
    const value = cData.getString();
    tags.set(name, value);
  }
  return tags;
}
export function decodeBlocks(cData) {
  const length = cData.getInt8();
  const blocks = [];
  for (let i = 0; i < length; i++) {
    const string = cData.getString()
    const block = Block.fromCode(string);
    blocks.push(block);
  }
  return blocks;
}
export function mapConfig(block, value, position) {
  // by now, lets just throw the config info away
  if (block instanceof Sorter ||
    block instanceof InvertedSorter ||
    block instanceof Unloader ||
    block instanceof ItemSource) {
    return Item.fromCode(value);
  }
  if (block instanceof LiquidSource) {
    return Liquid.fromCode(value);
  }
  if (block instanceof MassDriver ||
    block instanceof ItemBridge ||
    block instanceof PhaseConveyor) {
    return Point2.unpack(value).sub(Point2.x(position), Point2.y(position));
  }
  if (block instanceof LightBlock)
    return value;
  return null;
}
export function readConfigObject(cData) {
  const type = cData.getInt8();
  switch (type) {
    case 0:
      return null;
    case 1:
      return cData.getInt32();
    case 2:
      const data = cData.getBigInt64();
      return data;
    case 3:
      return cData.getFloat32();
    case 4: {
      const exists = cData.getInt8();
      if (exists !== 0) {
        return cData.getString();
      }
      return null;
    }
    case 5: {
      const value = cData.getInt8();
      const code = cData.getInt16();
      switch (value) {
        case 0:
          return Item.fromCode(code);
        case 4:
          return Liquid.fromCode(code);
        default:
          return;
      }
    }
    // return Vars.content.getByID(
    //   (ContentType[
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     ContentType[cData.getInt8()] as any
    //   ] as unknown) as ContentType,
    //   cData.getInt16()
    // )
    // original code:
    // return content.getByID(ContentType.all[read.b()], read.s());
    case 6: {
      const length = cData.getInt16();
      return readArray(length, () => cData.getInt32());
    }
    // original code
    // short length = read.s(); IntSeq arr = new IntSeq(); for (int i = 0; i < length; i++) arr.add(read.i()); return arr;
    case 7:
      return new Point2(cData.getInt32(), cData.getInt32());
    case 8: {
      const len = cData.getInt8();
      return readArray(len, () => Point2.unpack(cData.getInt32()));
    }
    // TODO: somehow implement java code bellow
    case 9:
      //  by now just ignore the config data
      cData.getInt8();
      cData.getInt16();
      return;
    // return TechTree.getNotNull(content.getByID(ContentType.all[read.b()], read.s()));
    case 10:
      return cData.getBool();
    // return read.bool();
    case 11:
      return cData.getFloat64();
    // return read.d();
    case 12:
      cData.getInt32();
      return;
    // return world.build(read.i());
    case 13:
      cData.getInt16();
      return;
    // return LAccess.all[read.s()];
    case 14: {
      const blen = cData.getInt32();
      return readArray(blen, () => cData.getInt8());
    }
    // int blen = read.i(); byte[] bytes = new byte[blen]; read.b(bytes); return bytes;
    case 15:
      return UnitCommand[cData.getInt8()];
    case 16: {
      const len = cData.getInt32();
      return readArray(len, () => cData.getBool());
    }
    case 17: {
      cData.getInt32();
      return;
    }
    case 18: {
      const len = cData.getInt16();
      return readArray(len, () => new Vec2(cData.getFloat32(), cData.getFloat32()));
    }
    case 19:
      return new Vec2(cData.getFloat32(), cData.getFloat32());
    case 20: {
      cData.getUint8();
      return;
    }
    case 21: {
      const len = cData.getInt16();
      return readArray(len, () => cData.getInt32());
    }
    case 22: {
      const len = cData.getInt32();
      return readArray(len, () => readConfigObject(cData));
    }
    case 23: {
      cData.getUint16();
      return;
    }
    default:
      throw new Error('Unknown object type: ' + type);
    // throw new IllegalArgumentException('Unknown object type: ' + type)
  }
}
export function readArray(length, fn) {
  const result = new Array(length);
  for (let i = 0; i < length; i++) {
    result[i] = fn();
  }
  return result;
}

export function decodeTiles(cData, blocks, version) {
  const total = cData.getInt32();
  const tiles = [];
  for (let i = 0; i < total; i++) {
    const block = blocks[cData.getInt8()];
    const position = cData.getInt32();
    const config = version === 0
      ? mapConfig(block, cData.getInt32(), position)
      : readConfigObject(cData);
    const rotation = cData.getInt8();
    if (block instanceof AirBlock)
      continue;
    tiles.push(new SchematicTile(block, Point2.x(position), Point2.y(position), config, rotation));
  }
  return tiles;
}
export function decodeSchematicSize(cData) {
  const width = cData.getInt16(), height = cData.getInt16();
  return { width, height };
}

export class tileConfigEncoder {
  constructor(version) {
    this.version = version;
    this.isLegacy = (version === 'v5' ? 0 : 1) === 0;
  }

  calculateSize(config) {
    if (this.isLegacy) {
      return 4;
    } else {
      return this.calculateObjectSize(config);
    }
  }

  write(writer, config) {
    if (this.isLegacy) {
      const packedValue = this.packConfig(block, config, position);
      writer.setInt32(packedValue);
    } else {
      this.writeConfigObject(writer, config);
    }
  }

  packConfig(block, config, position) {
    if (!block) return 0;

    if (block instanceof Sorter ||
      block instanceof InvertedSorter ||
      block instanceof Unloader ||
      block instanceof ItemSource) {
      return config?.code || 0;
    }

    if (block instanceof LiquidSource) {
      return config?.code || 0;
    }

    if (block instanceof MassDriver ||
      block instanceof ItemBridge ||
      block instanceof PhaseConveyor) {
      if (!config || !position) return 0;
      // calculate absolute position
      const absX = position.x + config.x;
      const absY = position.y + config.y;
      return Point2.pack(absX, absY);
    }

    if (block instanceof LightBlock) {
      return config || 0;
    }

    return 0; // 默认值
  }

  // version !== 'v5'
  calculateObjectSize(config) {
    if (config === null || config === undefined) {
      return 1; // type 0: null (1 byte)
    }

    const typeName = config.constructor?.name || typeof config;

    switch (typeName) {
      case 'Number':
        // 整数和浮点数都占用5字节：类型标记(1) + 数值(4)
        return 1 + 4;

      case 'Boolean':
        // 布尔值占用2字节：类型标记(1) + 布尔值(1)
        return 1 + 1;

      case 'String':
        // 字符串占用可变字节：类型标记(1) + 存在标志(1) + 长度(2) + 内容长度
        return 1 + 1 + new TextEncoder(config.length).encode(config).length;

      case 'Item':
      case 'Liquid':
        // Item和Liquid类型都占用4字节：类型标记(1) + 子类型(1) + 编码(2)
        return 1 + 1 + 2;

      case 'Point2':
      case 'Vec2':
        // Point2和Vec2类型都占用9字节：类型标记(1) + x坐标(4) + y坐标(4)
        return 1 + 4 + 4;

      default:
        if (Array.isArray(config)) {
          if (config.length === 0) {
            // 空数组占用2字节：类型标记(1) + 长度(1)
            return 1 + 1;
          }

          const firstItemType = config[0].constructor?.name;
          if (firstItemType === "Point2") {
            // Point2数组：类型标记(1) + 长度(1) + 每个点4字节
            return 1 + 1 + (config.length * 4);
          } else if (firstItemType === 'Number') {
            // 数字数组：类型标记(1) + 长度(2) + 每个数字4字节
            return 1 + 2 + (config.length * 4);
          } else {
            throw new Error(`Unsupported array config type: ${firstItemType}`);
          }
        } else {
          throw new Error(`Unsupported config type: ${typeName}`);
        }
    }
  }

  // version !== 'v5'
  writeConfigObject(writer, config) {
    if (config === null || config === undefined) {
      writer.setInt8(0); // type 0: null
      return;
    }

    const typeName = config.constructor?.name || typeof config;

    switch (typeName) {
      case 'Number':
        if (Number.isInteger(config)) {
          writer.setInt8(1); // type 1: int32
          writer.setInt32(config);
        } else {
          writer.setInt8(3); // type 3: float32
          writer.setFloat32(config);
        }
        return;

      case 'Boolean':
        writer.setInt8(10); // type 10: boolean
        writer.setBool(config);
        return;

      case 'String':
        writer.setInt8(4); // type 4: string
        writer.setInt8(1); // exists flag
        writer.setString(config);
        return;

      case 'Item':
        writer.setInt8(5); // type 5: content
        writer.setInt8(0); // item type
        writer.setInt16(Item.toCode(config.code));
        return;

      case 'Liquid':
        writer.setInt8(5); // type 5: content
        writer.setInt8(4); // liquid type
        writer.setInt16(Liquid.toCode(config.name));
        return;

      case 'Point2':
        writer.setInt8(7); // type 7: Point2
        writer.setInt32(config.x);
        writer.setInt32(config.y);
        return;

      case 'Vec2':
        writer.setInt8(19); // type 19: Vec2
        writer.setFloat32(config.x);
        writer.setFloat32(config.y);
        return;
    }

    // 处理数组类型
    if (Array.isArray(config)) {
      if (config.length === 0) {
        writer.setInt8(8); // type 8: Point2[]
        writer.setInt8(0); // length 0
        return;
      }

      const firstItemType = config[0].constructor?.name;
      if (firstItemType === "Point2") {
        writer.setInt8(8); // type 8: Point2[]
        writer.setInt8(config.length);
        config.forEach(p => writer.setInt32(Point2.pack(p.x, p.y)));
      } else if (firstItemType === 'Number') {
        writer.setInt8(6); // type 6: int[]
        writer.setInt16(config.length);
        config.forEach(n => writer.setInt32(n));
      } else {
        throw new Error(`Unsupported array config type: ${firstItemType}`);
      }
      return;
    }

    // 未知类型
    throw new Error(`Unsupported config type: ${typeName}`);
  }
}