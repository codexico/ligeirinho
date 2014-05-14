/*
    Document   : background.js
    Created on : 30/01/2010, 19:34:06
    Author     : lgtelles, mdocko, codexico

    Description:
        Backgrgound que busca ofertas no Buscape

    Last Modified on:
        08/02/2010 - codexico
            - De acordo com a documentacao toda a logica deve ficar no background
        09/02/2010 - codexico
            - Invertida a logica, agora o contentscript que envia os requests
                para o background. Fim do bug do UOL.
        12/02/2010 - codexico
            - bgGetTexto() deprecated
            - produtoNaoEncontrado() estava passando a referencia antiga
            - mais documentacao
            - nomenclatura de onRequest seguindo api
        15/02/2010 - codexico
            - encaminha() tambem envia o texto selecionado para o popup
        24/03/2010 - mdocko
            - inserida função openPage que insere a busca no BD e abre a janela
                do resultado para o usuário.
            - inserida variavel hasProd que armazena false se a lista de ofertas
                foi carregada diretamente ou true se uma lista de produtos foi
                carregada antes (correção de bug no botão voltar)
        06/04/2010 - lgtelles
            - Alterada função openPage para que abra uma nova tab sem dar foco.
            - Busca voltou a ser posicionada em baixo
        21/04/2010 - lgtelles
            - Comentados todos //console.log
        20/08/2010 - codexico
                - algumas vars e funcs mudaram de nome para usar as mudancas do popup.js
        09/11/2010 - codexico
                - funcao debug e constantes para facilitar

 */

var PRODUCTION = true;
var DEBUG = false;

var URL_BWS = 'http://bws.buscape.com/service/';


if (!PRODUCTION){
    URL_BWS = 'http://sandbox.buscape.com/service/';
}


function debug(str){
    if (DEBUG)
        window.console.log(str)
}


var hasProd = true;
var txtG = '';

function openPage(url1, store, logo) {
    chrome.tabs.create({
        url: url1,
        selected: false
    }); // Cria uma nova tab não selecionada para que a extensão não saia de foco.
    $.ajax({
        type: "GET",
        url : LOG_URL,
        data: ({
            'term' : txtG,
            'store' : store
        }),
        success: function() {
            debug('Search logged');
        },
        stop: function() {
        },
        complete: function() {
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            debug("Error: " + textStatus + " " + errorThrown);
            debug(XMLHttpRequest.getAllResponseHeaders());
        }
    });
}

function findProductList(txt, numResults){
    debug('findProductList('+numResults + ') '+ txt);
    txtG = txt;
    var paisSelecionado = localStorage["pais"];
    var caminho = URL_BWS + 'findProductList/' + APPLICATION_ID;

    if(paisSelecionado != null) {
        caminho += '/' + paisSelecionado + '/';
        $('#divPais').html(caminho);
    }
    debug(caminho);
    $.ajax({
        type: "GET",
        url : caminho,
        data: ({
            'format' : 'json',
            'AffiliateId' : AFFILIATE_ID,
            'keyword' : txt,
            'results' : numResults //nenhum resultado necessario neste momento
        }),
        success: function(productsData){
//            debug('totalresultsavailable = '+productsData.totalresultsavailable);
//            debug('productsData.page = ' + productsData.page)
//            debug('productsData.product = ' + productsData.product)
//            debug('productsData.category = ' + productsData.category)
            if(productsData.product != undefined){//valor que nao aparece se o buscape nao retorna o produto

                if(productsData.totalresultsavailable == 0){
                    debug('bg produtoNaoEncontrado');
                    v.ligeirinhoPopup.produtoNaoEncontrado();
                }else if(productsData.totalresultsavailable == 1){//so um encontrado, busque-o
                    hasProd = false;
                    //chama aqui dentro para ter certeza que deu tempo de pegar a resposta
                    findOfferList(productsData.product[0].product.id);
                }else{//existem varios produtos com essa keyword
                    if(numResults == 1){//vamos buscar os outros produtos com a keyword
                        if(productsData.totalresultsavailable > 30){//o buscape retorna no max 30
                            //v.muitosProdutosEncontrados();//TODO: mostrar mensagem para refinar busca ou buscar varias vezes?
                            findProductList(txt, 20);
                        }else{
                            findProductList(txt, productsData.totalresultsavailable);
                        }
                    }else{//ja temos os produtos
                        //chama aqui dentro para ter certeza que deu tempo de pegar a resposta
                        exibeProductList(productsData, numResults);
                    }
                }
            }else if(productsData.category != undefined){//o buscape nao retornou nem a categoria
                findOfferListByCategory(productsData.category.id, txt);
            }else{
                v.ligeirinhoPopup.produtoNaoEncontrado();
            }
        },
        stop: function() {
        },
        complete: function() {
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            debug("Error: " + textStatus + " " + errorThrown);
            debug(XMLHttpRequest.getAllResponseHeaders());
        }
    });
}

/**
 * Busca as ofertas
 *
 * @link http://developer.buscape.com/offer.jsp
 *
 * @param {String} productId    o texto selecionado na tab
 * @param {String} ordem        parametro de ordenacao do buscape
 */
