const el = id => document.getElementById(id);

function numero(v){ return parseFloat(v.replace(/[^0-9.,]/g,'').replace(',','.'))||0; }
function moeda(v){ return v.toFixed(2).replace('.',','); }

function mascaraMoeda(input){
  input.addEventListener('input',()=>{
    let v = input.value.replace(/[^0-9.,]/g,'').replace(',','.');
    input.value = v;
  });
}

function mascaraPercentual(input){
  input.addEventListener('input',()=>{
    let v = input.value.replace(/[^0-9.,]/g,'').replace(',','.');
    input.value = v;
  });
}

function irRegressivo(dias){
  if(dias<=180) return 0.225;
  if(dias<=360) return 0.20;
  if(dias<=720) return 0.175;
  return 0.15;
}

async function usarCdiAtual(){
  const erro = el('erroCdi');
  erro.style.display='none';
  try{
    const resp = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs/12/dados?formato=json');
    if(!resp.ok) throw new Error('Erro HTTP');
    const dados = await resp.json();
    if(!dados.length) throw new Error('Sem dados');
    const ultimos = dados.slice(-252);
    let acumulado=1;
    ultimos.forEach(d => { const diaria = parseFloat(d.valor.replace(',', '.'))/100; if(!isNaN(diaria)) acumulado*=(1+diaria); });
    const cdiAnual = (acumulado-1)*100;
    el('cdi').value = cdiAnual.toFixed(2);
  }catch(e){
    erro.style.display='block';
  }
}

function validarCampos(){
  let valido = true;
  const campos = [
    ['valorCompra','erroValor','erroValorZero'],
    ['desconto','erroDesconto','erroDescontoZero'],
    ['parcelas','erroParcelas','erroParcelasZero'],
    ['cdi','erroCdiReq','erroCdiZero'],
    ['percentualCdi','erroPercCdi','erroPercCdiZero']
  ];
  campos.forEach(([id,errReq,errZero]) => {
    const val = numero(el(id).value);
    el(errReq).style.display = val===0?'block':'none';
    el(errZero).style.display = val<=0?'block':'none';
    if(val<=0) valido=false;
  });
  return valido;
}

function calcular(){
  if(!validarCampos()) return;
  const valor = numero(el('valorCompra').value);
  const desc = numero(el('desconto').value)/100;
  const parcelas = parseFloat(el('parcelas').value);
  const cdi = numero(el('cdi').value)/100;
  const percCdi = numero(el('percentualCdi').value)/100;

  const vista = valor*(1-desc);
  const taxaMensal = Math.pow(1+cdi*percCdi,1/12)-1;
  const parcela = valor/parcelas;
  let saldo=valor,tabela='',rendimentoTotal=0;

  for(let m=1;m<=parcelas;m++){
    let saldoInicial=saldo;
    let rend = saldo*taxaMensal;
    rendimentoTotal+=rend;
    saldo = saldo+rend-parcela;
    tabela+=`<tr><td>${m}</td><td>R$ ${moeda(saldoInicial)}</td><td>R$ ${moeda(rend)}</td><td>R$ ${moeda(parcela)}</td><td>R$ ${moeda(saldo)}</td></tr>`;
  }

  const dias = parcelas*30;
  const ir = rendimentoTotal*irRegressivo(dias);
  const saldoLiquido = saldo - ir;
  const custoParcelado = valor - saldoLiquido;

  el('veredicto').innerHTML = (custoParcelado < vista
    ? 'Parcelar seria melhor porque o dinheiro renderia enquanto você paga.'
    : 'Pagar à vista seria melhor porque o desconto seria maior.')
    + '<br><br>• Valor efetivo à vista: R$ '+moeda(vista)+'<br>• Valor efetivo parcelado: R$ '+moeda(custoParcelado);

  el('possibilidadeVista').innerHTML = `<strong>Possibilidade 1</strong><br>À vista: R$ ${moeda(vista)}`;
  el('possibilidadeParcelado').innerHTML = `<strong>Possibilidade 2</strong><br><table><tr><th>Mês</th><th>Saldo inicial</th><th>Rendimento</th><th>Parcela</th><th>Saldo final</th></tr>${tabela}</table><br>IR estimado: R$ ${moeda(ir)}<br>Saldo final líquido: R$ ${moeda(saldoLiquido)}`;
}

function limpar(){
  document.querySelectorAll('input').forEach(i=>i.value='');
  document.querySelectorAll('.erro-campo').forEach(e=>e.style.display='none');
  el('veredicto').innerHTML='Preencha os campos e clique em calcular';
  el('possibilidadeVista').innerHTML='';
  el('possibilidadeParcelado').innerHTML='';
}

el('btnCalcular').addEventListener('click',calcular);
el('btnLimpar').addEventListener('click',limpar);
el('btnCdi').addEventListener('click',usarCdiAtual);
el('btnExplicacao').addEventListener('click',()=>{
  const f = el('explicacaoFrame');
  f.style.display = f.style.display==='none'?'block':'none';
});

mascaraMoeda(el('valorCompra'));
mascaraPercentual(el('desconto'));
mascaraPercentual(el('parcelas'));
mascaraPercentual(el('cdi'));
mascaraPercentual(el('percentualCdi'));

window.addEventListener('load',usarCdiAtual);
