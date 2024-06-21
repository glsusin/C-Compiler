var index_goto = {};
var vm_escopo = '';
var vm_escopo_pai = '';
var variaveis_vm = {};
var vm_escopos = {}

async function executaC3E2(codigo_c3e) {
    let c3e;
    let result;
    let arg1;
    let arg2;
    let ultimo_escopo = [];
    variaveis_vm = [];
    indexa_linhas(codigo_c3e);
    inicializa_variaveis_globais(codigo_c3e);
    for (let i = 0; i < codigo_c3e.length; i++) {
        c3e = codigo_c3e[i];
        // DEPURADOR
        if (debug_compiler){
            if (linha_anterior !== c3e.linha && (!c3e.label && !c3e.salto)){
                vai_ler = true;
                modifica_cor_linhas_editor_texto();
                await getUserDebug();
                vai_ler = false;
                linha_anterior = c3e.linha;
            }
        }

        // INICIO EXECUÇÃO C3E
        if (c3e.label) {
            continue;
        } else if (c3e.salto){
            // SALTO INCODICIONAL
            if (c3e.result == 'goto') {
                if (verifica_se_eh_chamada_de_funcao(c3e.arg1)) {
                    vm_escopo_pai = vm_escopo;
                    vm_escopo = variaveis_vm.length;
                    criaDicVariaveis();
                    ultimo_escopo.push({'identificador': c3e.arg1.substring(1), 'index': i, 'escopo': vm_escopo, 'escopo_pai': variaveis_vm[vm_escopo_pai]['escopo_pai']});
                }
                i = index_goto[c3e.arg1] - 1;
                continue;
            } else if (verifica_se_eh_return(c3e.result)){
                // RETURN
                if (ultimo_escopo.length > 1){
                    let dados = ultimo_escopo.pop();
                    vm_escopo_pai = variaveis_vm['escopo_pai'];
                    vm_escopo = dados['escopo'];
                    if (c3e.arg1){
                        arg1 = getValue(c3e.arg1);
                        result = arg1;
                        setValue(result, dados['identificador']);
                    }
                    i = dados['index'];
                    continue;
                }
            } else {
                // SALTO CONDICIONAL
                let condicional = getValue(c3e.arg1);
                if (!condicional) {
                    vm_escopo_pai = variaveis_vm[vm_escopo_pai]['escopo_pai'];
                    vm_escopo = vm_escopo_pai;
                    i = index_goto[c3e.arg2] - 1;
                    continue;
                }
                vm_escopo_pai = vm_escopo;
                vm_escopo = vm_escopo+1;
            }
        } else if (c3e.escrita){
            let quebra_printf = parsePrintf(c3e.result);
            let formatarString = formataStringInt(quebra_printf.formattedString, quebra_printf.params.slice(1));
            formatarString = formataStringFloat(formatarString, quebra_printf.params.slice(1));
            formatarString = formataStringQuebraLinha(formatarString);
            textareaElement.value += formatarString.replace(/"/g, '');
            textareaElement.scrollTop = inputElement.scrollHeight;
        } else if (c3e.leitura) {
            let quebra_scanf = parseScanf(c3e.result);
            let values = quebra_scanf.params;
            for (let i=0; i<values.length;i++){
                configura_leitura(true);
                userInput = await getUserInput();
                configura_leitura(false);
                setValue(userInput, values[i]);
                modifica_historico_variavel(values[i], userInput);
            }
        } else {
            if (!c3e.arg1){
                inicializa_vetores_e_matrizes(c3e.result.split('[')[0]);
                //historico de variavel
                modifica_historico_variavel(c3e.result.split('[')[0], variaveis[c3e.result.split('[')[0]].valor);
            } else {
                arg1 = getValue(c3e.arg1);
                arg2 = '';
                if (c3e.arg2){
                    arg2 = getValue(c3e.arg2);
                }
                if (c3e.op){
                    result = calcula_argumentos(arg1, arg2, c3e.op);
                } else {
                    result = arg1;
                }
                setValue(result, c3e.result);
            }
        }
    }
    $("#button4")[0].hidden = false;
    $("#button5")[0].hidden = true;
    $("#button2")[0].hidden = false;
    $("#button3")[0].hidden = true;
    $("#inputText")[0].disabled = true;
    editor.setOption("readOnly", false);
    textareaElement.value += '\n\nPrograma compilado e executado com sucesso.';
    textareaElement.scrollTop = textareaElement.scrollHeight;
}