function findOfferList(productId, ordem) {
    debug('findOfferList('+productId + ', '+ordem + ')');
    var paisSelecionado = localStorage["pais"];
    var caminho = URL_BWS + 'findOfferList/' + APPLICATION_ID;
    if(paisSelecionado != null) {
        caminho += '/' + paisSelecionado + '/';
        $('#divPais').html(caminho);
    }

    $.ajax({
        type: "GET",
        url : caminho,
        data: ({
            'format' : 'json',
            'AffiliateId' : AFFILIATE_ID,
            'productId' : productId,
            'sort': ordem
        }),
        success: function(data){
            dataglobal = data;//mantem uma variavel global com a data inicial
            exibeResultadoAjax();//chama aqui dentro para ter certeza que deu tempo de pegar a resposta
        },
        stop: function() {
        },
        complete: function() {
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            debug("Error: " + textStatus + " " + errorThrown);
            debug(XMLHttpRequest.getAllResponseHeaders());
        }
    });
}

function findOfferListByCategory(categoryId, txt, ordem){
    debug('findOfferListByCategory('+categoryId+ ', '+txt + ')');
    var paisSelecionado = localStorage["pais"];
    var caminho = URL_BWS + 'findOfferList/' + APPLICATION_ID;
    if(paisSelecionado != null) {
        caminho += '/' + paisSelecionado + '/';
        $('#divPais').html(caminho);
    }

    $.ajax({
        type: "GET",
        url : caminho,
        data: ({
            'format' : 'json',
            'AffiliateId' : AFFILIATE_ID,
            'categoryId' : categoryId,
            'keyword' : txt,
            'sort': ordem
        }),
        success: function(data){
            dataglobal = data;//mantem uma variavel global com a data inicial
            exibeResultadoAjax();//chama aqui dentro para ter certeza que deu tempo de pegar a resposta
        },
        stop: function() {
        },
        complete: function() {
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            debug("Error: " + textStatus + " " + errorThrown);
            debug(XMLHttpRequest.getAllResponseHeaders());
        }
    });

}

function exibeProductList(products, numProdutos){
    v.ligeirinhoPopup.montaResultProdutos(fazerArray(products.product), numProdutos);
}

/**
 * Monta um array de um JSON
 *
 * @param {JSON} r  a resposta do ajax
 */
function fazerArray(r){
    //segundo o video do google no youtube isso devia transformar o json em um array
    //usando funcoes do proprio google chrome, mas nao funcionou:
    //var res = JSON.parse(r.offer);
    //offerArray = res.concat(offerArray);
    return jQuery.makeArray(r);//array global com as ofertas
}

/**
 * Chama a funcao do popup adequada para mostrar o resultado
 */
function exibeResultadoAjax(){
    debug('totalresults = ' + dataglobal.totalresultsreturned);
    if(dataglobal.totalresultsreturned > 0){
        v.ligeirinhoPopup.setCategoryId(dataglobal.category.id);
//        debug("cat = "+v.ligeirinhoPopup.categoryId+" = "+dataglobal.category.id);
        if(dataglobal.product != undefined){//o buscape retornou o product
            v.ligeirinhoPopup.setProductId(dataglobal.product[0].product.id);
//            debug("prod = "+v.ligeirinhoPopup.productId+" = "+dataglobal.product[0].product.id);
//            debug("prodname = "+v.ligeirinhoPopup.txtProduto+" = "+dataglobal.product[0].product.productshortname+" = "+dataglobal.product[0].product.productname);
        }
        offerArray = fazerArray(dataglobal.offer);
        v.ligeirinhoPopup.montaResultOfertas(offerArray, dataglobal.totalresultsreturned, hasProd);
    }else{//sem resultados
        v.ligeirinhoPopup.produtoNaoEncontrado();
    }
}

/**
 * Pega a view do popup
 */
function bgGetPopup(){
    debug('bgGetPopup()');

    var viewTabUrl = chrome.extension.getURL('popup.html');
    var views = chrome.extension.getViews();
    for (var i = 0; i < views.length; i++) {
        var view = views[i];

        //If this view has the right URL and hasn't been used yet...
        if (view.location.href == viewTabUrl) {
            return view;
        }
    }
    return null;
}

/**
 * Chama o conteudo para o popup
 *
 * @param   {String}    textoSelecionado    ultimo texto selecionado pelo usuario
 */
function encaminha(textoSelecionado){
    debug('encaminha('+textoSelecionado+')');
    v = bgGetPopup();

    if ((textoSelecionado != undefined) && (textoSelecionado != '') ) {
        v.ligeirinhoPopup.setTxtProduto(textoSelecionado);
        findProductList(textoSelecionado, 1);
    } else {
        v.ligeirinhoPopup.nenhumTextoSelecionado();
    }
}


/**
 * Inicia o background, chamada pelo popup
 */
function bgInit(){
    encaminha(txtGlobal);
}

/**
 * String para manter uma variavel com o ultimo texto selecionado
 */
txtGlobal = '';

/**
 * Chamada pelo contentscript, armazena o ultimo texto selecionado na String
 * txtGlobal.
 */
chrome.extension.onRequest.addListener(
    function (request, sender, sendResponse) {
        txtGlobal = request.txt;
        debug("request.txt = "+request.txt);
        sendResponse(txtGlobal);//sempre incluir um sendResponse senao o request continua aberto
    }
    );