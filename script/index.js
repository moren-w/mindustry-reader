import $ from "jquery"
import { pics } from "../src/background/background.js"
import { book } from "./generater/book.js"
import { encodeSchematic } from './encode/encode.js'

function background() {
  const element = $(".background")
  element.css("filter", "blur(4px)")
  setTimeout(() => {
    element.css("backgroundImage", "url(/src/background/" + pics[Math.floor(Math.random() * pics.length)] + ")")
    element.css("filter", "blur(0px)")
  }, 400);
}
background()
setInterval(background, 20 * 1000)

function generateBook() {
  const title = $("#title").val()
  const text = $("#text").val()
  const schematic = book(text, title)
  const base64 = encodeSchematic(schematic)
  console.log(base64)
}
$("#start").on("click", generateBook)