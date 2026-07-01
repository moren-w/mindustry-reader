import $ from "jquery"
import { pics } from "../src/backgrounds/background.js"
import { book } from "./generater/book.js"
import { encodeSchematicToBase64 } from './encode/encode.js'
import ClipboardJS from 'clipboard';

let blockType = "message"

function background() {
  const element = $(".background")
  element.css("filter", "blur(4px)")
  setTimeout(() => {
    element.css("backgroundImage", "url(/src/backgrounds/" + pics[Math.floor(Math.random() * pics.length)] + ")")
    element.css("filter", "blur(0px)")
  }, 400);
}
background()
setInterval(background, 20 * 1000)

$("#start").on("click", () => {
  const title = $("#title").val()
  const text = $("#text").val()
  const author = $("#author").val()
  const schematic = book(text, title, blockType, author)
  const base64 = encodeSchematicToBase64(schematic)
  $("#output_base64").val(base64)
})

$("#title, #text, #author").on("keypress", function (e) {
  if (e.which === 13) {
    generateBook()
  }
})

$("#import").on("click", function () {
  const fileInput = document.createElement("input")
  fileInput.type = "file"
  fileInput.addEventListener("change", function () {
    const file = fileInput.files[0]
    const reader = new FileReader()
    reader.onload = function (e) {
      const contents = e.target.result
      $("#text").val(contents)
    }
    reader.readAsText(file)
  })
  fileInput.click()
})

$(".messages").children("img").on("click", function () {
  blockType = $(this).attr("alt")
  $(".messages").children("img").css({"transform": "", "border": "none"})
  $(this).css({"transform": "scale(1.1)", "border": "4px solid #ffd37f"})
})

new ClipboardJS('#copy');