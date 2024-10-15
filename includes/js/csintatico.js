/* jshint esversion: 6 */
import { getToken } from './clexico.js';
import { globalVarC } from './cglobals.js';

function backtracking(funcao){
    if (funcao === 'push'){
        let dic = {};
        dic["caracter"] = globalVarC.caracter;
        dic["lexema"] = globalVarC.lexico;
        dic["posicao"] = globalVarC.code_position;
        dic["token"] = globalVarC.tk;
        dic["count_column"] = globalVarC.count_column;
        dic["count_line"] = globalVarC.count_line;
        dic["instrucoes_c3e"] = globalVarC.instrucoes.slice();
        dic["msg_erro"] = globalVarC.dic_control['msg_erro'];
        dic["tabela_de_simbolos"] = JSON.parse(JSON.stringify(globalVarC.tabela_de_simbolos));
        dic["dimensao"] = globalVarC.dimensao;
        globalVarC.lista_backtracking.push(dic);
    } else {
        let ultima_posicao = globalVarC.lista_backtracking.pop();
        globalVarC.caracter = ultima_posicao["caracter"];
        globalVarC.lexico = ultima_posicao["lexema"];
        globalVarC.code_position = ultima_posicao["posicao"];
        globalVarC.tk = ultima_posicao["token"];
        globalVarC.count_column = ultima_posicao["count_column"];
        globalVarC.count_line = ultima_posicao["count_line"];
        globalVarC.instrucoes = ultima_posicao['instrucoes_c3e'];
        globalVarC.dic_control['msg_erro'] = ultima_posicao['msg_erro'];
        globalVarC.dimensao = ultima_posicao['dimensao'];
        globalVarC.tabela_de_simbolos = ultima_posicao['tabela_de_simbolos'];
    }
}

function verifica_existencia_escopo_tabela_simbolos(escopo){
    if (!globalVarC.tabela_de_simbolos[escopo]){
        globalVarC.tabela_de_simbolos.push({'escopo_pai': globalVarC.index_escopo_pai, 'variaveis': {}});
    }
}

function verifica_funcao_declarada(variavel){
    if (variavel in globalVarC.tabela_de_simbolos[0]['variaveis']){
        if (globalVarC.tabela_de_simbolos[0]['variaveis'][variavel]['tipo']['eh_funcao']){
            globalVarC.dic_control['msg_erro'] = 'Variável "' + variavel + '" não pode ser utilizada pois já esta sendo utilizada por função (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            return false;
        }
    }
    return true;
}

function verifica_variavel_declarada_em_escopos(escopo, variavel){
    for (let index=escopo; index>=0;index = globalVarC.tabela_de_simbolos[index]['escopo_pai']){
        if (variavel in globalVarC.tabela_de_simbolos[index]['variaveis']){
            if (index === escopo){
                globalVarC.dic_control['msg_erro'] = 'Variável "' + variavel + '" já declarada no mesmo escopo (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                return false;
            }
        }
        if (index === 0){
            break;
        }
    }
    return true;
}


