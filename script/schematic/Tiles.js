// 实现配置方块数据格式与控制tiles配置
import { SchematicTile, Block } from "../mindustry-schematic-parser/index.js"

/**
 * Tiles 类用于管理和操作蓝图中的方块网格数据
 */
export class Tiles {
  /**
   * 构造函数，初始化网格尺寸和数据
   * @param {number} width - 网格宽度
   * @param {number} height - 网格高度
   */
  constructor(width = 64, height = 64) {
    this.width = width
    this.height = height
    this.length = width * height
    this.tiles = new Array(this.length)
    this.precomputedIndices = this.precomputeIndices()
  }
  /**
   * 预计算每个坐标对应的索引，提升访问效率
   * @returns {Array<Array<number>>} 二维数组，存储每个[x][y]对应的索引
   */
  precomputeIndices() {
    const indices = new Array(this.height)
    for (let y = 0; y < this.height; y++) {
      indices[y] = new Array(this.width)
      for (let x = 0; x < this.width; x++) {
        indices[y][x] = y * this.width + x
      }
    }
    return indices
  }
  /**
   * 更改网格尺寸，保留原有数据，新增区域可自定义填充
   * @param {number} newWidth - 新宽度
   * @param {number} newHeight - 新高度
   * @param {function} fillCallback - 新增区域的填充值回调
   * @returns {Tiles} 返回自身
   */
  resize(newWidth, newHeight, fillCallback = null) {
    if (newWidth === this.width && newHeight === this.height) {
      return this
    }

    const newLength = newWidth * newHeight
    const newTiles = new Array(newLength)

    const minWidth = Math.min(this.width, newWidth)
    const minHeight = Math.min(this.height, newHeight)

    for (let y = 0; y < minHeight; y++) {
      for (let x = 0; x < minWidth; x++) {
        const oldIndex = this.getIndex(x, y)
        const newIndex = y * newWidth + x
        newTiles[newIndex] = this.tiles[oldIndex]
      }
    }

    // 填充新增区域
    if (fillCallback) {
      this.fillNewArea(newTiles, newWidth, newHeight, minWidth, minHeight, fillCallback)
    }

    // 更新属性
    this.tiles = newTiles
    this.width = newWidth
    this.height = newHeight
    this.length = newLength
    this.precomputedIndices = this.precomputeIndices()

    return this
  }

