import { Tiles } from "../schematic/Tiles.js"
import { Schematic } from "../schematic/Schematic.js"

export function book(text, title, blockType) {
  const chunks = splitTextByLength(text);
  const width = Math.ceil(Math.sqrt(chunks.length))
  const height = Math.ceil(chunks.length / width)
  const tiles = new Tiles(width, height)

  for (let i = 0; i < chunks.length; i++) {
    tiles.setTile(i % width, height - 1 - Math.floor(i / width), { n: blockType, r: 0, config: chunks[i] })
  }

  const schematicTiles = tiles.toSchematicTiles()
  const tags = new Map()
  tags.set("name", title ? title : "Untitled")
  tags.set("description", text.slice(0, 50) + (text.length > 50 ? "..." : ""))
  tags.set("contentMap", "{}")
  tags.set("labels", '["114"],["[#ffffffff][#ff69b4ff]moren"]')
  const schematic = new Schematic({
    tiles: schematicTiles,
    height: width,
    tags: tags,
    width: height
  })
  return schematic
}

function splitTextByLength(text, chunkSize = 400) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize))
  }
  return chunks
}