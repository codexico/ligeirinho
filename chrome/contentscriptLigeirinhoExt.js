/*
    Document   : contentscriptBuscapeExt.js
    Created on : 06/02/2010, 02:41:26
    Author     : lgtelles, mdocko, codexico

    Description:
        Script inserido na pagina para detectar textos selecionados.

    Last Modified on:
        12/02/2010 - codexico
            - Inclui o evento keyup para pegar tambem textos selecionados pelo teclado
        09/02/2010 - codexico
            - Invertida a logica, agora o contentscript é quem envia os requests
            para o background. Fim do bug do UOL.
        21/04/2010 - lgtelles
                - Comentados todos console.log
        21/08/2010 - codexico
                - Limpeza geral
                - renomeado para contentscriptLigeirinhoExt

 */

//Detecta o texto selecionado na pagina quando ocorre o evento mouseup
//e envia atraves de um request para a background.js
document.body.addEventListener( "mouseup", function(e) {
	try {
		var textoSelecionado = window.getSelection();
		chrome.extension.sendRequest({"txt" : textoSelecionado.toString()});
	} catch (ex) {
		window.console.debug("sendRequest mouseup : " + ex);
	}
});
//Detecta o texto selecionado na pagina quando ocorre o evento keyup
//e envia atraves de um request para a background.js
document.body.addEventListener( "keyup", function(e) {
	try {
		var textoSelecionado = window.getSelection();
		chrome.extension.sendRequest({"txt" : textoSelecionado.toString()});
	} catch (ex) {
		window.console.debug("sendRequest keyup : "+ex);
	}
});