var esta_no_debug = false;

function getUserInput2() {
    return new Promise((resolve) => {
        const inputElement = document.getElementById('inputText');

        // Adiciona um event listener para a tecla "Enter"
        inputElement.addEventListener('keydown', function onEnter(event) {
            if (event.key === 'Enter') {
                // Resolve a Promise com o valor do input
                resolve(inputElement.value);
                textareaElement.value += inputElement.value + '\n';
                textareaElement.scrollTop = textareaElement.scrollHeight;

                // Remove o event listener após a resolução
                inputElement.removeEventListener('keydown', onEnter);

                // Limpa o campo de input para a próxima entrada
                inputElement.value = '';
            }
        });
    });
}

function getUserDebug2() {

    return new Promise((resolve) => {
        // Adiciona um event listener para o botão "Próximo passo"
        const buttonProximoPasso = document.getElementById('button5');

        // Adiciona um event listener ao botão
        buttonProximoPasso.addEventListener('click', function onProximoPasso() {
            // Emite um console log quando o botão é pressionado
            resolve(inputElement.value);
            buttonProximoPasso.removeEventListener('click', onProximoPasso);
        });

        const buttonExecutar = document.getElementById('button6');
        // Adiciona um event listener ao botão
        buttonExecutar.addEventListener('click', function onExecutar() {
            // Emite um console log quando o botão é pressionado
            resolve(inputElement.value);
            buttonExecutar.removeEventListener('click', onExecutar);
        });
    });
}

function atualiza_tabela_variaveis(data){
    let $table = $('#tabela_variaveis');
    let $tbody = $('<tbody></tbody>');
    let contador = 0;
    $.each(data, function(key, value) {
        let $row = $('<tr></tr>');
        let $contador = $('<td></td>').text(contador).css({'text-align':'center',  'font-weight': 'bold'});
        let $cellKey = $('<td></td>').text(key);
        let $cellValue = $('<td></td>').text(value[value.length - 1]).css({'text-align':'right', 'padding-right': '15px'});

        $row.append($contador);
        $row.append($cellKey);
        $row.append($cellValue);
        $tbody.append($row);
        contador += 1;
    });

    $table.find('tbody').remove();
    $table.append($tbody);
}

function carrega_historico_variaveis(){
    $("#modal_historico_variaveis").modal('show');

    let primeira_vez = true;
    let maior_colspan = 0;
    // verifica quantidade de colspans necessários
    $.each(dic_control.historico_variavel, function(key, value) {
        if (primeira_vez){
            maior_colspan = value.length;
            primeira_vez = false;
        }
        if (value.length > maior_colspan){
            maior_colspan = value.length;
        }
    });

    let $table = $('#tabela_historico_variaveis_modal');
    let $tbody = $('<tbody></tbody>');
    let contador = 0;
    $.each(dic_control.historico_variavel, function(key, value) {
        let conta_celulas_criadas = maior_colspan;
        let $row = $('<tr></tr>');
        let $contador = $('<td></td>').text(contador).css({'text-align':'center',  'font-weight': 'bold'});
        let $cellKey = $('<td></td>').text(key);
        $row.append($contador);
        $row.append($cellKey);
        for (let i=0;i<value.length;i++){
            let $cellValue = $('<td></td>').text(value[i]).css({'text-align':'right', 'padding-right': '15px'});
            $row.append($cellValue);
            conta_celulas_criadas--;
        }

        while (conta_celulas_criadas>0){
            let $cellValue = $('<td></td>');
            $row.append($cellValue);
            conta_celulas_criadas--;
        }

        $tbody.append($row);
        contador += 1;
    });

    $table.find('tbody').remove();
    $table.append($tbody);

    console.log(maior_colspan);
    // Retorna false pois é um hyperlink
    return false;
}

function modifica_cor_linhas_editor_texto(linha_atual, linha_anterior) {
    addLineDecoration(linha_atual - 1, 'line-decoration');
    editor.removeLineClass(linha_anterior - 1, 'wrap', 'line-decoration');
}



var dic_control = {'c3e': '',
                                                 'historico_variavel': {}};



function inicia_worker(debug=false){
  var worker= new Worker('includes/js/worker.js', { type: 'module' });
  esta_no_debug = false;
  textareaElement.value = "";
  saveDataAndReload(false);
  $("#button2")[0].hidden = true;
  $("#button3")[0].hidden = false;
  $("#button4")[0].hidden = true;
  editor.setOption("readOnly", true);
  if (debug){
      $("#button5")[0].hidden = false;
      $("#button6")[0].hidden = false;
      debug_compiler = true;
  } else {
      $("#button5")[0].hidden = true;
      $("#button6")[0].hidden = true;
      debug_compiler = false;
  }
  mostra_tela_aguarde('Compilando...');
  worker.postMessage({ code: editor.getValue(), debug: debug});

  // Ouvir a resposta do Worker
    worker.onmessage = async function(event) {

        if ('saida_console' in event.data){
            textareaElement.value += event.data.saida_console;
            textareaElement.scrollTop = textareaElement.scrollHeight;
        }
        if ('finalizou_execucao' in event.data){
            $("#button4")[0].hidden = false;
            $("#button5")[0].hidden = true;
            $("#button6")[0].hidden = true;
            $("#button2")[0].hidden = false;
            $("#button3")[0].hidden = true;
            $("#inputText")[0].disabled = true;
            editor.setOption("readOnly", false);
            textareaElement.scrollTop = textareaElement.scrollHeight;
            dic_control.c3e =  event.data.c3e;
            setTimeout(function (){
                esconde_tela_aguarde();
            }, 500);
            worker.terminate();
        }
        if ('atualiza_tabela_variaveis' in event.data){
            dic_control.historico_variavel =  event.data.atualiza_tabela_variaveis;
            atualiza_tabela_variaveis(event.data.atualiza_tabela_variaveis);
        }

        if ('le' in event.data){
            setTimeout(function (){
                esconde_tela_aguarde();
            }, 500);
            setTimeout(function (){
                document.getElementById('inputText').removeAttribute('disabled');
                $("#inputText").addClass('input-insere-dados');
                $("#inputText")[0].placeholder = 'Digite um valor de entrada para variável ';
                $("#inputText").focus();
                textareaElement.scrollTop = textareaElement.scrollHeight;
            }, 50);
            let userInput = await getUserInput2();
            $("#inputText")[0].placeholder = '';
            document.getElementById('inputText').setAttribute('disabled', 'disabled');
            $("#inputText").removeClass('input-insere-dados');
            textareaElement.scrollTop = textareaElement.scrollHeight;
            worker.postMessage(userInput);
        }

        if ('debugger' in event.data){
            setTimeout(function (){
                esconde_tela_aguarde();
            }, 500);
            modifica_cor_linhas_editor_texto(event.data.linha_atual, event.data.linha_anterior);
            esta_no_debug = true;
            await getUserDebug2();
            esta_no_debug = false;
            worker.postMessage('');
        }
    };
}