  /**
   * 填充resize后新增的区域
   * @param {Array} newTiles - 新的tiles数组
   * @param {number} newWidth - 新宽度
   * @param {number} newHeight - 新高度
   * @param {number} minWidth - 原有最小宽度
   * @param {number} minHeight - 原有最小高度
   * @param {function} fillCallback - 填充值回调
   */
  fillNewArea(newTiles, newWidth, newHeight, minWidth, minHeight, fillCallback) {
    // 填充右侧新增列
    for (let y = 0; y < minHeight; y++) {
      for (let x = minWidth; x < newWidth; x++) {
        const index = y * newWidth + x
        newTiles[index] = fillCallback(x, y)
      }
    }

    // 填充底部新增行
    for (let y = minHeight; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const index = y * newWidth + x
        newTiles[index] = fillCallback(x, y, 'expand-bottom')
      }
    }
  }

  /**
   * 扩展网格尺寸（向右、向下），可指定填充值
   * @param {number} right - 右侧扩展宽度
   * @param {number} bottom - 下方扩展高度
   * @param {function} fillCallback - 填充值回调
   * @returns {Tiles} 返回自身
   */
  expand(right = 0, bottom = 0, fillCallback = null) {
    return this.resize(this.width + right, this.height + bottom, fillCallback)
  }

  /**
   * 裁剪网格到指定区域
   * @param {number} x1 - 左上角x
   * @param {number} y1 - 左上角y
   * @param {number} x2 - 右下角x
   * @param {number} y2 - 右下角y
   * @returns {Tiles} 返回自身
   */
  crop(x1, y1, x2, y2) {
    const newWidth = x2 - x1 + 1
    const newHeight = y2 - y1 + 1
    const newTiles = new Array(newWidth * newHeight)

    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        const oldIndex = this.getIndex(x, y)
        const newIndex = (y - y1) * newWidth + (x - x1)
        newTiles[newIndex] = this.tiles[oldIndex]
      }
    }

    this.tiles = newTiles
    this.width = newWidth
    this.height = newHeight
    this.length = newWidth * newHeight
    this.precomputedIndices = this.precomputeIndices()

    return this
  }
  /**
   * 获取指定坐标的索引
   * @param {number} x
   * @param {number} y
   * @returns {number} 索引
   */
  getIndex(x, y) {
    return this.precomputedIndices[y][x]
  }

  /**
   * 获取指定坐标的索引
   * @param {number} x
   * @param {number} y
   * @param {any} config - 包括block的name, config, rotation
   * @returns {Tiles} 返回自身
   */
  setTile(x, y, config) {
    const index = this.getIndex(x, y)
    this.tiles[index] = {
      ...config,
      x,
      y
    }
    return this
  }
  /**
   * 获取指定坐标的方块数据
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @returns {object|undefined} 指定位置的方块数据对象，若无则为undefined
   */
  getTile(x, y) {
    const index = this.getIndex(x, y)
    return this.tiles[index]
  }
  // setTilesBatch(tilesData) {
  //   if (tilesData.name)
  //   for (const {
  //       x,
  //       y,
  //       ...config
  //     }
  //     of tilesData) {
  //     const index = this.getIndex(x, y)
  //     this.tiles[index] = {
  //       ...config,
  //       x,
  //       y
  //     }
  //   }
  //   return this
  // }
  /**
   * 批量设置多个方块
   * @param {Array<Array<number, number, object, *>>} tilesData - 坐标及配置数组，格式为[[x, y, tileConfig], ...]
   * @param {object} [config={}] - 额外合并到每个方块的数据
   * @returns {Tiles} 返回自身
   */
  setTilesBatch(tilesData, config = {}) {
    if (!Array.isArray(tilesData)) {
      console.warn('tilesData must be an array of coordinates')
      return this
    }

    for (const coords of tilesData) {
      if (!Array.isArray(coords) || coords.length < 2) {
        console.warn('Invalid coordinate format, expected [x, y]')
        continue
      }

      const [x, y, tileConfig] = coords

      if (typeof x !== 'number' || typeof y !== 'number') {
        console.warn('Coordinates must be numbers')
        continue
      }

      const index = this.getIndex(x, y)
      this.tiles[index] = { ...config, ...tileConfig, x, y }
    }
    return this
  }
  /**
   * 获取指定区域内的所有方块
   * @param {number} x1 - 区域左上角x
   * @param {number} y1 - 区域左上角y
   * @param {number} x2 - 区域右下角x
   * @param {number} y2 - 区域右下角y
   * @returns {Array} 区域内所有方块对象数组
   */
  getTilesInArea(x1, y1, x2, y2) {
    const result = [];
    for (let y = y1; y <= y2; y++) {
      const rowStart = y * this.width;
      for (let x = x1; x <= x2; x++) {
        const tile = this.tiles[rowStart + x];
        if (tile) result.push(tile)
      }
    }
    return result
  }
  /**
   * 获取指定行的所有方块
   * @param {number} y - 行号
   * @returns {Array} 该行所有方块对象数组
   */
  getRow(y) {
    const row = []
    const startIndex = y * this.width
    for (let x = 0; x < this.width; x++) {
      row.push(this.tiles[startIndex + x])
    }
    return row
  }
  /**
   * 获取指定列的所有方块
   * @param {number} x - 列号
   * @returns {Array} 该列所有方块对象数组
   */
  getColumn(x) {
    const column = []
    for (let y = 0; y < this.height; y++) {
      column.push(this.tiles[this.getIndex(x, y)])
    }
    return column
  }
  /**
   * 按指定模式批量填充方块
   * @param {Array<Array>} pattern - 二维数组，表示要填充的布局
   * @param {number} startX - 填充起始x坐标
   * @param {number} startY - 填充起始y坐标
   * @returns {Tiles} 返回自身
   */
  fillPattern(pattern, startX, startY) {
    const maxY = Math.min(this.height, startY + pattern.length)
    for (let py = 0, y = startY; y < maxY; py++, y++) {
      const row = pattern[py]
      const maxX = Math.min(this.width, startX + row.length)
      for (let px = 0, x = startX; x < maxX; px++, x++) {
        const index = y * this.width + x
        this.tiles[index] = { ...row[px], x, y }
      }
    }
    return this
  }
  /**
   * 查找所有指定类型的方块
   * @param {string} name - 方块类型
   * @returns {Array} 所有匹配类型的方块对象数组
   */
  findTilesByName(name) {
    const result = [];
    for (let i = 0; i < this.length; i++) {
      const tile = this.tiles[i]
      if (tile && tile.n === name) {
        result.push(tile)
      }
    }
    return result
  }
  /**
   * 转换为 mindustry-schematic-parser 所需的 tiles 格式
   * @returns {Array} SchematicTile 对象数组
   */
  toSchematicTiles() {
    const SchematicTiles = []
    for (const tile of this.tiles) {
      if (tile) {
        const block = Block.fromCode(tile.n) // tile.n为方块名称
        SchematicTiles.push(new SchematicTile(block, tile.x, tile.y, tile.config || null, tile.r || 0)) // tile.r为旋转
      }
    }
    return SchematicTiles
  }
  /**
   * 克隆当前 Tiles 对象
   * @returns {Tiles} 新的 Tiles 实例，内容为当前副本
   */
  clone() {
    const newMap = new tiles(this.width, this.height)
    newMap.tiles = [...this.tiles]
    return newMap
  }
}