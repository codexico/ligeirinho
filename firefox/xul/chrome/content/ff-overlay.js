/**
ligeirinhofirefox.onFirefoxLoad = function(event) {
  document.getElementById("contentAreaContextMenu")
          .addEventListener("popupshowing", function (e){ ligeirinhofirefox.showFirefoxContextMenu(e); }, false);
};

ligeirinhofirefox.showFirefoxContextMenu = function(event) {
  // show or hide the menuitem based on what the context menu is on
  document.getElementById("context-ligeirinhofirefox").hidden = gContextMenu.onImage;
};

window.addEventListener("load", ligeirinhofirefox.onFirefoxLoad, false);
//acho q a gente nao vai usar o codigo acima, mas fica como exemplo inicialmente
/**/

ligeirinhofirefox.showingpopup = function(){
    //alert("showingpopup ");
    ligeirinhofirefox.getProduto();
}

ligeirinhofirefox.getProduto = function(){
    var pList = ligeirinhofirefox.findProductList();
    //alert(pList)
    ligeirinhofirefox.montaResultProdutos(pList);
}

ligeirinhofirefox.montaResultProdutos = function(produtos) {
    var produtosObject = JSON.parse(produtos);
    //alert(produtosObject.totalresultsreturned)
    for (var i = 0; i < produtosObject.totalresultsreturned; i = i + 1) {
        //alert(produtosObject.product[i]);
        //alert(produtosObject.product[i].product);
        //alert(produtosObject.product[i].product.productname);
        ligeirinhofirefox.addProduct(produtosObject.product[i].product);
    }
}

ligeirinhofirefox.findProductList = function(){
    //TODO: trocar por ajax
    var url = "chrome://ligeirinhofirefox/content/produto-exemplo.json";
    try{
        var produtos = ligeirinhofirefox.getContents(url);
    }catch(e){
        alert(e)
    }
    //alert(produtos);
    return produtos;
}

ligeirinhofirefox.addProduct = function(product){
    //alert(product.productname)
    var popup = document.getElementById("ligeirinho-menupop-vbox");

    // Create item row
    var itemHBox = document.createElement("hbox");

    // Create label with item name
    var itemLabel = document.createElement("label");
    itemLabel.setAttribute("value", product.productname);
    itemHBox.appendChild(itemLabel);
//alert(popup)
    popup.appendChild(itemHBox);
}


ligeirinhofirefox.getContents = function (aURL){
    var ioService=Components.classes["@mozilla.org/network/io-service;1"]
    .getService(Components.interfaces.nsIIOService);
    var scriptableStream=Components
    .classes["@mozilla.org/scriptableinputstream;1"]
    .getService(Components.interfaces.nsIScriptableInputStream);

    var channel=ioService.newChannel(aURL,null,null);
    var input=channel.open();
    scriptableStream.init(input);
    var str=scriptableStream.read(input.available());
    scriptableStream.close();
    input.close();
    return str;
}