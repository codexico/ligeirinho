/*
Document   : popup.js
Created on : 30/01/2010, 19:34:06
Author     : lgtelles, mdocko, codexico

Description:
    Popup Dumb que mostra ofertas do Buscapé

Last Modified on:
    08/02/2010 - codexico
        - Alterado para tornar o popup dumb, de acordo com a documentacao
    10/02/2010 - 
        - mostrarLoading()
        - search()
    12/02/2010 - codexico
        - loading() deprecated
        - mais documentacao
    15/02/2010 - codexico
        - a variavel txtProduto armazena o valor do ultimo texto selecionado
        - nova funcao: setTxtProduto()
        - produtoNaoEncontrado() nao precisa mais de parametro, agora usa o this.txtProduto
        - usabilidade: o input da busca eh preenchido automaticamente com o this.txtProduto
        - nova funcao: mostraResultPopup(), extraida de dentro de montaResultPopup()
            para melhor controle da exibicao
        - melhorada animacao da ordenacao
    26/02/2010 - codexico
        - estrelinhas
    08/03/2010 - mdocko
        - Aceita que a busca seja iniciada através do botão 'Enter' após digitar o texto.
    09/03/2010 - mdocko
            - Correção de bug: Mensagem informando que não houve resultados ou que houveram muitos
                    resultados agora aparecem mesmo quando o texto é digitado.
            - Implementado botão 'Voltar' na lista de ofertas, recriando a lista de produtos,
                    sem precisar refazer a busca.
    24/03/2010 - mdocko
            - alterada função 'montaResultPopup'. Ao clicar na div é chamada uma função no background
                    que além de abrir o resultado, insere no BD para controle.
    31/03/2010 - codexico
        - Bug corrigido: as vezes algumas propriedades do json vem undefined, nao pode confiar
        - Bug corrigido: divs de ofertas agora usam class="offer" para separar de
                     class="product" que tem um listener
	21/04/2010 - lgtelles
		- Comentados todos console.log
	28/04/2010 - mdocko
		- Extensão internacionalizada. Suporta no momento português do Brasil (padrão), inglês e espanhol.
    20/08/2010 - codexico
		- bug corrigido: quando ofertas=0, ao clicar tentava buscar o produto, agora
			nao ha mais o redirecionamento. Ideia: enviar para a pagina do buscape
		- bug corrigido: alguns produtos nao tem imagens, agora a funcao imageError
			esconde a imagem, css tambem corrigido para ficar sem imagem
    20/08/2010 - codexico
		- revealing module pattern
		- template ejs
		- funcoes fundiram, separaram e mudaram de nome para melhor identificacao
		- refatorada geral nos nomes de variaveis
		- JSLint
    09/11/2010 - codexico
                - funcao debug e constantes para facilitar
		- formInit(), popup agora usa <form>s verdadeiras, checkEnter() não mais necessária
                - montaResultProdutos() mostra dados dos produtos no ejs
                - jquery 1.4.3

 */


/**
 * Variáveis globais que guardam as informações recebidas ao se montar a lista de produtos,
 * permitindo que a opção 'Voltar' meramente recrie a lista, ao invés de refazer a busca.
 **/
