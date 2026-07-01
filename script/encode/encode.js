import { Schematic } from "mindustry-schematic-parser"
import { base64ToBytes, StreamedDataReader, isValid, decodeCompressedData, decodeSchematicSize, decodeTags, decodeBlocks, decodeTiles, StreamedDataWriter, tileConfigEncoder, bytesToBase64, Point2 } from "../mindustry-schematic-parser/index.js"
import * as Pako from "pako"

// test
function decodeOnlyTiles(encoded) {
  const decoded = typeof encoded === 'string' ? base64ToBytes(encoded.trim()) : encoded
  const arr = new Uint8Array(decoded)
  const data = new StreamedDataReader(arr.buffer)

  if (!isValid(data, true)) {
    throw new Error('Parsing error: this is not a valid schematic')
  }
  const version = data.getInt8()
  const cData = decodeCompressedData(data)
  const size = decodeSchematicSize(cData)
  const tags = decodeTags(cData)
  const blocks = decodeBlocks(cData)
  console.log('size: ', size, '\ntags: ', tags, '\nblocks: ', blocks.toString())
  const tiles = decodeTiles(cData, blocks, version)

  return tiles;
}

function encodeSize(width, height) {
  const writer = new StreamedDataWriter(new ArrayBuffer(4))

  writer.setInt16(width)
  writer.setInt16(height)

  return new Uint8Array(writer.buffer)
}

function encodeTags(tags) {
  const encoder = new TextEncoder()
  let totalBytes = 1
  if (tags.size !== 0) {
    totalBytes += 4 * tags.size

    tags.forEach((value, key) => {
      totalBytes += encoder.encode(key).byteLength + encoder.encode(value).byteLength
    })
  }

  const writer = new StreamedDataWriter(new ArrayBuffer(totalBytes))
  writer.setInt8(tags.size || 0)
  if (tags.size === 0) return new Uint8Array(writer.buffer)
  tags.forEach((value, key) => {
    writer.setString(key)
    writer.setString(value !== null && value !== void 0 ? value : '')
  })

  return new Uint8Array(writer.buffer)
}

function encodeBlocks(tiles) {
  let blockArray = []
  const encoder = new TextEncoder()
  let totalBytes = 1
  for (const tile of tiles) {
    if (blockArray.includes(tile.block.name)) continue
    blockArray.push(tile.block.name)
    totalBytes += encoder.encode(tile.block.name).byteLength + 2
  }

  const writer = new StreamedDataWriter(new ArrayBuffer(totalBytes))

  writer.setInt8(blockArray.length)
  for (const blockName of blockArray) {
    writer.setString(blockName)
  }

  const buffer = new Uint8Array(writer.buffer)
  return { buffer: buffer, blockArray: blockArray }
}

function encodeTiles(version, tiles, blockArray) {
  const configEncoder = new tileConfigEncoder(version)

  let totalSize = 4 + tiles.length * 6 // tiles.length + all of (blockIndex + position + rotation)

  for (const tile of tiles) {
    totalSize += configEncoder.calculateSize(tile.config)
  }

  const writer = new StreamedDataWriter(new ArrayBuffer(totalSize))

  writer.setInt32(tiles.length)

  for (const tile of tiles) {
    const blockIndex = blockArray.findIndex(b => b === tile.block.name)
    if (blockIndex === -1) {
      throw new Error(`Block '${tile.block}' not found in blocks array`)
    }
    writer.setInt8(blockIndex)

    const position = Point2.pack(tile.x, tile.y)
    writer.setInt32(position)

    configEncoder.write(writer, tile.config)

    writer.setInt8(tile.rotation)
  }

  return new Uint8Array(writer.buffer)
}

/**
 * 
 * @param {Schematic} schematic 
 * @returns {Uint8Array}
 */
function encodeSchematic(schematic) {
  const size = encodeSize(schematic.width, schematic.height)
  const tags = encodeTags(schematic.tags)
  const { buffer: blocks, blockArray } = encodeBlocks(schematic.tiles)
  const tiles = encodeTiles(schematic.version, schematic.tiles, blockArray)

  const buffer = concatBytes([size, tags, blocks, tiles]) // without header and version
  const bytes = Pako.deflate(new Uint8Array(buffer))

  const resultWriter = new StreamedDataWriter(new ArrayBuffer(bytes.byteLength + 5))
  // add header and version at the front
  resultWriter.setChar('m')
  resultWriter.setChar('s')
  resultWriter.setChar('c')
  resultWriter.setChar('h')
  resultWriter.setInt8(schematic.version === 'v5' ? 0 : 1)

  const resultBuffer = new Uint8Array(resultWriter.buffer)
  resultBuffer.set(bytes, 5)

  return resultBuffer
}

/**
 * 将 schematic 编码为 base64 字符串
 * @param {Schematic} schematic 
 * @returns {String} base64 编码的字符串
 */
export function encodeSchematicToBase64(schematic) {
  return bytesToBase64(encodeSchematic(schematic))
}

/**
 * 将 schematic 编码为文件
 * @param {Schematic} schematic 
 * @param {String} filename 
 * @returns {Blob} Blob 对象，可用于下载
 */
export function encodeSchematicToFile(schematic) {
  const blob = new Blob([encodeSchematic(schematic)], { type: 'application/octet-stream' })
  return blob
}

/**
 * 合并多个二进制数据（模拟 Buffer.concat）
 * @param {Array<Uint8Array|ArrayBuffer|number[]>} arrays - 要合并的数组
 * @returns {Uint8Array} 合并后的 Uint8Array
 */
function concatBytes(arrays) {
  let totalLength = 0;
  for (const arr of arrays) {
    const bytes = toUint8Array(arr);
    totalLength += bytes.length;
  }

  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const arr of arrays) {
    const bytes = toUint8Array(arr);
    result.set(bytes, offset);
    offset += bytes.length;
  }

  return result;
}

/**
 * 转换为 Uint8Array
 * @param {Uint8Array|ArrayBuffer|number[]} data
 * @returns {Uint8Array}
 */
function toUint8Array(data) {
  if (data instanceof Uint8Array) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  if (Array.isArray(data)) {
    return new Uint8Array(data);
  }
  if (data instanceof Buffer) {
    return new Uint8Array(data);
  }
  throw new Error('不支持的数据类型');
}