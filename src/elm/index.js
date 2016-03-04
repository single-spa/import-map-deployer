var Elm = require("./Main.elm");
require("canopy-styleguide");

document.addEventListener("DOMContentLoaded", function() {
  var app =
  Elm.embed(
    Elm.Main,
    document.getElementById("root"),
    {
      initialPath: window.location.hash
    }
  )
})
