const contextMenu = require("context-menu");
const selection = require("selection");
const panels = require("panel");
var self = require("self");
const data = require("self").data;


function replaceMom(html) {
  return html.replace("Ligeirinho", "Mom");
}
exports.replaceMom = replaceMom;


exports.main = function(options, callbacks) {
  console.log("My ID is " + self.id);
  console.log(self.data);

  // Load the sample HTML into a string.
  var helloHTML = self.data.load("popup.html");

  // Let's now modify it...
  helloHTML = replaceMom(helloHTML);
  console.log(helloHTML);
  panel.show();
}


exports.teste = function(){
  panel.show();
}

let panel = panels.add(panels.Panel({
  contentURL: data.url("popup.html")
}));
let ligeirinho = function (text){
  panel.show();
}
//menus
let menuTextItem = contextMenu.Item({
  label: "Pesquisar com Ligeirinho",
  context: contextMenu.SelectionContext(),
  contentScript: 'on("click", function (node, data) {' +
                 '  let text = window.getSelection().toString();' +
                 '  console.log("Item clicked! " + text );' +
                 '  postMessage(text);' +
                 '});',
  onMessage: function (text) {
    ligeirinho(text);
  }
});
let menuPageItem = contextMenu.Item({
  label: "Abrir Ligeirinho",
  context :   contextMenu.PageContext(),
  contentScript: 'on("click", function (node, data) {' +
                 '  console.log("Item clicked!");' +
                 '  postMessage("");' +
                 '});',
  onMessage: function (text) {
    ligeirinho(text);
  }
});
let menuLinkItem = contextMenu.Item({
  label: "Pesquisar link com Ligeirinho",
  context : contextMenu.SelectorContext("a[href]"),
  contentScript: 'on("click", function (node, data) {' +
                 '  let text = node.textContent;' +
                 '  console.log("Item clicked! " + text );' +
                 '  postMessage(text);' +
                 '});',
  onMessage: function (text) {
    ligeirinho(text);
  }
});//TODO: nao pegar texto 'hidden' no link, ex: site do submarino

contextMenu.add(menuPageItem);
contextMenu.add(menuLinkItem);
contextMenu.add(menuTextItem);