var PRODUCTION = true,
DEBUG = false,
produtosJSON,
numProd,
offerJSON,
//nome para identificar, manter organizado e isolado
ligeirinhoPopup = (function () {
    var msg = {//TODO: separar msg em outras, Ex: bandeiras, busca..

        msgProdEncontrados : chrome.i18n.getMessage("msgProdEncontrados"),
        msgProdListados : chrome.i18n.getMessage("msgProdListados"),
        msgRestBusca : chrome.i18n.getMessage("msgRestBusca"),
        msgOfertas : chrome.i18n.getMessage("msgOfertas"),
        msgDe : chrome.i18n.getMessage("msgDe"),
        msgA : chrome.i18n.getMessage("msgA"),
        msgAvalUsuarios : chrome.i18n.getMessage("msgAvalUsuarios"),
        msgPrecoIndisponivel : chrome.i18n.getMessage("msgPrecoIndisponivel"),

        msgComTexto : chrome.i18n.getMessage("msgComTexto"),
        //mensagens de muitos produtos encontrados
        msgMuitosProdEncontrado1 : chrome.i18n.getMessage("msgMuitosProdEncontrado1"),
        msgMuitosProdEncontrado3 : chrome.i18n.getMessage("msgMuitosProdEncontrado3"),


        msgOfertasEncontradas : chrome.i18n.getMessage("msgOfertasEncontradas"),
        msgEmAtePreco : chrome.i18n.getMessage("msgEmAtePreco"),
        msgParcelPreco : chrome.i18n.getMessage("msgParcelPreco"),
        msgConfiraPreco : chrome.i18n.getMessage("msgConfiraPreco"),
        msgAVista : chrome.i18n.getMessage("msgAVista"),

        msgBusqueNovamente : chrome.i18n.getMessage("msgBusqueNovamente"),
        msgProcurar : chrome.i18n.getMessage("msgProcurar"),
        msgBtProcurar : chrome.i18n.getMessage("msgBtProcurar"),

        msgOrdenarPor : chrome.i18n.getMessage("msgOrdenarPor"),
        msgOrdPreco : chrome.i18n.getMessage("msgOrdPreco"),
        msgOrdLoja : chrome.i18n.getMessage("msgOrdLoja"),
        msgOrdAval : chrome.i18n.getMessage("msgOrdAval"),

        msgBrasil : chrome.i18n.getMessage("msgBrasil"),
        msgArgentina : chrome.i18n.getMessage("msgArgentina"),
        msgChile : chrome.i18n.getMessage("msgChile"),
        msgColombia : chrome.i18n.getMessage("msgColombia"),
        msgMexico : chrome.i18n.getMessage("msgMexico"),
        msgPeru : chrome.i18n.getMessage("msgPeru"),
        msgVenezuela : chrome.i18n.getMessage("msgVenezuela"),

        msgSelTxt1 : chrome.i18n.getMessage("msgSelTxt1"),
        msgSelTxt2 : chrome.i18n.getMessage("msgSelTxt2"),

        msgSelecionarPais1vez : chrome.i18n.getMessage("msgSelecionarPais1vez"),
        msgSalvarPais : chrome.i18n.getMessage("msgSalvarPais"),

        //mensagens de produto nao encontrado
        msgNenhumProdEncontrado1 : chrome.i18n.getMessage("msgNenhumProdEncontrado1"),
        msgNenhumProdEncontrado3 : chrome.i18n.getMessage("msgNenhumProdEncontrado3")
    },

    //////////////
    // gets e sets
    ///////////////
    txtProduto = '',
    productId = '',
    categoryId = '',
    setTxtProduto = function (textoSelecionado) {
        txtProduto = textoSelecionado;
        $('.txtSearch').val(txtProduto);//usabilidade
    },
    setProductId = function (p) {
        productId = p;
        debug('setProductId = '+this.productId);
    },
    setCategoryId = function (c) {
        categoryId = c;
        debug('setcategoryId = '+this.categoryId);
    },

    /////////////
    // funcionalidades
    ////////////
    mostrarLoading = function () {
        $('.loading').show();
        $('.txtSearch').val(txtProduto);//usabilidade
        $('search_bottom').slideUp('fast');
        $('#warning').slideUp('fast');
        $('#ordenacao').slideUp('slow');
        $('#result').slideUp('fast');
    },

    search = function () {
        $('#search_bottom').hide();
        mostrarLoading();
        $('#warning').slideUp('fast');
        bg.encaminha(txtProduto);
        setTxtProduto(txtProduto);
    },


    ordenar = function (ordem) {
        debug("prod = "+productId);
        if (productId !== '') {//foi encontrado um produto
            bg.findOfferList(productId, ordem);
        } else {//busca pela categoria e texto
            debug("cat = "+categoryId);
            bg.findOfferListByCategory(categoryId, txtProduto, ordem);
        }
    },

    ///////////////
    // auxiliares
    //////////////
    /**
	 * Permite que a busca se inicie quando apertada a tecla 'Enter'
    checkEnter = function (e) {
        var keyCode = (window.Event) ? e.which : e.keyCode;
        if (keyCode === 13) {
            search();
        }
    },
	 **/
    imageError = function (i) {
        $(i).hide();//esconde img q nao foi carregada corretamente
    },

    ////////////////
    // alertas
    ////////////////
    nenhumTextoSelecionado = function () {
        $('.loading').hide();
        $('#search_bottom').hide();
        $('#warning').html('<div class="header"><p class="nenhum destaque">' + msg.msgSelTxt1 + ' <br />' + msg.msgSelTxt2 + ':</p></div>');
        $('#warning').show();
    },

    produtoNaoEncontrado = function () {
        $('.loading').hide();
        $('#search_bottom').hide();
        $('#warning').html('<div class="header"><p class="nenhum destaque erro">' + msg.msgNenhumProdEncontrado1 + '<br /> ' + msg.msgComTexto + ': <span>"' + txtProduto + '"</span> <br />' + msg.msgNenhumProdEncontrado3 + '.</p></div>');
        $('#warning').show();
    },

    //////////
    //pais
    /////////

    atualizarDivPais = function (pais) {
        $('#ddlPais').val(pais);
        var divpais = "";
        divpais += pais;
        divpais += "&nbsp;&nbsp; ";
        divpais += "<a class='txtoutro'>";
        divpais += chrome.i18n.getMessage("msgEscolherPais");
        divpais += "</a>";
        $('.bandeiras span').html(divpais).attr('class', pais);
    },
    montaDivPais = function () {
        //var pais = localStorage["pais"];
        var pais = localStorage.pais;

        $('#salvarPais').attr('value', msg.msgSalvarPais);

        if (localStorage.pais === undefined) {
            $('#msgInicial').html(msg.msgSelecionarPais1vez);
            $('#msgInicial').show();
            $('#divPais').show();
        } else {
            $('#msgInicial').hide();
            $('.escolherPais').hide();
            atualizarDivPais(pais);
        }
    },
    salvarPais = function () {
        $('#msgInicial').slideToggle();
        $('.escolherPais').slideToggle();
        var pais = $('#ddlPais').val();
        localStorage.pais = pais;
        atualizarDivPais(pais);
        search();//refaz a busca
    },

    /////////////
    //construcao dos popups
    /////////////

    /**
	 * Mostra o resultado da busca
	 * @param {String}  cod     string contendo o html com os produtos|ofertas
	 * @param {String}  cod     produtos|ofertas
	 */
    mostraResult = function (cod, tipo) {
        debug('mostraResult');
        $('body').removeClass('encontrado').addClass('encontrado');//evita duplicacao da classe
        $('.loading').hide();//retira o loading somente qd ja esta tudo pronto

        //efeitinho
        $('#result').slideUp('slow', function () {
            $(this).html(cod);
        }).slideDown('slow', function(){
            $('.search_again').show();
            $('#search_bottom').show();
        });

        if (tipo === "produtos") {
            $('#ordenacao').hide();//nao precisa ordenacao no resultado de produtos
        } else {//ofertas
            $('#ordenacao').show();
        }

        $('.txtSearch:first').focus();//usabilidade
    },
    /**
	 * Monta o conteudo do popup
	 * @param {JSON}    offer   as ofertas encontradas
	 * @param {int}     totalresultsreturned    o numero de ofertas encontradas
	 */
    montaResultOfertas = function (offer, totalresultsreturned, hasProd) {
        offerJSON = offer;//temporariamente armazena como array
        $.toJSON(offerJSON); //transforma o array em um json com as ofertas
        //pois estamos usando json para pegar os valores no loop

        offerJSON.msg = msg;
        offerJSON.totalresultsreturned = totalresultsreturned;

        var cod = "",
        html = "";
        if (hasProd) {
            cod = "<div class='header'><p class=' destaque'><strong>" + totalresultsreturned + "</strong> " + msg.msgOfertasEncontradas + ".<img src=\"back.png\" width=\"49\" height=\"48\" alt=\"Voltar\" title=\"Voltar\" style=\"float: right\" onClick=\"ligeirinhoPopup.montaResultProdutos(produtosJSON, numProd);\"/></p></div>";
        } else {
            cod = "<div class='header'><p class=' destaque'><strong>" + totalresultsreturned + "</strong> " + msg.msgOfertasEncontradas + ".</p></div>";
        }//TODO: incluir o hasProd no template e eliminar o 'cod'
        html = new EJS({
            url: 'tmpl/ofertas.ejs'
        }).render(offerJSON);
        cod += html;
        mostraResult(cod, "ofertas");
    },

    /**
	 * Monta o conteudo do popup
	 *
	 * @param {JSON}    produtos        os produtos encontrados
	 * @param {int}     numProdutos    numero de produtos encontrados
	 */
    montaResultProdutos = function (produtos, numProdutos) {
        produtosJSON = produtos;//temporariamente armazena como array
        numProd = numProdutos;
        $.toJSON(produtosJSON); //transforma o array em um json com as ofertas
        //pois estamos usando json para pegar os valores no loop

        produtosJSON.numProdutos = numProdutos;
        produtosJSON.msg = msg;

        var cod = "",
        html = "";
        cod = "<div class='header'><p class='destaque'><strong>" + numProdutos + "</strong> " + msg.msgProdEncontrados + ".</p></div>";
        if (numProdutos >= 20) {
            cod = "<div class='header'><p class='destaque'><strong>" + numProdutos + "</strong> " + msg.msgProdListados + ".</p><p class='nenhum destaque erro'>" + msg.msgMuitosProdEncontrado1 + "<br /> " + msg.msgComTexto + ": <span>\"" + txtProduto + "\"</span> <br />" + msg.msgRestBusca + ".</p></div>";
        }//TODO: incluir o hasProd no template e eliminar o 'cod'
        html = new EJS({
            url: 'tmpl/produtos.ejs'
        }).render(produtosJSON);
        cod += html;
        mostraResult(cod, "produtos");
    },

    ///////////////
    // inits
    //////////////
    ordenacaoInit = function () {
        $('#ordenacao #ordenarPor').html(msg.msgOrdenarPor);
        $('#ordenacao #ordPreco').html(msg.msgOrdPreco);
        $('#ordenacao #ordLoja').html(msg.msgOrdLoja);
        $('#ordenacao #ordAval').html(msg.msgOrdAval);

        $('#ordenacao a.preco').live('click', function () {
            ordenar('price');
        });
        $('#ordenacao a.loja').live('click', function () {
            ordenar('seller');
        });
        $('#ordenacao a.avaliacao').live('click', function () {
            ordenar('rate');
        });
    },
    bandeirasInit = function () {
        $('#listBrasil').html(msg.msgBrasil);
        $('#listArgentina').html(msg.msgArgentina);
        $('#listChile').html(msg.msgChile);
        $('#listColombia').html(msg.msgColombia);
        $('#listMexico').html(msg.msgMexico);
        $('#listPeru').html(msg.msgPeru);
        $('#listVenezuela').html(msg.msgVenezuela);

        $('.bandeiras').click(function () {
            $('#msgInicial').show();
            $('.escolherPais').show();
        });

        $('#salvarPais').click(function () {
            salvarPais();
        });

    },
    buscaInit = function () {
        $('.search_again').html(msg.msgBusqueNovamente);
        $('.btnProcurar').html(msg.msgProcurar);
        $('.btnProcurar').addClass(msg.msgBtProcurar);
    },
    productInit = function () {
        //busca as ofertas do produto e troca o conteudo para a pagina de ofertas
        $('.product').live('click', function () {
            if ($(this).find(".totalsellers").text() > 0) {
                bg.findOfferList($(this).attr("id"));
            }//TODO: enviar para a pagina do buscape se (totalsellers === 0)?
        });
    },
    formInit = function(){
        debug("formInit");

        $('.formsearch').submit(function() {
            event.preventDefault();
            var txt = $(this).find('.txtSearch').val()
            debug(txt);
            setTxtProduto(txt);
            mostrarLoading();
            $('#search_bottom').hide();
            bg.encaminha(txt);
            return false;
        });
        return false;
    },
    init = function () {
        debug('popup init');
        bg = chrome.extension.getBackgroundPage();//conecta com o background

        bg.bgInit();

        montaDivPais();
        ordenacaoInit();
        bandeirasInit();
        buscaInit();
        productInit();
        formInit();

        $('.txtSearch:first').focus();//usabilidade
    },
    debug = function (str){
        if (DEBUG){
            bg = chrome.extension.getBackgroundPage();//conecta com o background
            bg.debug(str);            
        }
    };

    // retorna somente o que precisa ser publico
    return {
        init: init,

        imageError: imageError,
        //checkEnter : checkEnter,

        search: search,

        txtProduto : txtProduto,
        setProductId : setProductId,
        setCategoryId : setCategoryId,
        setTxtProduto : setTxtProduto,

        nenhumTextoSelecionado : nenhumTextoSelecionado,
        produtoNaoEncontrado: produtoNaoEncontrado,

        montaResultOfertas : montaResultOfertas,
        montaResultProdutos : montaResultProdutos
    };
}());


$(document).ready(function () {

    ligeirinhoPopup.init();

});