import $ from "jquery"
import { pics } from "./background.js"
import { book } from "./generater/book.js"
import { encodeSchematicToBase64, encodeSchematicToFile } from './encode/encode.js'
import ClipboardJS from 'clipboard';

let blockType = "message"

function background() {
  const element = $(".background")
  element.css("filter", "blur(6px)")
  setTimeout(() => {
    element.css("backgroundImage", "url(/backgrounds/" + pics[Math.floor(Math.random() * pics.length)] + ")")
    element.css("filter", "blur(0px)")
  }, 600);
}
background()
setInterval(background, 20 * 1000)

$("#start").on("click", () => {
  const title = $("#title").val() ? $("#title").val() : "无题"
  const text = $("#text").val() ? $("#text").val() : "啥都木有"
  const author = $("#author").val()
  const schematic = book(text, title, blockType, author)
  const base64 = encodeSchematicToBase64(schematic)
  $("#output_base64").val(base64)

  $("#file_name").text(title + ".msch")
  const blob = encodeSchematicToFile(schematic)
  const url = URL.createObjectURL(blob)

  $("#export").off("click").on("click", function () {
    const a = document.createElement("a")
    a.href = url
    a.download = title + ".msch"
    a.click()
    a.remove()
  })
})

$("#title, #text, #author").on("keypress", function (e) {
  if (e.which === 13) {
    generateBook()
  }
})

$("#import").on("click", importFile)
function importFile() {
  const fileInput = document.createElement("input")
  fileInput.type = "file"
  fileInput.accept = ".txt,.text,.md,.markdown,.json,.js,.html,.css,.csv,.log,.xml,.yml,.yaml,.ini,.conf,.cfg,.bat,.sh,.properties,.toml,.rst,.tex,.bib,.r,.pl,.php,.py,.rb,.go,.java,.c,.cpp,.h,.hpp,.cs,.swift,.kt,.m,.mm,.ts,.tsx,.vue,.dart,.lua,.sql,.ps1,.vbs,.asm,.s,.sml,.ml,.lisp,.clj,.cljs,.edn,.rkt,.scm,.fs,.fsx,.fsproj,.fsxproj,.fsproj.user,.fsxproj.user,.fsxproj.userprefs"
  fileInput.addEventListener("change", function () {
    const file = fileInput.files[0]
    if (!file) return

    const fileSize = file.size
    const chunkSize = 512 * 1024

    $("#text").val("正在读取文件...")
    if (fileSize < chunkSize) {
      const reader = new FileReader()
      reader.onload = function (e) {
        const contents = e.target.result
        console.log("File contents:", contents)
        $("#text").val(contents)
      }
      reader.readAsText(file)
      return
    }

    const totalChunks = Math.ceil(fileSize / chunkSize)
  })
  fileInput.click()
}

$(".messages").children("img").on("click", function () {
  blockType = $(this).attr("alt")
  $(".messages").children("img").css({ "transform": "", "border": "none" })
  $(this).css({ "transform": "scale(1.1)", "border": "4px solid #ffd37f" })
})

new ClipboardJS('#copy');