function verifica_variavel_declarada(escopo, identificador, dimensao=0, verifica_funcao=false, verifica_matriz_ou_vetor=false, verifica_dimensao=false){
    verifica_existencia_escopo_tabela_simbolos(escopo);
    let armazena_escopo = escopo;
    for (let index=escopo; index>=0;index = globalVarC.tabela_de_simbolos[index]['escopo_pai']){
        if (identificador in globalVarC.tabela_de_simbolos[index]['variaveis']){
            armazena_escopo = index;
            break;
        }
        if (index === 0){
            globalVarC.dic_control['msg_erro'] = "Variável '" + identificador + "' não declarada" + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            return false;
        }
    }
    if (verifica_matriz_ou_vetor){
        if (globalVarC.tabela_de_simbolos[armazena_escopo]["variaveis"][identificador]['matriz_vetor'] === ''){
            return false;
        } else {
            return true;
        }
    }
    // if (verifica_variavel_declarada_em_escopos(escopo, identificador)) {
    if (dimensao > 0 || verifica_dimensao) {
        // verifica dimensao do vetor da atribuição e compara com o que foi declarado
        if (dimensao === Object.keys(globalVarC.tabela_de_simbolos[armazena_escopo]['variaveis'][identificador]['dimensao']).length) {
            return true;
        } else {
            if (globalVarC.dic_control['msg_erro'] === '') {
                globalVarC.dic_control['msg_erro'] += "Dimensão do vetor '" + identificador + "' diferente do especificado" + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    }
    if (verifica_funcao) {
        if (globalVarC.tabela_de_simbolos[armazena_escopo][identificador].eh_funcao) {
            return true;
        } else {
            if (globalVarC.dic_control['msg_erro'] === '') {
                globalVarC.dic_control['msg_erro'] += "Variável encontrada '" + identificador + "' não está especificada com função" + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    }
    return true;
}


function tabela_simbolos(escopo, acao, tipo, variavel, tamanho, dimensao_vetor, define=false, funcao=false){
    verifica_existencia_escopo_tabela_simbolos(escopo);
    if (acao === 'grava'){
        if (variavel in globalVarC.tabela_de_simbolos[escopo]['variaveis']){
            globalVarC.dic_control['msg_erro'] = "variável '" + variavel + "' já especificada no mesmo escopo" + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            return false;
        }
        globalVarC.tabela_de_simbolos[escopo]['variaveis'][variavel.toString()] = {
            'tipo': tipo,
            'valor': null,
            'dimensao': {},
            'matriz_vetor': '',
            'define': define,
            'eh_funcao': funcao};
    }
    if (acao === 'tamanho'){
        if (dimensao_vetor === 1){
            globalVarC.tabela_de_simbolos[escopo]['variaveis'][variavel.toString()]['matriz_vetor'] = 'vetor';
            globalVarC.tabela_de_simbolos[escopo]['variaveis'][variavel.toString()]['dimensao'][dimensao_vetor] = tamanho;
        } else {
            globalVarC.tabela_de_simbolos[escopo]['variaveis'][variavel.toString()]['matriz_vetor'] = 'matriz';
            globalVarC.tabela_de_simbolos[escopo]['variaveis'][variavel.toString()]['dimensao'][dimensao_vetor] = tamanho;
        }
    }
    if (acao === 'verifica_define'){
        if (variavel.toString() in globalVarC.tabela_de_simbolos[0]['variaveis']){
            if (globalVarC.tabela_de_simbolos[0]['variaveis'][variavel.toString()]['define']){
                // tem macro no define declarado
                return false;
            } else {
                // não tem macro no define declarado
                return true;
            }
        } else {
            return true;
        }
    }
}


function busca_tipo_variavel(variavel){
    return globalVarC.tabela_de_simbolos[0]['variaveis'][variavel]['tipo']['tipo'];
}

function newTemp() {
    return "@t" + globalVarC.tempCount++;
}

function newLabel() {
    return "L" + globalVarC.labelCount++;
}

function geraInstrucaoInicial(op, arg1, arg2, result, linha, salto=false, escrita=false, label=false, leitura=false, escopo=false){
    globalVarC.instrucoes.unshift({ op, arg1, arg2, result, salto, escrita, label, leitura, linha, escopo });
}

function geraInstrucao(op, arg1, arg2, result, linha, salto=false, escrita=false, label=false, leitura=false, escopo=false, parametros=false, tipo_variavel=false) {
    globalVarC.instrucoes.push({ op, arg1, arg2, result, salto, escrita, label, leitura, linha, escopo, parametros, tipo_variavel });
}

function OperadorUnario(){
    if (globalVarC.tk === globalVarC.TKs['TKMais']){
        getToken();
        return true;
    } else if (globalVarC.tk === globalVarC.TKs['TKMenos']){
        getToken();
        return true;
    } else if (globalVarC.tk === globalVarC.TKs['TKLogicalNot']){
        getToken();
        return true;
    } else {
        return false;
    }
}

function OperadorAtrib(){
    if (globalVarC.tk === globalVarC.TKs['TKIgual']){
        getToken();
        return true;
    } else if (globalVarC.tk === globalVarC.TKs['TKMultIgual']){
        getToken();
        return true;
    } else if (globalVarC.tk === globalVarC.TKs['TKDivIgual']){
        getToken();
        return true;
    } else if (globalVarC.tk === globalVarC.TKs['TKRestoIgual']){
        getToken();
        return true;
    } else if (globalVarC.tk === globalVarC.TKs['TKMaisIgual']){
        getToken();
        return true;
    } else if (globalVarC.tk === globalVarC.TKs['TKMenosIgual']){
        getToken();
        return true;
    } else {
        return false;
    }
}


function Tipo(){
    if (globalVarC.tk === globalVarC.TKs['TKInt'] || globalVarC.tk === globalVarC.TKs['TKVoid'] || globalVarC.tk === globalVarC.TKs['TKFloat'] || globalVarC.tk === globalVarC.TKs['TKDouble']){
        getToken();
        return true;
    } else {
        return false;
    }
}

function NomeFunc(tipo){
    let variavel = globalVarC.lexico.toString().replace(/\x00/g, '');
    if (globalVarC.tk === globalVarC.TKs['TKId']){
        let labelFunc = '$' + variavel;
        geraInstrucao('', '', '', labelFunc, globalVarC.count_line, false, false, true);
        tabela_simbolos(globalVarC.index_escopo, 'grava', tipo, variavel, false, false, false, true);
        getToken();
        return true;
    } else {
        return false;
    }
}


function Param(){
    var tipo = {'tk': globalVarC.tk,
                                  'tipo': globalVarC.lexico.toString().replace(/\x00/g, '')};
    if (Tipo()){
        let variavel = globalVarC.lexico.toString().replace(/\x00/g, '');
        if (globalVarC.tk === globalVarC.TKs['TKId']){
            if (tabela_simbolos(globalVarC.index_escopo, 'verifica_define', tipo, variavel) && verifica_variavel_declarada_em_escopos(globalVarC.index_escopo, variavel)) {
                tabela_simbolos(globalVarC.index_escopo, 'grava', tipo, variavel);
                getToken();
                let result = DecRestante(tipo, variavel, 1);
                if (result) {
                    if (typeof result === 'string') {
                         return variavel+result;
                    } else {
                        return variavel;
                    }
                }
                return true;
            } else {
                return false;
            }
        } else {
            backtracking('pop');
            return false;
        }
    } else {
        backtracking('pop');
        return false;
    }
}


function ListaParamRestantes(){
    if (globalVarC.tk === globalVarC.TKs['TKVirgula']){
        getToken();
        let result = Param();
        if (result){
            let temp2 = ListaParamRestantes();
            if (typeof temp2 === 'string') {
                return result + ',' + temp2;
            } else {
                return result;
            }
        } else {
            return false;
        }
    } else {
        return true;
    }
}

function ListaParam(){
    backtracking('push');
    let result = Param();
    if (result){
        let temp2 = ListaParamRestantes();
        if (typeof temp2 === 'string') {
            globalVarC.lista_parametros_func.push(result + ',' +temp2);
            return true;
        } else {
            globalVarC.lista_parametros_func.push(result);
            return true;
        }
    } else {
        console.log('chegou aqui');
        return true;
    }
}


function ExpressaoPosRestante(lado_atribuicao, arg1) {
    if (globalVarC.tk !== globalVarC.TKs['TKAbreParenteses'] && ExpressaoPrima(lado_atribuicao)) {
        return true;
    } else if (globalVarC.tk === globalVarC.TKs['TKAbreColchete']) {
        if (arg1 && !verifica_variavel_declarada(globalVarC.index_escopo, arg1, 0, false, true)){
            globalVarC.dic_control['msg_erro'] = " variável '" + arg1 + "' não é vetor " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            return false;
        }
        getToken();
        let result = Expressao();
        if (result) {
            if (globalVarC.tk === globalVarC.TKs['TKFechaColchete']) {
                getToken();
                globalVarC.dimensao += 1;
                let temp2 = ExpressaoPosRestante(lado_atribuicao);
                if (arg1){
                    if (typeof temp2 === 'string') {
                        return arg1 + "[" + result + "]" + temp2;
                    } else {
                        if (!verifica_variavel_declarada(globalVarC.index_escopo, arg1, globalVarC.dimensao, false, false, true)){
                            return false;
                        }
                        return arg1 + "[" + result + "]";
                    }
                } else {
                    if (typeof temp2 === 'string') {
                        return "[" + result + "]" + temp2;
                    } else {
                        return "[" + result + "]";
                    }
                }

            } else {
                return false;
            }
        } else {
            return false;
        }
    } else if (globalVarC.tk === globalVarC.TKs['TKAbreParenteses']){
        getToken();
        if (globalVarC.tk === globalVarC.TKs['TKFechaParenteses']) {
            let label = '$' + arg1;
            geraInstrucao('', label, '', 'goto', globalVarC.count_line, true, false, false, false, false, false, busca_tipo_variavel(arg1));
            getToken();
            return true;
            // if (ExpressaoPosRestante()){
            //     return true;
            // } else {
            //     return false;
            // }
        } else {
            if (Expressao()){
                let parametros_funcao = globalVarC.lista_parametros_func.pop();
                if (globalVarC.tk === globalVarC.TKs['TKFechaParenteses']) {
                    let label = '$' + arg1;
                    let parametros = '';
                    if (parametros_funcao){
                        parametros = parametros_funcao;
                    }
                    if (globalVarC.tabela_de_simbolos[0]['variaveis'][arg1]['qtd_parametros_func'] !== parametros_funcao.split(',').length){
                        globalVarC.dic_control['msg_erro'] = "Quantidade de parâmetros da chamada de função '" + arg1  + "' difere do esperado (" + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                    }
                    geraInstrucao('', label, parametros, 'goto', globalVarC.count_line, true, false, false, false, false, false, busca_tipo_variavel(arg1));
                    getToken();
                    return true;
                } else {
                    if (globalVarC.dic_control['msg_erro'] === ''){
                        globalVarC.dic_control['msg_erro'] = "não encontrou o caracter ')' na chamada da função " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                    }
                    return false;
                }
            } else {
                return false;
            }
        }
    } else if (globalVarC.tk === globalVarC.TKs['TKDuploMais']){
        getToken();
        if (globalVarC.empilha_operacao_aritmetica.length > 0){
            globalVarC.dic_control['msg_erro'] = `Comportamento indefinido em ${globalVarC.empilha_operacao_aritmetica[0]}${globalVarC.identificador}++. Não é permitido usar operadores pré e pós na mesma variável em uma única expressão (${globalVarC.count_line}, ${globalVarC.count_column}).`;
            return false;
        }
        let temp = newTemp();
        geraInstrucao('', globalVarC.identificador, '', temp, globalVarC.count_line);
        geraInstrucao('+', globalVarC.identificador, 1, globalVarC.identificador, globalVarC.count_line);
        if (ExpressaoPosRestante(lado_atribuicao)) {
            return temp;
        } else {
            return false;
        }
    } else if (globalVarC.tk === globalVarC.TKs['TKDuploMenos']){
        if (globalVarC.empilha_operacao_aritmetica.length > 0){
            globalVarC.dic_control['msg_erro'] = `Comportamento indefinido em ${globalVarC.empilha_operacao_aritmetica[0]}${globalVarC.identificador}--. Não é permitido usar operadores pré e pós na mesma variável em uma única expressão (${globalVarC.count_line}, ${globalVarC.count_column}).`;
            return false;
        }
        getToken();
        let temp = newTemp();
        geraInstrucao('', globalVarC.identificador, '', temp, globalVarC.count_line);
        geraInstrucao('-', globalVarC.identificador, 1, globalVarC.identificador, globalVarC.count_line);
        if (ExpressaoPosRestante(lado_atribuicao)) {
            return temp;
        } else {
            return false;
        }
    } else {
        return true;
    }
}

function ExpressaoPrima(lado_atribuicao) {
    if (globalVarC.tk === globalVarC.TKs['TKId']) {
        globalVarC.identificador = globalVarC.lexico.toString().replace(/\x00/g, '');
        // if (!globalVarC.identificador || globalVarC.identificador !== globalVarC.lexico.toString().replace(/\x00/g, '')){
        //     if (!verifica_variavel_declarada(globalVarC.lexico.toString().replace(/\x00/g, ''))){
        //         return false;
        //     }
        // }
        if (verifica_variavel_declarada(globalVarC.index_escopo, globalVarC.lexico.toString().replace(/\x00/g, ''))){
            getToken();
            return globalVarC.identificador;
        } else {
            throw 'Variável não declarada';
            return false;
        }
    } else if (globalVarC.tk === globalVarC.TKs['TKCteInt'] || globalVarC.tk === globalVarC.TKs['TKCteDouble']) {
        if (lado_atribuicao !== 'esquerdo') {
            let arg1 = globalVarC.lexico.toString().replace(/\x00/g, '');
            getToken();
            return arg1;
        } else {
            if (globalVarC.dic_control['msg_erro'] === '') {
                globalVarC.dic_control['msg_erro'] += "operador do lado esquerdo de uma atribuição requere um identificador válido " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    } else if(globalVarC.tk === globalVarC.TKs['TKAbreParenteses']){
        getToken();
        let result = Expressao();
        if (result){
            if (globalVarC.tk === globalVarC.TKs['TKFechaParenteses']){
                getToken();
                return result;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } else {
        return false;
    }
}


function ExpressPos(lado_atribuicao){
    let arg1 = globalVarC.lexico.toString().replace(/\x00/g, '');
    let result = ExpressaoPrima(lado_atribuicao);
    if (result){
        if (typeof result !== 'string'){
            let temp = newTemp();
            result = ExpressaoPosRestante(lado_atribuicao, arg1);
            globalVarC.dimensao = 0;
            if (result){
                return result;
            } else {
                return false;
            }
        } else {
            let temp2 = ExpressaoPosRestante(lado_atribuicao, arg1);
            globalVarC.dimensao = 0;
            if (temp2){
                if (typeof temp2 === 'string'){
                    return temp2;
                } else {
                    return result;
                }
            } else {
                return false;
            }
        }
    } else {
        return false;
    }
}

function ExpressUnaria(lado_atribuicao){
    let arg1 = globalVarC.lexico.toString().replace(/\x00/g, '');
    let result = ExpressPos(lado_atribuicao);
    if (result){
        return result;
    } else if (globalVarC.tk === globalVarC.TKs['TKDuploMais']){
        globalVarC.empilha_operacao_aritmetica.push('++');
        getToken();
        if (globalVarC.tk === globalVarC.TKs['TKCteInt'] || globalVarC.tk === globalVarC.TKs['TKCteDouble']){
            if (globalVarC.dic_control['msg_erro'] === ''){
                globalVarC.dic_control['msg_erro'] = `Operação inválida ++${globalVarC.lexico}. O operador de incremento não pode ser aplicado a uma constante. `  + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
        if (ExpressUnaria()){
            globalVarC.empilha_operacao_aritmetica.pop();
            geraInstrucao('+', globalVarC.identificador, '1', globalVarC.identificador, globalVarC.count_line);
            return globalVarC.identificador;
        } else {
            return false;
        }
    } else if (globalVarC.tk === globalVarC.TKs['TKDuploMenos']){
        globalVarC.empilha_operacao_aritmetica.push('--');
        getToken();
        if (globalVarC.tk === globalVarC.TKs['TKCteInt'] || globalVarC.tk === globalVarC.TKs['TKCteDouble']){
            if (globalVarC.dic_control['msg_erro'] === ''){
                globalVarC.dic_control['msg_erro'] = `Operação inválida --${globalVarC.lexico}. O operador de decremento não pode ser aplicado a uma constante. `  + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
        if (ExpressUnaria()){
            geraInstrucao('-', globalVarC.identificador, '1', globalVarC.identificador, globalVarC.count_line);
            return globalVarC.identificador;
        } else {
            return false;
        }
    } else if (OperadorUnario()){
        let arg2 = ExpressUnaria();
        if (arg2){
            return arg1 + arg2;
        } else {
            return false;
        }
    } else {
        return false;
    }
}


function ExpressMultiplRestante(temp, arg1){
    if (globalVarC.tk === globalVarC.TKs['TKDiv']){
        getToken();
        let arg2 = globalVarC.lexico.toString().replace(/\x00/g, '');
        let result = ExpressUnaria();
        if (result) {
            if (typeof result !== 'string') {
                geraInstrucao('/', arg1, arg2, temp, globalVarC.count_line);
            } else {
                geraInstrucao('/', arg1, result, temp, globalVarC.count_line);
            }
            let temp2 = ExpressMultiplRestante(newTemp(), temp);
            if (typeof temp2 === 'string'){
                return temp2;
            } else {
                return temp;
            }
        } else {
            if (globalVarC.dic_control['msg_erro'] === ''){
                globalVarC.dic_control['msg_erro'] = "Não encontrou expressão após '/' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    } else if (globalVarC.tk === globalVarC.TKs['TKMult']){
        getToken();
        let arg2 = globalVarC.lexico.toString().replace(/\x00/g, '');
        let result = ExpressUnaria();
        if (result) {
            if (typeof result !== 'string') {
                geraInstrucao('*', arg1, arg2, temp, globalVarC.count_line);
            } else {
                geraInstrucao('*', arg1, result, temp, globalVarC.count_line);
            }
            let temp2 = ExpressMultiplRestante(newTemp(), temp);
            if (typeof temp2 === 'string'){
                return temp2;
            } else {
                return temp;
            }
        } else {
            if (globalVarC.dic_control['msg_erro'] === ''){
                globalVarC.dic_control['msg_erro'] = "Não encontrou expressão após '*' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    } else if (globalVarC.tk === globalVarC.TKs['TKResto']){
        getToken();
        let arg2 = globalVarC.lexico.toString().replace(/\x00/g, '');
        let result = ExpressUnaria();
        if (result) {
            if (typeof result !== 'string') {
                geraInstrucao('%', arg1, arg2, temp, globalVarC.count_line);
            } else {
                geraInstrucao('%', arg1, result, temp, globalVarC.count_line);
            }
            let temp2 = ExpressMultiplRestante(newTemp(), temp);
            if (typeof temp2 === 'string'){
                return temp2;
            } else {
                return temp;
            }
        } else {
            if (globalVarC.dic_control['msg_erro'] === ''){
                globalVarC.dic_control['msg_erro'] = "Não encontrou expressão após '%' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    } else {
        return true;
    }
}


function ExpressMultipl() {
    let temp = newTemp();
    var arg1 = globalVarC.lexico.toString().replace(/\x00/g, '');
    let result = ExpressUnaria();
    if (result) {
        if (typeof result !== 'string'){
            let temp = newTemp();
            result = ExpressMultiplRestante(temp, arg1);
            if (result){
                return result;
            } else {
                return false;
            }
        } else {
            let temp2 = ExpressMultiplRestante(newTemp(), result);
            if (typeof temp2 === 'string'){
                return temp2;
            } else {
                return result;
            }
        }
    } else {
        return false;
    }
}


function ExpressAddRestante(temp, arg1) {
    if (globalVarC.tk === globalVarC.TKs['TKMais']) {
        getToken();
        let arg2 = globalVarC.lexico.toString().replace(/\x00/g, '');
        let result = ExpressMultipl();
        if (result) {
            if (typeof result !== 'string'){
                geraInstrucao('+', arg1, arg2, temp, globalVarC.count_line);
            } else {
                geraInstrucao('+', arg1, result, temp, globalVarC.count_line);
            }
            let temp2 = ExpressAddRestante(newTemp(), temp);
            if (typeof temp2 === 'string'){
                return temp2;
            } else {
                return temp;
            }
        } else {
            if (globalVarC.dic_control['msg_erro'] === ''){
                globalVarC.dic_control['msg_erro'] = "Não encontrou expressão após '+' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    } else if (globalVarC.tk === globalVarC.TKs['TKMenos']) {
        getToken();
        let arg2 = globalVarC.lexico.toString().replace(/\x00/g, '');
        let result = ExpressMultipl();
        if (result) {
            if (typeof result !== 'string'){
                geraInstrucao('-', arg1, arg2, temp, globalVarC.count_line);
            } else {
                geraInstrucao('-', arg1, result, temp, globalVarC.count_line);
            }
            let temp2 = ExpressAddRestante(newTemp(), temp);
            if (typeof temp2 === 'string'){
                return temp2;
            } else {
                return temp;
            }
        } else {
            if (globalVarC.dic_control['msg_erro'] === ''){
                globalVarC.dic_control['msg_erro'] = "Não encontrou expressão após '-' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    } else if (globalVarC.tk === globalVarC.TKs['TKLogicalNot']) {
        getToken();
        let arg2 = globalVarC.lexico.toString().replace(/\x00/g, '');
        let result = ExpressMultipl();
        if (result) {
            if (typeof result !== 'string'){
                geraInstrucao('!', arg1, arg2, temp, globalVarC.count_line);
            } else {
                geraInstrucao('!', arg1, result, temp, globalVarC.count_line);
            }
            let temp2 = ExpressAddRestante(newTemp(), temp);
            if (typeof temp2 === 'string'){
                return temp2;
            } else {
                return temp;
            }
        } else {
            if (globalVarC.dic_control['msg_erro'] === ''){
                globalVarC.dic_control['msg_erro'] = "Não encontrou expressão após '!' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    } else {
        return true;
    }
}


function ExpressAdd() {
    let arg1 = globalVarC.lexico.toString().replace(/\x00/g, '');
    let result = ExpressMultipl();
    if (result) {
        if (typeof result !== 'string'){
            let temp = newTemp();
            result = ExpressAddRestante(temp, arg1);
            if (result){
                return result;
            } else {
                return false;
            }
        } else {
            let temp2 = ExpressAddRestante(newTemp(), result);
            if (typeof temp2 === 'string'){
                return temp2;
            } else {
                return result;
            }
        }
    } else {
        return false;
    }
}


function ExpressRelacionalRestante(temp, arg1){
    if (globalVarC.tk === globalVarC.TKs['TKMenor']){
        getToken();
        let arg2 = globalVarC.lexico.toString().replace(/\x00/g, '');
        let result = ExpressAdd();
        if (result){
            if (typeof result !== 'string'){
                geraInstrucao('<', arg1, arg2, temp, globalVarC.count_line);
            } else {
                geraInstrucao('<', arg1, result, temp, globalVarC.count_line);
            }
            let temp2 = ExpressRelacionalRestante(newTemp(), temp);
            if (typeof temp2 === 'string'){
                return temp2;
            } else {
                return temp;
            }
        } else {
            if (globalVarC.dic_control['msg_erro'] === ''){
                globalVarC.dic_control['msg_erro'] = "Não encontrou expressão após '<' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    } else if (globalVarC.tk === globalVarC.TKs['TKMaior']){
        getToken();
        let arg2 = globalVarC.lexico.toString().replace(/\x00/g, '');
        let result = ExpressAdd();
        if (result){
            if (typeof result !== 'string'){
                geraInstrucao('>', arg1, arg2, temp, globalVarC.count_line);
            } else {
                geraInstrucao('>', arg1, result, temp, globalVarC.count_line);
            }
            let temp2 = ExpressRelacionalRestante(newTemp(), temp);
            if (typeof temp2 === 'string'){
                return temp2;
            } else {
                return temp;
            }
        } else {
            if (globalVarC.dic_control['msg_erro'] === ''){
                globalVarC.dic_control['msg_erro'] = "Não encontrou expressão após '>' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    } else if (globalVarC.tk === globalVarC.TKs['TKMenorIgual']){
        getToken();
        let arg2 = globalVarC.lexico.toString().replace(/\x00/g, '');
        let result = ExpressAdd();
        if (result){
            if (typeof result !== 'string'){
                geraInstrucao('<=', arg1, arg2, temp, globalVarC.count_line);
            } else {
                geraInstrucao('<=', arg1, result, temp, globalVarC.count_line);
            }
            let temp2 = ExpressRelacionalRestante(newTemp(), temp);
            if (typeof temp2 === 'string'){
                return temp2;
            } else {
                return temp;
            }
        } else {
            if (globalVarC.dic_control['msg_erro'] === ''){
                globalVarC.dic_control['msg_erro'] = "Não encontrou expressão após '<=' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    } else if (globalVarC.tk === globalVarC.TKs['TKMaiorIgual']){
        getToken();
        let arg2 = globalVarC.lexico.toString().replace(/\x00/g, '');
        let result = ExpressAdd();
        if (result){
            if (typeof result !== 'string'){
                geraInstrucao('>=', arg1, arg2, temp, globalVarC.count_line);
            } else {
                geraInstrucao('>=', arg1, result, temp, globalVarC.count_line);
            }
            let temp2 = ExpressRelacionalRestante(newTemp(), temp);
            if (typeof temp2 === 'string'){
                return temp2;
            } else {
                return temp;
            }
        } else {
            if (globalVarC.dic_control['msg_erro'] === ''){
                globalVarC.dic_control['msg_erro'] = "Não encontrou expressão após '>=' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    } else {
        return true;
    }
}


function ExpressRelacional() {
    let arg1 = globalVarC.lexico.toString().replace(/\x00/g, '');
    let result = ExpressAdd();
    if (result){
        if (typeof result !== 'string'){
            let temp = newTemp();
            result = ExpressRelacionalRestante(temp, arg1);
            if (result){
                return result;
            } else {
                return false;
            }
        } else {
            let temp2 = ExpressRelacionalRestante(newTemp(), result);
            if (typeof temp2 === 'string'){
                return temp2;
            } else {
                return result;
            }
        }
    } else {
        return false;
    }
}


function ExpressIgualRestante(temp, arg1){
    if (globalVarC.tk === globalVarC.TKs['TKCompare']) {
        getToken();
        let arg2 = globalVarC.lexico.toString().replace(/\x00/g, '');
        let result = ExpressRelacional();
        if (result){
            if (typeof result !== 'string'){
                geraInstrucao('==', arg1, arg2, temp, globalVarC.count_line);
            } else {
                geraInstrucao('==', arg1, result, temp, globalVarC.count_line);
            }
            let temp2 = ExpressIgualRestante(newTemp(), temp);
            if (typeof temp2 === 'string'){
                return temp2;
            } else {
                return temp;
            }
        } else {
            if (globalVarC.dic_control['msg_erro'] === ''){
                globalVarC.dic_control['msg_erro'] = "Não encontrou expressão após '==' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    } else if (globalVarC.tk === globalVarC.TKs['TKDiferent']) {
        getToken();
        let arg2 = globalVarC.lexico.toString().replace(/\x00/g, '');
        let result = ExpressRelacional();
        if (result){
            if (typeof result !== 'string'){
                geraInstrucao('!=', arg1, arg2, temp, globalVarC.count_line);
            } else {
                geraInstrucao('!=', arg1, result, temp, globalVarC.count_line);
            }
            let temp2 = ExpressIgualRestante(newTemp(), temp);
            if (typeof temp2 === 'string'){
                return temp2;
            } else {
                return temp;
            }
        } else {
            if (globalVarC.dic_control['msg_erro'] === ''){
                globalVarC.dic_control['msg_erro'] = "Não encontrou expressão após '!=' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    } else {
        return true;
    }
}


function ExpressIgual(){
    let arg1 = globalVarC.lexico.toString().replace(/\x00/g, '');
    let result = ExpressRelacional();
    if (result){
        if (typeof result !== 'string'){
            let temp = newTemp();
            result = ExpressIgualRestante(temp, arg1);
            if (result){
                return result;
            } else {
                return false;
            }
        } else {
            let temp2 = ExpressIgualRestante(newTemp(), result);
            if (typeof temp2 === 'string'){
                return temp2;
            } else {
                return result;
            }
        }
    } else {
        return false;
    }
}


function ExpressLogicAndRestante(temp, arg1){
    if (globalVarC.tk === globalVarC.TKs['TKLogicalAnd']){
        getToken();
        let arg2 = globalVarC.lexico.toString().replace(/\x00/g, '');
        let result = ExpressIgual();
        if (result){
            if (typeof result !== 'string'){
                geraInstrucao('&&', arg1, arg2, temp, globalVarC.count_line);
            } else {
                geraInstrucao('&&', arg1, result, temp, globalVarC.count_line);
            }
            let temp2 = ExpressLogicAndRestante(newTemp(), temp);
            if (typeof temp2 === 'string'){
                return temp2;
            } else {
                return temp;
            }
        } else {
            return false;
        }
    } else {
        return true;
    }
}


function ExpressLogicAnd(){
    let arg1 = globalVarC.lexico.toString().replace(/\x00/g, '');
    let result = ExpressIgual();
    if (result){
        if (typeof result !== 'string'){
            let temp = newTemp();
            result = ExpressLogicAndRestante(temp, arg1);
            if (result){
                return result;
            } else {
                return false;
            }
        } else {
            let temp2 = ExpressLogicAndRestante(newTemp(), result);
            if (typeof temp2 === 'string'){
                return temp2;
            } else {
                return result;
            }
        }
    } else {
        return false;
    }
}


function ExpressLogicOrRestante(temp, arg1){
    if (globalVarC.tk === globalVarC.TKs['TKLogicalOr']){
        getToken();
        let arg2 = globalVarC.lexico.toString().replace(/\x00/g, '');
        let result = ExpressLogicAnd();
        if (result){
            if (typeof result !== 'string'){
                geraInstrucao('||', arg1, arg2, temp, globalVarC.count_line);
            } else {
                geraInstrucao('||', arg1, result, temp, globalVarC.count_line);
            }
            let temp2 = ExpressLogicOrRestante(newTemp(), temp);
            if (typeof temp2 === 'string'){
                return temp2;
            } else {
                return temp;
            }
        } else {
            return false;
        }
    } else {
        return true;
    }
}


function ExpressLogicOr(){
    let arg1 = globalVarC.lexico.toString().replace(/\x00/g, '');
    let result = ExpressLogicAnd();
    if (result){
        if (typeof result !== 'string'){
            let temp = newTemp();
            result = ExpressLogicOrRestante(temp, arg1);
            if (result){
                return result;
            } else {
                return false;
            }
        } else {
            let temp2 = ExpressLogicOrRestante(newTemp(), result);
            if (typeof temp2 === 'string'){
                return temp2;
            } else {
                return result;
            }
        }
    } else {
        return false;
    }
}


function ExpressCondic(){
    let result = ExpressLogicOr();
    if (result){
        return result;
    } else {
        return false;
    }
}


function ExpressAtrib(lado_atribuicao){
    backtracking('push');
    let id = ExpressUnaria(lado_atribuicao);
    if (id){
        if (typeof id !== 'string'){
            id = globalVarC.identificador;
        }
        // if (isNaN(parseFloat(id))){
        //     if (!verifica_variavel_declarada(globalVarC.index_escopo, globalVarC.identificador, dimensao, false, false, true)){
        //         throw 'Erro sintático';
        //     }
        // }
        let operador = globalVarC.lexico.toString().replace(/\x00/g, '');
        if (OperadorAtrib()){
            // if (verifica_variavel_declarada(globalVarC.identificador, dimensao)){
                globalVarC.dimensao = 0;
                var arg1 = globalVarC.lexico.toString().replace(/\x00/g, '');
                let result = ExpressAtrib();
                if (result){
                    if (typeof result !== 'string'){
                        if (operador !== '='){
                            geraInstrucao(operador[0], id, arg1, id, globalVarC.count_line);
                        } else {
                            geraInstrucao('', arg1, '', id, globalVarC.count_line);
                        }
                    } else {
                        if (operador !== '='){
                            geraInstrucao(operador[0], id, result, id, globalVarC.count_line);
                        } else {
                            geraInstrucao('', result, '', id, globalVarC.count_line);
                        }
                    }
                    return id;
                }
            // }
        } else {
            lado_atribuicao = undefined;
        }
    }
    backtracking('pop');
    var arg1 = globalVarC.lexico.toString().replace(/\x00/g, '');
    let result = ExpressCondic();
    if (result){
        if (lado_atribuicao === 'esquerdo'){
            if (typeof result !== 'string'){
                if (globalVarC.identificador){
                    geraInstrucao('', arg1, '', globalVarC.identificador, globalVarC.count_line);
                }
                return arg1;
            } else {
                geraInstrucao('', result, '', globalVarC.identificador, globalVarC.count_line);
                return result;
            }
        } else {
            if (typeof result !== 'string'){
                return arg1;
            } else {
                return result;
            }
        }

    } else {
        return false;
    }
}


function ExpressaoRestante(lado_atribuicao, printf){
    if (globalVarC.tk === globalVarC.TKs['TKVirgula']){
        getToken();
        globalVarC.dimensao = 0;
        let result = ExpressAtrib(lado_atribuicao);
        if (result){
            let temp2 = ExpressaoRestante(lado_atribuicao, printf);
            if (temp2){
                if (printf){
                    if (typeof temp2 === 'string') {
                        return result + ',' + temp2;
                    } else {
                        return result;
                    }
                } else {
                    if (typeof temp2 === 'string') {
                        return result + ',' + temp2;
                    } else {
                        return result;
                    }
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    } else {
        return true;
    }
}


function Expressao(lado_atribuicao, empilha_parametros=true){
    let result = ExpressAtrib(lado_atribuicao);
    if (result){
        let temp2 = ExpressaoRestante(lado_atribuicao);
        if (temp2){
            if (typeof temp2 === 'string') {
                if (empilha_parametros){
                    globalVarC.lista_parametros_func.push(result + ',' +temp2);
                }
                return temp2;
            } else {
                if (empilha_parametros){
                    globalVarC.lista_parametros_func.push(result);
                }
                return result;
            }
        } else {
            return false;
        }
    } else {
        return false;
    }
}


function InstrExpress(lado_atribuicao){
    if (globalVarC.tk === globalVarC.TKs['TKPontoEVirgula']){
        getToken();
        return true;
    } else {
        if (globalVarC.tk !== globalVarC.TKs['TKFechaChaves']){
            globalVarC.dimensao = 0;
            let result = Expressao(lado_atribuicao);
            if (result){
                if (globalVarC.tk === globalVarC.TKs['TKPontoEVirgula']){
                    getToken();
                    return result;
                } else {
                    if (globalVarC.dic_control['msg_erro'] === '') {
                        globalVarC.dic_control['msg_erro'] = "não encontrou o caracter ';' ao final do comando " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                    }
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
}


function InstrCondicional(esta_em_laco){
    if (globalVarC.tk === globalVarC.TKs['TKIf']){
        getToken();
        if (globalVarC.tk === globalVarC.TKs['TKAbreParenteses']){
            getToken();
            globalVarC.dimensao = 0;
            let result = Expressao('esquerdo');
            if (result){
                if (globalVarC.tk === globalVarC.TKs['TKFechaParenteses']) {
                    getToken();
                    let labelElse = newLabel();
                    geraInstrucao('goto', result, labelElse, 'ifFalse', globalVarC.count_line, true);
                    globalVarC.index_escopo_pai = globalVarC.index_escopo;
                    globalVarC.index_escopo = globalVarC.tabela_de_simbolos.length;
                    verifica_existencia_escopo_tabela_simbolos(globalVarC.index_escopo);
                    geraInstrucao('', '', '', '#' + globalVarC.index_escopo, globalVarC.count_line, false, false, true, false, true);
                    globalVarC.index_escopo -= 1;
                    if (Instr(esta_em_laco)) {
                        if (globalVarC.tk === globalVarC.TKs['TKElse']){
                            geraInstrucao('', '', '', '#' + globalVarC.index_escopo, globalVarC.count_line, false, false, true, false, true);
                            let labelSaidaElse = newLabel();
                            globalVarC.index_escopo_pai = globalVarC.index_escopo;
                            globalVarC.index_escopo = globalVarC.tabela_de_simbolos.length;
                            verifica_existencia_escopo_tabela_simbolos(globalVarC.index_escopo);
                            geraInstrucao('', labelSaidaElse, '', 'goto', globalVarC.count_line, true);
                            geraInstrucao('', '', '', labelElse, globalVarC.count_line, false, false, true);
                            geraInstrucao('', '', '', '#' + globalVarC.index_escopo, globalVarC.count_line, false, false, true, false, true);
                            getToken();
                            globalVarC.index_escopo -= 2;
                            if (Instr()){
                                geraInstrucao('', '', '', labelSaidaElse, globalVarC.count_line, false, false, true);
                                return true;
                            }
                        } else {
                            geraInstrucao('', '', '', labelElse, globalVarC.count_line, false, false, true);
                            globalVarC.index_escopo = globalVarC.index_escopo_pai;
                            globalVarC.index_escopo_pai = globalVarC.tabela_de_simbolos[globalVarC.index_escopo]['escopo_pai'];
                            geraInstrucao('', '', '', '#' + globalVarC.index_escopo, globalVarC.count_line, false, false, true, false, true);
                            return true;
                        }
                    } else {
                        if (globalVarC.dic_control['msg_erro'] === '') {
                            globalVarC.dic_control['msg_erro'] = "Instrução era esperada após ')' no comando if " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                        }
                        return false;
                    }
                } else {
                    if (globalVarC.dic_control['msg_erro'] === '') {
                        globalVarC.dic_control['msg_erro'] = "não encontrou o caracter ')' ao final da expressão no comando if " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                    }
                    return false;
                }
            } else {
                if (globalVarC.dic_control['msg_erro'] === '') {
                    globalVarC.dic_control['msg_erro'] = "não encontrou o expressão antes de ')' no comando if " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                }
                return false;
            }
        } else {
            if (globalVarC.dic_control['msg_erro'] === '') {
                globalVarC.dic_control['msg_erro'] = "não encontrou o caracter '(' ao final da expressão no comando if " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    }
}


function InstrIteracao(){
    if (globalVarC.tk === globalVarC.TKs['TKWhile']){
        let labelInicio = newLabel();
        geraInstrucao('', '', '', labelInicio, globalVarC.count_line, false, false, true);
        getToken();
        if (globalVarC.tk === globalVarC.TKs['TKAbreParenteses']){
            getToken();
            globalVarC.dimensao = 0;
            let result = Expressao('esquerdo');
            if (result){
                let labelFim = newLabel();
                geraInstrucao('goto', result, labelFim, 'ifFalse', globalVarC.count_line, true);
                if (globalVarC.tk === globalVarC.TKs['TKFechaParenteses']){
                    getToken();
                    globalVarC.index_escopo_pai = globalVarC.index_escopo;
                    globalVarC.index_escopo = globalVarC.tabela_de_simbolos.length;
                    geraInstrucao('', '', '', '#' + globalVarC.index_escopo, globalVarC.count_line, false, false, true, false, true);
                    if (Instr({'labelInicio': labelInicio, 'labelFim': labelFim})) {
                        geraInstrucao('', labelInicio, '', 'goto', globalVarC.count_line, true);
                        geraInstrucao('', '', '', labelFim, globalVarC.count_line, false, false, true);
                        globalVarC.index_escopo = globalVarC.tabela_de_simbolos.length;
                        return true;
                    }
                } else {
                    if (globalVarC.dic_control['msg_erro'] === '') {
                        globalVarC.dic_control['msg_erro'] = "não encontrou o caracter ')' ao final da expressão no comando while  " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                    }
                    return false;
                }
            } else {
                if (globalVarC.dic_control['msg_erro'] === '') {
                    globalVarC.dic_control['msg_erro'] = "não encontrou o expressão antes de ')' no comando while " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                }
                return false;
            }
        } else {
            if (globalVarC.dic_control['msg_erro'] === '') {
                globalVarC.dic_control['msg_erro'] = "não encontrou o caracter ')' ao final da expressão no comando while  " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    } else if (globalVarC.tk === globalVarC.TKs['TKDo']){
        let labelInicio = newLabel();
        let labelFim = newLabel();
        geraInstrucao('', '', '', labelInicio, globalVarC.count_line, false, false, true);
        getToken();
        globalVarC.index_escopo_pai = globalVarC.index_escopo;
        globalVarC.index_escopo = globalVarC.tabela_de_simbolos.length;
        geraInstrucao('', '', '', '#' + globalVarC.index_escopo, globalVarC.count_line, false, false, true, false, true);
        if (Instr({'labelInicio': labelInicio, 'labelFim': labelFim})) {
            globalVarC.index_escopo = globalVarC.index_escopo_pai;
            globalVarC.index_escopo_pai = globalVarC.tabela_de_simbolos[globalVarC.index_escopo]['escopo_pai'];
            geraInstrucao('', '', '', '#' + globalVarC.index_escopo, globalVarC.count_line, false, false, true, false, true);
            if (globalVarC.tk === globalVarC.TKs['TKWhile']){
                getToken();
                if (globalVarC.tk === globalVarC.TKs['TKAbreParenteses']){
                    getToken();
                    let result = Expressao();
                    if (result){
                        geraInstrucao('goto', result, labelFim, 'ifFalse', globalVarC.count_line, true);
                        geraInstrucao('', labelInicio, '', 'goto', globalVarC.count_line, true);
                        geraInstrucao('', '', '', labelFim, globalVarC.count_line, false, false, true);
                        if (globalVarC.tk === globalVarC.TKs['TKFechaParenteses']){
                            getToken();
                            if (globalVarC.tk === globalVarC.TKs['TKPontoEVirgula']){
                                getToken();
                                return true;
                            } else {
                                if (globalVarC.dic_control['msg_erro'] === '') {
                                    globalVarC.dic_control['msg_erro'] += "não encontrou o caracter ';' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                                }
                                return false;
                            }
                        } else {
                            if (globalVarC.dic_control['msg_erro'] === ''){
                                globalVarC.dic_control['msg_erro'] += "não encontrou o caracter ')' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                            }
                            return false;
                        }
                    } else {
                        if (globalVarC.dic_control['msg_erro'] === '') {
                            globalVarC.dic_control['msg_erro'] = "não encontrou o expressão antes de ')' no comando while " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                        }
                        return false;
                    }
                } else {
                    if (globalVarC.dic_control['msg_erro'] === '') {
                        globalVarC.dic_control['msg_erro'] += "não encontrou o caracter '(' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                    }
                    return false;
                }
            } else {
                if (globalVarC.dic_control['msg_erro'] === '') {
                    globalVarC.dic_control['msg_erro'] = "não encontrou o comando while em laço de repetição do" + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                }
                return false;
            }
        } else {
            return false;
        }
    } else if (globalVarC.tk === globalVarC.TKs['TKFor']){
        let labelInicio = newLabel();
        getToken();
        if (globalVarC.tk === globalVarC.TKs['TKAbreParenteses']){
            getToken();
            if (InstrExpress('esquerdo')){
                geraInstrucao('', '', '', labelInicio, globalVarC.count_line, false, false, true);
                let result = InstrExpress();
                if (result){
                    let labelFim = newLabel();
                    geraInstrucao('goto', result, labelFim, 'ifFalse', globalVarC.count_line, true);
                    let labelInstr = newLabel();
                    geraInstrucao('', labelInstr, '', 'goto', globalVarC.count_line, true);
                    let labelIncremento = newLabel();
                    geraInstrucao('', '', '', labelIncremento, globalVarC.count_line, false, false, true);
                    geraInstrucao('', '', '', '#' + globalVarC.index_escopo, globalVarC.count_line, false, false, true, false, true);
                    if(Expressao('esquerdo')){
                        geraInstrucao('', labelInicio, '', 'goto', globalVarC.count_line, true);
                        if (globalVarC.tk === globalVarC.TKs['TKFechaParenteses']){
                            getToken();
                            geraInstrucao('', '', '', labelInstr, globalVarC.count_line, false, false, true);
                            globalVarC.index_escopo_pai = globalVarC.index_escopo;
                            globalVarC.index_escopo = globalVarC.tabela_de_simbolos.length;
                            geraInstrucao('', '', '', '#' + globalVarC.index_escopo, globalVarC.count_line, false, false, true, false, true);
                            if (Instr({'labelInicio': labelIncremento, 'labelFim': labelFim})){
                                geraInstrucao('', labelIncremento, '', 'goto', globalVarC.count_line, true);
                                geraInstrucao('', '', '', labelFim, globalVarC.count_line, false, false, true);
                                globalVarC.index_escopo = globalVarC.index_escopo_pai;
                                globalVarC.index_escopo_pai = globalVarC.tabela_de_simbolos[globalVarC.index_escopo]['escopo_pai'];
                                geraInstrucao('', '', '', '#' + globalVarC.index_escopo, globalVarC.count_line, false, false, true, false, true);
                                return true;
                            } else {
                                return false;
                            }
                        } else {
                            if (globalVarC.dic_control['msg_erro'] === '') {
                                globalVarC.dic_control['msg_erro'] += "não encontrou o caracter ')' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                            }
                            return false;
                        }
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            if (globalVarC.dic_control['msg_erro'] === '') {
                globalVarC.dic_control['msg_erro'] += "não encontrou o caracter '(' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    } else {
        return false;
    }
}


function InstrSalto(esta_no_laco){
    if (globalVarC.tk === globalVarC.TKs['TKContinue']){
        if (esta_no_laco){
            geraInstrucao('', esta_no_laco['labelInicio'], '', 'goto', globalVarC.count_line, true);
            getToken();
            if (globalVarC.tk === globalVarC.TKs['TKPontoEVirgula']){
                getToken();
                return true;
            } else {
                if (globalVarC.dic_control['msg_erro'] === '') {
                    globalVarC.dic_control['msg_erro'] += "não encontrou o caracter ';' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                }
                return false;
            }
        } else {
            globalVarC.dic_control['msg_erro'] = "Comando continue não está dentro de um laço" + '\n';
            return false;
        }
    } else if (globalVarC.tk === globalVarC.TKs['TKBreak']){
        if (esta_no_laco) {
            geraInstrucao('', esta_no_laco['labelFim'], '', 'goto', globalVarC.count_line, true);
            getToken();
            if (globalVarC.tk === globalVarC.TKs['TKPontoEVirgula']) {
                getToken();
                return true;
            } else {
                if (globalVarC.dic_control['msg_erro'] === '') {
                     globalVarC.dic_control['msg_erro'] += "não encontrou o caracter ';' no comando break " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                 }
                return false;
            }
        } else {
            globalVarC.dic_control['msg_erro'] = "Comando break não está dentro de um laço" + '\n';
            return false;
        }
    } else if (globalVarC.tk === globalVarC.TKs['TKReturn']){
        globalVarC.achou_return = true;
        getToken();
        if (globalVarC.tk === globalVarC.TKs['TKPontoEVirgula']){
            getToken();
            return true;
        } else {
            let  result = Expressao();
            if (result) {
                if (globalVarC.tk === globalVarC.TKs['TKPontoEVirgula']) {
                    geraInstrucao('', '', '', '#' + globalVarC.index_escopo, globalVarC.count_line, false, false, true, true, true);
                    geraInstrucao('', result, '', 'return', globalVarC.count_line, true);
                    getToken();
                    return true;
                } else {
                    if (globalVarC.dic_control['msg_erro'] === '') {
                        globalVarC.dic_control['msg_erro'] += "não encontrou o caracter ';' no return " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                    }
                    return false;
                }
            } else {
                if (globalVarC.dic_control['msg_erro'] === '') {
                    globalVarC.dic_control['msg_erro'] += "não encontrou o caracter ';' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                }
                return false;
            }
        }
    } else {
        return false;
    }
}


function LeituraRestante(){
    if (globalVarC.tk === globalVarC.TKs['TKVirgula']) {
        getToken();
        //globalVarC.dimensao = 0;
        if (globalVarC.tk === globalVarC.TKs['TKEnderecoVariavel']) {
            getToken();
            let arg1 = globalVarC.lexico.toString().replace(/\x00/g, '');
            let result = ExpressPos();
            if (result) {
                if (typeof result === 'string') {
                    arg1 = result;
                }
                let temp2 = LeituraRestante();
                if (temp2) {
                    if (typeof temp2 === 'string') {
                        return arg1 + ',' + temp2;
                    } else {
                        return arg1;
                    }
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            globalVarC.dic_control['msg_erro'] = "Não encontrou o caracter '&' no scanf" + '\n';
        }
    } else {
        return true;
    }
}


function InstrLeitura(){
    if (globalVarC.tk === globalVarC.TKs["TKScanf"]){
        if (!globalVarC.dic_control['bibliotecas'].stdio){
            globalVarC.dic_control['msg_erro'] = "Biblioteca <stdio.h> deve ser declarada para utilização do printf" + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            return false;
        }
        getToken();
        if (globalVarC.tk === globalVarC.TKs["TKAbreParenteses"]){
            getToken();
            if (globalVarC.tk === globalVarC.TKs["TKString"]){
                let scanf = globalVarC.lexico.toString().replace(/\x00/g, '');
                getToken();
                let result = LeituraRestante();
                if(result){
                    if (globalVarC.tk === globalVarC.TKs["TKFechaParenteses"]){
                        getToken();
                        if (globalVarC.tk === globalVarC.TKs["TKPontoEVirgula"]){
                            let qtd_args = 0;
                            if (typeof result === 'string'){
                                qtd_args = result.split(',').length;
                            }
                            if (scanf.toString().replace('"', '').replace(/\x00/g, '').split('%').length - 1 > 0 || qtd_args > 0) {
                                if (scanf.toString().replace('"', '').replace(/\x00/g, '').split('%').length - 1 === qtd_args) {
                                    geraInstrucao('', '', '', "scanf(" + scanf + "," + result + ")", globalVarC.count_line-1, false, false, false, true);
                                    return true;
                                } else {
                                    globalVarC.dic_control['msg_erro'] = "Número de argumentos difere do número de parâmetros" + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                                    return false;
                                }
                            } else {
                                geraInstrucao('', '', '', "scanf(" + printf + ")", globalVarC.count_line, false, false, false, true);
                                return true;
                            }
                            getToken();
                        } else {
                            if (globalVarC.dic_control['msg_erro'] === '') {
                                globalVarC.dic_control['msg_erro'] += "não encontrou o caracter ';' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                            }
                            return false;
                        }
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }
    }
}


function InstrEscrita(){
    if (globalVarC.tk === globalVarC.TKs["TKPrintf"]){
        if (!globalVarC.dic_control['bibliotecas'].stdio){
            globalVarC.dic_control['msg_erro'] = "Biblioteca <stdio.h> deve ser declarada para utilização do printf" + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            return false;
        }
        getToken();
        if (globalVarC.tk === globalVarC.TKs["TKAbreParenteses"]){
            getToken();
            if (globalVarC.tk === globalVarC.TKs["TKString"]){
                let printf = globalVarC.lexico.toString().replace(/\x00/g, '');
                getToken();
                let result = ExpressaoRestante('', true);
                if(result){
                    if (globalVarC.tk === globalVarC.TKs["TKFechaParenteses"]){
                        getToken();
                        if (globalVarC.tk === globalVarC.TKs["TKPontoEVirgula"]) {
                            let qtd_args = 0;
                            if (typeof result === 'string') {
                                qtd_args = result.split(',').length;
                            }
                            if (printf.toString().replace('"', '').replace(/\x00/g, '').split('%').length - 1 > 0 || qtd_args > 0) {
                                if (printf.toString().replace('"', '').replace(/\x00/g, '').split('%').length - 1 === qtd_args) {
                                    geraInstrucao('', '', '', "printf(" + printf + "," + result + ")", globalVarC.count_line-1, false, true);
                                    return true;
                                } else {
                                    globalVarC.dic_control['msg_erro'] = "Número de argumentos difere do número de parâmetros no comando printf" + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                                    return false;
                                }
                            } else {
                                geraInstrucao('', '', '', "printf(" + printf + ")", globalVarC.count_line, false, true);
                                return true;
                            }
                            getToken();
                        } else {
                            if (globalVarC.dic_control['msg_erro'] === '') {
                                globalVarC.dic_control['msg_erro'] += "não encontrou o caracter ';' no comando printf " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                            }
                            return false;
                        }
                    } else {
                        if (globalVarC.dic_control['msg_erro'] === '') {
                            globalVarC.dic_control['msg_erro'] += "não encontrou o caracter ')' no comando printf " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                        }
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                if (globalVarC.dic_control['msg_erro'] === '') {
                    globalVarC.dic_control['msg_erro'] += 'não encontrou o caracter " no printf ' + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                }
                return false;
            }
        } else {
            if (globalVarC.dic_control['msg_erro'] === '') {
                globalVarC.dic_control['msg_erro'] += "não encontrou o caracter '(' no printf " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    } else {
        return false;
    }
}


function Instr(esta_em_laco) {
    if (InstrCondicional(esta_em_laco)) {
        return true;
    } else if (InstrExpress('esquerdo')) {
        globalVarC.dic_control['encontrou_expressao'] = true;
        return true;
    } else if (InstrIteracao()) {
        globalVarC.dic_control['encontrou_expressao'] = true;
        return true;
    } else if (InstrSalto(esta_em_laco)){
        globalVarC.dic_control['encontrou_expressao'] = true;
        return true;
    } else if (ListaDec()){
        globalVarC.dic_control['encontrou_expressao'] = true;
        return true;
    } else if (InstrEscrita()){
        globalVarC.dic_control['encontrou_expressao'] = true;
        return true;}
    else if (InstrLeitura()){
        globalVarC.dic_control['encontrou_expressao'] = true;
        return true;
    } else if (CorpoFunc(esta_em_laco)){
        globalVarC.dic_control['encontrou_expressao'] = true;
        return true;
    } else {
        return false;
    }
}


function ListaInstrRestante(esta_no_laco) {
    let result = Instr(esta_no_laco);
    if (result) {
        if (ListaInstrRestante(esta_no_laco)) {
            return true;
        } else {
            return false;
        }
    } else {
        if (globalVarC.dic_control['msg_erro'] === ''){
            return true;
        } else {
            return false;
        }
    }
}


function ListaInstr(esta_no_laco){
    if (Instr(esta_no_laco)){
        if (ListaInstrRestante(esta_no_laco)){
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

function DecRestante(tipo, variavel, vetor_matriz){
    if (globalVarC.tk === globalVarC.TKs['TKAbreColchete']){
        getToken();
        var tam_vetor = globalVarC.lexico.toString().replace(/\x00/g, '');
        let result = ExpressCondic();
        if (result){
            if (typeof result === 'string') {
                tam_vetor = result;
            }
            if (globalVarC.tk === globalVarC.TKs['TKFechaColchete']){
                getToken();
                tabela_simbolos(globalVarC.index_escopo, 'tamanho', tipo, variavel, tam_vetor, vetor_matriz);
                let tam_vetor2 = DecRestante(tipo, variavel, vetor_matriz + 1);
                if (tam_vetor2){
                    if (typeof tam_vetor2 === 'string') {
                        return "[" + tam_vetor + "]" + tam_vetor2;
                    } else {
                        return "[" + tam_vetor + "]";
                    }
                    return true;
                } else {
                    return false;
                }
            } else {
                if (globalVarC.dic_control['msg_erro'] === '') {
                    globalVarC.dic_control['msg_erro'] += "não encontrou o caracter ']' na declaração da variável " + variavel + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                }
                 return false;
            }
        } else {
            globalVarC.dic_control['msg_erro'] += "não encontrou a declaração do tamanho do vetor na declaração da variável " + variavel + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            return false;
        }
    } else {
        return true;
    }
}

function Dec(tipo, variavel) {
    if (globalVarC.tk === globalVarC.TKs['TKId']) {
        if (tabela_simbolos(globalVarC.index_escopo, 'verifica_define', tipo, variavel) && verifica_variavel_declarada_em_escopos(globalVarC.index_escopo, variavel) && verifica_funcao_declarada(variavel)) {
            tabela_simbolos(globalVarC.index_escopo, 'grava', tipo, variavel);
            getToken();
            let result = DecRestante(tipo, variavel, 1);
            if (result) {
                if (typeof result === 'string') {
                    geraInstrucao('', '', '', variavel+result, globalVarC.count_line, false, false, false, false, false, false, tipo['tipo']);
                } else {
                    geraInstrucao('', '', '', variavel, globalVarC.count_line, false, false, false, false, false, false, tipo['tipo']);
                }
                return true;
            }
            return result;
        } else {
            if (globalVarC.dic_control['msg_erro'] === ''){
                globalVarC.dic_control['msg_erro'] = "variável " + variavel + ' não pode ser declarada devido a macro com o mesmo nome declarada (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    } else {
        return false;
    }
}


function DecInicial(tipo){
    let variavel = globalVarC.lexico.toString().replace(/\x00/g, '');
    if (Dec(tipo, variavel)){
        if (globalVarC.tk === globalVarC.TKs['TKIgual']){
            getToken();
            let result = ExpressAtrib();
            if (result){
                geraInstrucao('', result, '', variavel, globalVarC.count_line);
                return true;
            } else {
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
}


function ListaDecInicialRestante(tipo){
    if (globalVarC.tk === globalVarC.TKs['TKVirgula']) {
        getToken();
        if (DecInicial(tipo)) {
            if (ListaDecInicialRestante(tipo)) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } else {
        return true;
    }
}


function ListaDecInicial(tipo){
    if (DecInicial(tipo)){
        if (ListaDecInicialRestante(tipo)){
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}


function Declaracao(){
    globalVarC.dimensao = 0;
    var tipo = {'tk': globalVarC.tk,
                                   'tipo': globalVarC.lexico.toString().replace(/\x00/g, '')};
    if (Tipo()){
        if (ListaDecInicial(tipo)){
            if (globalVarC.tk === globalVarC.TKs['TKPontoEVirgula']){
                getToken();
                return true;
            } else {
                globalVarC.dic_control['encontrou_expressao'] = true;
                globalVarC.dic_control['msg_erro'] = "não encontrou o caracter ';' na declaração da variável " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                return false;
            }
        } else {
            if (globalVarC.dic_control['msg_erro'] === '') {
                globalVarC.dic_control['msg_erro'] += "não encontrou o caracter ';' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    } else {
        return false;
    }
}


function ListaDecRestante(){
    if (Declaracao()){
        if (ListaDecRestante()){
            return true;
        } else {
            return false;
        }
    } else {
        return true;
    }
}


function ListaDec(){
    if (Declaracao()){
        if (ListaDecRestante()){
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}


function CorpoFunc(esta_no_laco){
    if (globalVarC.tk === globalVarC.TKs['TKAbreChaves']) {
        getToken();
        if (globalVarC.tk === globalVarC.TKs['TKFechaChaves']) {
            getToken();
            return true;
        } else if (ListaInstr(esta_no_laco)) {
            if (globalVarC.tk === globalVarC.TKs['TKFechaChaves']) {
                getToken();
                return true;
            } else {
                if (globalVarC.dic_control['msg_erro'] === '') {
                    globalVarC.dic_control['msg_erro'] += "não encontrou o caracter '}' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                }
                return false;
            }
        // } else if (ListaDec()) {
        //     if (globalVarC.tk === globalVarC.TKs['TKFechaChaves']) {
        //         getToken();
        //         return true;
        //     } else if (ListaInstr()){
        //         if (globalVarC.tk === globalVarC.TKs['TKFechaChaves']){
        //             getToken();
        //             return true;
        //         } else {
        //             globalVarC.dic_control['msg_erro'] += "Não encontrou o caracter '}' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
        //             return false;
        //         }
        //     } else {
        //         globalVarC.dic_control['msg_erro'] += "Não encontrou o caracter '}' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
        //         return false;
        //     }
        } else {
            if (globalVarC.dic_control['msg_erro'] === ''){
                globalVarC.dic_control['msg_erro'] += "não encontrou o caracter '}' " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            }
            return false;
        }
    } else {
        return false;
    }
}


function DecFunc(){
    globalVarC.lista_parametros_func = [];
    var tipo = {'tk': globalVarC.tk,
                     'tipo': globalVarC.lexico.toString().replace(/\x00/g, '')};
    if (Tipo()){
        let nome_func = globalVarC.lexico.toString().replace(/\x00/g, '');
        if (NomeFunc(tipo)){
            if (globalVarC.tk === globalVarC.TKs['TKAbreParenteses']){
                getToken();
                globalVarC.index_escopo_pai = globalVarC.index_escopo;
                globalVarC.index_escopo = globalVarC.tabela_de_simbolos.length;
                geraInstrucao('', '', '', '#' + globalVarC.index_escopo, globalVarC.count_line, false, false, true, false, true);
                if (ListaParam()){
                    let parametros = globalVarC.lista_parametros_func.pop()
                    let lista_parametros = {};
                    if (!parametros){
                        parametros = '';
                    } else {
                        for (let i in parametros.split(',')){
                            lista_parametros[parametros.split(',')[i]] = {'tipo': globalVarC.tabela_de_simbolos[globalVarC.index_escopo]['variaveis'][parametros.split(',')[i]]['tipo']['tipo']};
                        }
                    }
                    geraInstrucao('', '', '', parametros, globalVarC.count_line, false, false, true, false, false, lista_parametros);
                    globalVarC.tabela_de_simbolos[0]["variaveis"][nome_func]['qtd_parametros_func'] = parametros.split(',').length;
                    if (globalVarC.tk === globalVarC.TKs['TKFechaParenteses']){
                        getToken();
                        globalVarC.achou_return = false;
                        globalVarC.obriga_return = false;
                        if (tipo['tipo'] !== 'void'){
                            globalVarC.obriga_return = true;
                        }
                        if (CorpoFunc()){
                            globalVarC.index_escopo_pai = 0;
                            globalVarC.index_escopo = 0;
                            if (globalVarC.obriga_return){
                                if (globalVarC.achou_return){
                                    return true;
                                } else {
                                    if (globalVarC.dic_control['msg_erro'] === ''){
                                        globalVarC.dic_control['msg_erro'] += "não encontrou o return na função " + nome_func + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                                    }
                                    return false;
                                }
                            } else {
                                return true;
                            }
                        }
                    } else {
                        if (globalVarC.dic_control['msg_erro'] === ''){
                            globalVarC.dic_control['msg_erro'] += "não encontrou o caracter ')' na declaracao da função" + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                        }
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                if (globalVarC.dic_control['msg_erro'] === ''){
                    globalVarC.dic_control['msg_erro'] += "não encontrou o caracter '(' na declaracao da função" + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                }
                return false;
            }
        } else {
            return false;
        }
    } else {
        return false;
    }
}


function DecLibDefine(){
    if (globalVarC.tk === globalVarC.TKs['TKDefine']){
        getToken();
        let variavel = globalVarC.lexico.toString().replace(/\x00/g, '');
        if (globalVarC.tk === globalVarC.TKs['TKId']){
            getToken();
            let arg1 = globalVarC.lexico.toString().replace(/\x00/g, '');
            if (globalVarC.tk === globalVarC.TKs['TKCteInt']){
                tabela_simbolos(globalVarC.index_escopo, 'grava', 'int', variavel, 0, 0, true);
                geraInstrucao('', arg1, '', variavel, globalVarC.count_line);
                getToken();
                return true
            } else if (globalVarC.tk === globalVarC.TKs['TKCteDouble']){
                tabela_simbolos(globalVarC.index_escopo, 'grava', 'float', variavel, 0, 0, true);
                geraInstrucao('', arg1, '', variavel, globalVarC.count_line);
                getToken();
                return true;
            } else {
                globalVarC.dic_control['msg_erro'] += "não encontrou valor atribuído a #define " + variavel + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
                return false
            }
        } else {
            globalVarC.dic_control['msg_erro'] += "não encontrou um macro declarado a #define " + ' (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
            return false
        }
    } else if (globalVarC.tk === globalVarC.TKs['TKInclude']){
        getToken();
        if (globalVarC.tk === globalVarC.TKs['TKStdioh']){
            getToken();
            globalVarC.dic_control["bibliotecas"]["stdio"] = true;
            return true;
        }
    } else {
        return false;
    }
}

function Dec2(){
    backtracking('push');
    if (Declaracao()){
        return true;
    }
    backtracking('pop');
    if (DecFunc()){
        geraInstrucao('', '', '', '#' + 0, globalVarC.count_line, false, false, true, false, true);
        if ('main' in globalVarC.tabela_de_simbolos[0]['variaveis']) {
            globalVarC.dic_control["encontrou_main"] = true;
        } else {
            if (!globalVarC.achou_return){
                geraInstrucao('', '', '', 'return', globalVarC.count_line, true);
            }
        }
        return true;
    } else if (DecLibDefine()){
        return true;
    } else {
        return false;
    }

}


function ListaDec2(){
    if (Dec2()){
        if (globalVarC.dic_control['encontrou_main']){
            geraInstrucaoInicial('', '$main', '', 'goto', globalVarC.count_line, true);
            return true;
        }
        if (ListaDec2()){
            return true;
        }
    } else {
        return false;
    }
}


export function Programa(){
    globalVarC.index_escopo = 0;
    globalVarC.index_escopo_pai = 0;
    if (ListaDec2()){
        geraInstrucaoInicial('', '', '', '#' + 0, globalVarC.count_line, false, false, true, false, true);
        geraInstrucaoInicial('', '', '', globalVarC.tabela_de_simbolos.length, globalVarC.count_line, false, false, true, false, true);
        return true;
    }
    return false;
}